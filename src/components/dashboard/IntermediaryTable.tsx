import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const intermediaries = [
  { name: "Amit Patel", activePolicies: 45, clients: 38, revenue: "₹12,50,000", renewalRate: 92 },
  { name: "Neha Gupta", activePolicies: 32, clients: 28, revenue: "₹8,75,000", renewalRate: 88 },
  { name: "Sanjay Mehta", activePolicies: 58, clients: 51, revenue: "₹18,20,000", renewalRate: 95 },
  { name: "Kavita Joshi", activePolicies: 21, clients: 19, revenue: "₹5,40,000", renewalRate: 78 },
];

export function IntermediaryTable() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Intermediary Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs">Name</TableHead>
              <TableHead className="text-muted-foreground text-xs">Policies</TableHead>
              <TableHead className="text-muted-foreground text-xs">Clients</TableHead>
              <TableHead className="text-muted-foreground text-xs">Revenue</TableHead>
              <TableHead className="text-muted-foreground text-xs">Renewal Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {intermediaries.map((i) => (
              <TableRow key={i.name} className="border-border/30">
                <TableCell className="font-medium text-sm">{i.name}</TableCell>
                <TableCell className="text-sm">{i.activePolicies}</TableCell>
                <TableCell className="text-sm">{i.clients}</TableCell>
                <TableCell className="text-sm">{i.revenue}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={i.renewalRate >= 90
                      ? "bg-success/10 text-success border-success/30"
                      : i.renewalRate >= 80
                        ? "bg-warning/10 text-warning border-warning/30"
                        : "bg-destructive/10 text-destructive border-destructive/30"
                    }
                  >
                    {i.renewalRate}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
