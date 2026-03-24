import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Renewal {
  id: string;
  clientName: string;
  policyNumber: string;
  expiryDate: string;
  daysLeft: number;
  premium: string;
}

const mockRenewals: Renewal[] = [
  { id: "1", clientName: "Priya Sharma", policyNumber: "POL-2024-001", expiryDate: "2026-03-28", daysLeft: 4, premium: "₹45,000" },
  { id: "2", clientName: "Rajesh Kumar", policyNumber: "POL-2024-012", expiryDate: "2026-04-02", daysLeft: 9, premium: "₹32,000" },
  { id: "3", clientName: "Anita Desai", policyNumber: "POL-2024-034", expiryDate: "2026-04-08", daysLeft: 15, premium: "₹78,000" },
  { id: "4", clientName: "Vikram Singh", policyNumber: "POL-2024-056", expiryDate: "2026-04-18", daysLeft: 25, premium: "₹55,000" },
];

function getUrgencyColor(days: number) {
  if (days <= 7) return "bg-destructive/15 text-destructive border-destructive/30";
  if (days <= 15) return "bg-warning/15 text-warning border-warning/30";
  return "bg-info/15 text-info border-info/30";
}

function getUrgencyLabel(days: number) {
  if (days <= 7) return "Critical";
  if (days <= 15) return "Urgent";
  return "Upcoming";
}

export function RenewalWidget() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary" />
            Upcoming Renewals
          </CardTitle>
          <Badge variant="secondary" className="text-xs">{mockRenewals.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockRenewals.map((renewal) => (
          <div
            key={renewal.id}
            className="flex items-center justify-between p-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{renewal.clientName}</p>
              <p className="text-xs text-muted-foreground">{renewal.policyNumber}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">{renewal.premium}</span>
              <Badge
                variant="outline"
                className={cn("text-[10px] px-2 py-0.5", getUrgencyColor(renewal.daysLeft))}
              >
                {renewal.daysLeft}d — {getUrgencyLabel(renewal.daysLeft)}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
