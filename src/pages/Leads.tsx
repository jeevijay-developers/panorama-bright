import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";

const mockLeads = [
  { id: "1", name: "Ravi Agarwal", email: "ravi@email.com", phone: "9876543220", source: "Website", interest: "Health", status: "New", assigned: "Amit Patel" },
  { id: "2", name: "Sunita Kapoor", email: "sunita@email.com", phone: "9876543221", source: "Referral", interest: "Motor", status: "Contacted", assigned: "Neha Gupta" },
  { id: "3", name: "Arjun Nair", email: "arjun@email.com", phone: "9876543222", source: "Website", interest: "Life", status: "In Discussion", assigned: "—" },
  { id: "4", name: "Pooja Verma", email: "pooja@email.com", phone: "9876543223", source: "Social Media", interest: "Health", status: "Converted", assigned: "Sanjay Mehta" },
];

const statusColor: Record<string, string> = {
  New: "bg-info/10 text-info border-info/30",
  Contacted: "bg-warning/10 text-warning border-warning/30",
  "In Discussion": "bg-primary/10 text-primary border-primary/30",
  Converted: "bg-success/10 text-success border-success/30",
  Lost: "bg-destructive/10 text-destructive border-destructive/30",
};

const Leads = () => (
  <DashboardLayout title="Leads">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search leads..." className="pl-9" />
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Add Lead</Button>
      </div>
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs">Name</TableHead>
                <TableHead className="text-muted-foreground text-xs">Email</TableHead>
                <TableHead className="text-muted-foreground text-xs">Source</TableHead>
                <TableHead className="text-muted-foreground text-xs">Interest</TableHead>
                <TableHead className="text-muted-foreground text-xs">Assigned To</TableHead>
                <TableHead className="text-muted-foreground text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLeads.map((l) => (
                <TableRow key={l.id} className="border-border/30 cursor-pointer hover:bg-muted/30">
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell className="text-muted-foreground">{l.email}</TableCell>
                  <TableCell className="text-muted-foreground">{l.source}</TableCell>
                  <TableCell className="text-muted-foreground">{l.interest}</TableCell>
                  <TableCell className="text-muted-foreground">{l.assigned}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor[l.status] || ""}>{l.status}</Badge>
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

export default Leads;
