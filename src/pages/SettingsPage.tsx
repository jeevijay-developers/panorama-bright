import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";

const mockUsers = [
  { id: "1", name: "Admin User", email: "admin@riskmarshal.com", role: "Super Admin", status: "Active" },
  { id: "2", name: "Amit Patel", email: "amit@riskmarshal.com", role: "Intermediary", status: "Active" },
  { id: "3", name: "Neha Gupta", email: "neha@riskmarshal.com", role: "Intermediary", status: "Active" },
  { id: "4", name: "Rajan Staff", email: "rajan@riskmarshal.com", role: "Staff", status: "Inactive" },
];

const roleColor: Record<string, string> = {
  "Super Admin": "bg-primary/10 text-primary border-primary/30",
  Intermediary: "bg-info/10 text-info border-info/30",
  Staff: "bg-muted text-muted-foreground",
};

const SettingsPage = () => (
  <DashboardLayout title="Settings & User Management">
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">User Management</CardTitle>
            <Button className="gap-2" size="sm"><Plus className="h-4 w-4" /> Add User</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs">Name</TableHead>
                <TableHead className="text-muted-foreground text-xs">Email</TableHead>
                <TableHead className="text-muted-foreground text-xs">Role</TableHead>
                <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                <TableHead className="text-muted-foreground text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((u) => (
                <TableRow key={u.id} className="border-border/30">
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={roleColor[u.role] || ""}>{u.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={u.status === "Active" ? "bg-success/10 text-success border-success/30" : "bg-muted text-muted-foreground"}>
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Edit</Button>
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

export default SettingsPage;
