import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const mockRenewals = [
  { id: "1", client: "Priya Sharma", policy: "POL-2024-001", expiry: "2026-03-28", daysLeft: 4, status: "Reminder Sent", premium: "₹45,000" },
  { id: "2", client: "Rajesh Kumar", policy: "POL-2024-012", expiry: "2026-04-02", daysLeft: 9, status: "Upcoming", premium: "₹32,000" },
  { id: "3", client: "Anita Desai", policy: "POL-2024-034", expiry: "2026-04-08", daysLeft: 15, status: "Upcoming", premium: "₹78,000" },
  { id: "4", client: "Vikram Singh", policy: "POL-2024-056", expiry: "2026-02-15", daysLeft: 0, status: "Lapsed", premium: "₹55,000" },
];

const statusColor: Record<string, string> = {
  Upcoming: "bg-info/10 text-info border-info/30",
  "Reminder Sent": "bg-warning/10 text-warning border-warning/30",
  Renewed: "bg-success/10 text-success border-success/30",
  Lapsed: "bg-destructive/10 text-destructive border-destructive/30",
};

const Renewals = () => (
  <DashboardLayout title="Renewals">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search renewals..." className="pl-9" />
        </div>
        <div className="flex gap-2">
          {["All", "Upcoming", "Reminder Sent", "Renewed", "Lapsed"].map((f) => (
            <Button key={f} variant={f === "All" ? "default" : "outline"} size="sm">{f}</Button>
          ))}
        </div>
      </div>
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs">Client</TableHead>
                <TableHead className="text-muted-foreground text-xs">Policy</TableHead>
                <TableHead className="text-muted-foreground text-xs">Expiry</TableHead>
                <TableHead className="text-muted-foreground text-xs">Days Left</TableHead>
                <TableHead className="text-muted-foreground text-xs">Premium</TableHead>
                <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                <TableHead className="text-muted-foreground text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRenewals.map((r) => (
                <TableRow key={r.id} className="border-border/30">
                  <TableCell className="font-medium">{r.client}</TableCell>
                  <TableCell className="font-mono text-sm">{r.policy}</TableCell>
                  <TableCell className="text-muted-foreground">{r.expiry}</TableCell>
                  <TableCell className={r.daysLeft <= 7 ? "text-destructive font-medium" : ""}>{r.daysLeft || "—"}</TableCell>
                  <TableCell>{r.premium}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor[r.status] || ""}>{r.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {r.status !== "Renewed" && r.status !== "Lapsed" && (
                      <Button size="sm" variant="outline">Mark Renewed</Button>
                    )}
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

export default Renewals;
