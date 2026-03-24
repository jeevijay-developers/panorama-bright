import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

const mockCommissions = [
  { id: "1", intermediary: "Amit Patel", insurer: "HDFC Ergo", policy: "POL-2024-001", premium: "₹45,000", rate: "15%", commission: "₹6,750", status: "Paid" },
  { id: "2", intermediary: "Neha Gupta", insurer: "ICICI Lombard", policy: "POL-2024-012", premium: "₹32,000", rate: "12%", commission: "₹3,840", status: "Pending" },
  { id: "3", intermediary: "Sanjay Mehta", insurer: "LIC", policy: "POL-2024-034", premium: "₹78,000", rate: "10%", commission: "₹7,800", status: "Paid" },
  { id: "4", intermediary: "Kavita Joshi", insurer: "Star Health", policy: "POL-2024-056", premium: "₹55,000", rate: "14%", commission: "₹7,700", status: "Pending" },
];

const Commissions = () => (
  <DashboardLayout title="Commissions">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search commissions..." className="pl-9" />
        </div>
      </div>
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs">Intermediary</TableHead>
                <TableHead className="text-muted-foreground text-xs">Insurer</TableHead>
                <TableHead className="text-muted-foreground text-xs">Policy</TableHead>
                <TableHead className="text-muted-foreground text-xs">Premium</TableHead>
                <TableHead className="text-muted-foreground text-xs">Rate</TableHead>
                <TableHead className="text-muted-foreground text-xs">Commission</TableHead>
                <TableHead className="text-muted-foreground text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCommissions.map((c) => (
                <TableRow key={c.id} className="border-border/30">
                  <TableCell className="font-medium">{c.intermediary}</TableCell>
                  <TableCell className="text-muted-foreground">{c.insurer}</TableCell>
                  <TableCell className="font-mono text-sm">{c.policy}</TableCell>
                  <TableCell>{c.premium}</TableCell>
                  <TableCell>{c.rate}</TableCell>
                  <TableCell className="font-medium">{c.commission}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={c.status === "Paid" ? "bg-success/10 text-success border-success/30" : "bg-warning/10 text-warning border-warning/30"}>
                      {c.status}
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

export default Commissions;
