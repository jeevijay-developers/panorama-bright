import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Upload } from "lucide-react";

const mockPolicies = [
  { id: "1", number: "POL-2024-001", client: "Priya Sharma", type: "Health", insurer: "HDFC Ergo", premium: "₹45,000", status: "Active", endDate: "2026-03-28" },
  { id: "2", number: "POL-2024-012", client: "Rajesh Kumar", type: "Motor", insurer: "ICICI Lombard", premium: "₹32,000", status: "Active", endDate: "2026-04-02" },
  { id: "3", number: "POL-2024-034", client: "Anita Desai", type: "Life", insurer: "LIC", premium: "₹78,000", status: "Expiring", endDate: "2026-04-08" },
  { id: "4", number: "POL-2024-056", client: "Vikram Singh", type: "Health", insurer: "Star Health", premium: "₹55,000", status: "Active", endDate: "2026-09-15" },
];

const statusColor: Record<string, string> = {
  Active: "bg-success/10 text-success border-success/30",
  Expiring: "bg-warning/10 text-warning border-warning/30",
  Expired: "bg-destructive/10 text-destructive border-destructive/30",
};

const Policies = () => {
  return (
    <DashboardLayout title="Policies">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search policies..." className="pl-9" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" /> Upload Policy
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> New Policy
            </Button>
          </div>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPolicies.map((p) => (
                  <TableRow key={p.id} className="border-border/30 cursor-pointer hover:bg-muted/30">
                    <TableCell className="font-mono text-sm font-medium">{p.number}</TableCell>
                    <TableCell>{p.client}</TableCell>
                    <TableCell className="text-muted-foreground">{p.type}</TableCell>
                    <TableCell className="text-muted-foreground">{p.insurer}</TableCell>
                    <TableCell className="font-medium">{p.premium}</TableCell>
                    <TableCell className="text-muted-foreground">{p.endDate}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor[p.status] || ""}>
                        {p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Policies;
