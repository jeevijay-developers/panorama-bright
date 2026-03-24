import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, Eye, Upload, FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Policy = Tables<"policies">;

interface PolicyWithRelations extends Policy {
  clients?: { full_name: string } | null;
  insurers?: { name: string } | null;
}

const statusColor: Record<string, string> = {
  active: "bg-success/10 text-success border-success/30",
  expiring: "bg-warning/10 text-warning border-warning/30",
  expired: "bg-destructive/10 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground",
};

const Policies = () => {
  const { profileId, role } = useAuth();
  const isAdmin = role === "super_admin";
  const [policies, setPolicies] = useState<PolicyWithRelations[]>([]);
  const [clients, setClients] = useState<{ id: string; full_name: string }[]>([]);
  const [insurers, setInsurers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyWithRelations | null>(null);
  const [viewingPolicy, setViewingPolicy] = useState<PolicyWithRelations | null>(null);
  const [deletingPolicy, setDeletingPolicy] = useState<PolicyWithRelations | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    policy_number: "", client_id: "", insurer_id: "", policy_type: "general",
    premium_amount: "", coverage_amount: "", start_date: "", end_date: "",
    status: "active" as string,
  });
  const [docFile, setDocFile] = useState<File | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [polRes, cliRes, insRes] = await Promise.all([
      supabase.from("policies").select("*, clients(full_name), insurers(name)").order("created_at", { ascending: false }),
      supabase.from("clients").select("id, full_name").order("full_name"),
      supabase.from("insurers").select("id, name").eq("is_active", true).order("name"),
    ]);
    if (polRes.data) setPolicies(polRes.data as PolicyWithRelations[]);
    if (cliRes.data) setClients(cliRes.data);
    if (insRes.data) setInsurers(insRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const policyTypes = useMemo(() => {
    const types = new Set(policies.map((p) => p.policy_type));
    return Array.from(types).sort();
  }, [policies]);

  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const s = searchTerm.toLowerCase();
      const matchSearch = !s || p.policy_number.toLowerCase().includes(s) || (p.clients?.full_name?.toLowerCase().includes(s));
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchType = typeFilter === "all" || p.policy_type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [policies, searchTerm, statusFilter, typeFilter]);

  const openAdd = () => {
    setEditingPolicy(null);
    setFormData({ policy_number: "", client_id: "", insurer_id: "", policy_type: "general", premium_amount: "", coverage_amount: "", start_date: "", end_date: "", status: "active" });
    setDocFile(null);
    setFormOpen(true);
  };

  const openEdit = (p: PolicyWithRelations) => {
    setEditingPolicy(p);
    setFormData({
      policy_number: p.policy_number,
      client_id: p.client_id,
      insurer_id: p.insurer_id || "",
      policy_type: p.policy_type,
      premium_amount: String(p.premium_amount),
      coverage_amount: p.coverage_amount ? String(p.coverage_amount) : "",
      start_date: p.start_date,
      end_date: p.end_date,
      status: p.status,
    });
    setDocFile(null);
    setFormOpen(true);
  };

  const uploadDocument = async (policyId: string): Promise<string | null> => {
    if (!docFile) return null;
    setUploading(true);
    const ext = docFile.name.split(".").pop();
    const path = `${policyId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("policy-documents").upload(path, docFile);
    setUploading(false);
    if (error) { toast.error("Document upload failed"); return null; }
    return path;
  };

  const handleSave = async () => {
    if (!formData.policy_number.trim() || !formData.client_id || !formData.start_date || !formData.end_date) {
      toast.error("Policy number, client, and dates are required");
      return;
    }
    if (!profileId) { toast.error("Profile not loaded"); return; }
    setSaving(true);
    try {
      const payload = {
        policy_number: formData.policy_number.trim(),
        client_id: formData.client_id,
        insurer_id: formData.insurer_id || null,
        policy_type: formData.policy_type,
        premium_amount: Number(formData.premium_amount) || 0,
        coverage_amount: formData.coverage_amount ? Number(formData.coverage_amount) : null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: formData.status as Policy["status"],
      };

      if (editingPolicy) {
        const docUrl = await uploadDocument(editingPolicy.id);
        const updatePayload = docUrl ? { ...payload, original_document_url: docUrl } : payload;
        const { error } = await supabase.from("policies").update(updatePayload).eq("id", editingPolicy.id);
        if (error) throw error;
        toast.success("Policy updated");
      } else {
        const { data, error } = await supabase.from("policies").insert({ ...payload, intermediary_id: profileId }).select().single();
        if (error) throw error;
        if (docFile && data) {
          const docUrl = await uploadDocument(data.id);
          if (docUrl) await supabase.from("policies").update({ original_document_url: docUrl }).eq("id", data.id);
        }
        toast.success("Policy created");
      }
      setFormOpen(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deletingPolicy) return;
    const { error } = await supabase.from("policies").delete().eq("id", deletingPolicy.id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Policy deleted"); fetchData(); }
    setDeleteOpen(false);
    setDeletingPolicy(null);
  };

  const handleExtractOcr = async (policy: PolicyWithRelations) => {
    if (!policy.original_document_url) { toast.error("No document uploaded"); return; }
    toast.info("Extracting data from document...");
    try {
      const { data, error } = await supabase.functions.invoke("extract-policy-data", {
        body: { policyId: policy.id, documentPath: policy.original_document_url },
      });
      if (error) throw error;
      toast.success("Data extracted successfully");
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "OCR extraction failed");
    }
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <DashboardLayout title="Policies">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by policy # or client..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring">Expiring</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            {policyTypes.length > 1 && (
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {policyTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <Button className="gap-2" onClick={openAdd}><Plus className="h-4 w-4" /> New Policy</Button>
        </div>

        <Card className="border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs">Policy #</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Client</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Type</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Insurer</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Premium</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Expiry</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filteredPolicies.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No policies found</TableCell></TableRow>
                ) : (
                  filteredPolicies.map((p) => (
                    <TableRow key={p.id} className="border-border/30 hover:bg-muted/30">
                      <TableCell className="font-mono text-sm font-medium">{p.policy_number}</TableCell>
                      <TableCell>{p.clients?.full_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground capitalize">{p.policy_type}</TableCell>
                      <TableCell className="text-muted-foreground">{p.insurers?.name || "—"}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(p.premium_amount)}</TableCell>
                      <TableCell className="text-muted-foreground">{p.end_date}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColor[p.status] || ""}>{p.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setViewingPolicy(p); setViewOpen(true); }}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setDeletingPolicy(p); setDeleteOpen(true); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? "Edit Policy" : "New Policy"}</DialogTitle>
            <DialogDescription>{editingPolicy ? "Update policy details" : "Create a new insurance policy"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Policy Number *</Label>
                <Input placeholder="POL-2024-001" value={formData.policy_number} onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Policy Type</Label>
                <Select value={formData.policy_type} onValueChange={(v) => setFormData({ ...formData, policy_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="motor">Motor</SelectItem>
                    <SelectItem value="life">Life</SelectItem>
                    <SelectItem value="property">Property</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={formData.client_id} onValueChange={(v) => setFormData({ ...formData, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Insurer</Label>
                <Select value={formData.insurer_id} onValueChange={(v) => setFormData({ ...formData, insurer_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select insurer" /></SelectTrigger>
                  <SelectContent>{insurers.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Premium Amount</Label>
                <Input type="number" placeholder="0" value={formData.premium_amount} onChange={(e) => setFormData({ ...formData, premium_amount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Coverage Amount</Label>
                <Input type="number" placeholder="0" value={formData.coverage_amount} onChange={(e) => setFormData({ ...formData, coverage_amount: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
              </div>
            </div>
            {editingPolicy && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expiring">Expiring</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Upload Document</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || uploading}>{saving ? "Saving..." : editingPolicy ? "Update" : "Create Policy"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Policy Details</DialogTitle>
            <DialogDescription>Viewing policy information</DialogDescription>
          </DialogHeader>
          {viewingPolicy && (
            <div className="space-y-3 py-2">
              <div><Label className="text-muted-foreground text-xs">Policy Number</Label><p className="font-mono font-medium">{viewingPolicy.policy_number}</p></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground text-xs">Client</Label><p>{viewingPolicy.clients?.full_name || "—"}</p></div>
                <div><Label className="text-muted-foreground text-xs">Insurer</Label><p>{viewingPolicy.insurers?.name || "—"}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground text-xs">Type</Label><p className="capitalize">{viewingPolicy.policy_type}</p></div>
                <div><Label className="text-muted-foreground text-xs">Status</Label><Badge variant="outline" className={statusColor[viewingPolicy.status]}>{viewingPolicy.status}</Badge></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground text-xs">Premium</Label><p className="font-medium">{formatCurrency(viewingPolicy.premium_amount)}</p></div>
                <div><Label className="text-muted-foreground text-xs">Coverage</Label><p>{viewingPolicy.coverage_amount ? formatCurrency(viewingPolicy.coverage_amount) : "—"}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground text-xs">Start Date</Label><p>{viewingPolicy.start_date}</p></div>
                <div><Label className="text-muted-foreground text-xs">End Date</Label><p>{viewingPolicy.end_date}</p></div>
              </div>
              {viewingPolicy.original_document_url && (
                <div>
                  <Label className="text-muted-foreground text-xs">Document</Label>
                  <div className="flex gap-2 mt-1">
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => handleExtractOcr(viewingPolicy)}>
                      <FileDown className="h-3 w-3" /> Extract Data (OCR)
                    </Button>
                  </div>
                </div>
              )}
              {viewingPolicy.ocr_extracted_data && (
                <div>
                  <Label className="text-muted-foreground text-xs">OCR Extracted Data</Label>
                  <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-32">{JSON.stringify(viewingPolicy.ocr_extracted_data, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Policy</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete policy "{deletingPolicy?.policy_number}"? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Policies;
