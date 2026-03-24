import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";

const mockQuotations = [
  { id: "1", client: "Priya Sharma", policy: "POL-2024-001", sentVia: "Email", sentAt: "2026-03-20", paymentStatus: "Pending" },
  { id: "2", client: "Rajesh Kumar", policy: "POL-2024-012", sentVia: "WhatsApp", sentAt: "2026-03-18", paymentStatus: "Paid" },
  { id: "3", client: "Anita Desai", policy: "POL-2024-034", sentVia: "Email", sentAt: "2026-03-15", paymentStatus: "Expired" },
];

const paymentColor: Record<string, string> = {
  Pending: "bg-warning/10 text-warning border-warning/30",
  Paid: "bg-success/10 text-success border-success/30",
  Expired: "bg-destructive/10 text-destructive border-destructive/30",
};

const Quotations = () => (
  <DashboardLayout title="Quotations">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search quotations..." className="pl-9" />
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> New Quotation</Button>
      </div>
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs">Client</TableHead>
                <TableHead className="text-muted-foreground text-xs">Policy</TableHead>
                <TableHead className="text-muted-foreground text-xs">Sent Via</TableHead>
                <TableHead className="text-muted-foreground text-xs">Sent At</TableHead>
                <TableHead className="text-muted-foreground text-xs">Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockQuotations.map((q) => (
                <TableRow key={q.id} className="border-border/30 cursor-pointer hover:bg-muted/30">
                  <TableCell className="font-medium">{q.client}</TableCell>
                  <TableCell className="font-mono text-sm">{q.policy}</TableCell>
                  <TableCell className="text-muted-foreground">{q.sentVia}</TableCell>
                  <TableCell className="text-muted-foreground">{q.sentAt}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={paymentColor[q.paymentStatus] || ""}>{q.paymentStatus}</Badge>
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

export default Quotations;
