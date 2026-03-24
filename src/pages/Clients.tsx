import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";

const mockClients = [
  { id: "1", name: "Priya Sharma", email: "priya@email.com", phone: "9876543210", policies: 3, status: "Active" },
  { id: "2", name: "Rajesh Kumar", email: "rajesh@email.com", phone: "9876543211", policies: 2, status: "Active" },
  { id: "3", name: "Anita Desai", email: "anita@email.com", phone: "9876543212", policies: 1, status: "Inactive" },
  { id: "4", name: "Vikram Singh", email: "vikram@email.com", phone: "9876543213", policies: 4, status: "Active" },
  { id: "5", name: "Meera Reddy", email: "meera@email.com", phone: "9876543214", policies: 2, status: "Active" },
];

const Clients = () => {
  return (
    <DashboardLayout title="Clients">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search clients..." className="pl-9" />
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add Client
          </Button>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs">Name</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Email</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Phone</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Policies</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockClients.map((c) => (
                  <TableRow key={c.id} className="border-border/30 cursor-pointer hover:bg-muted/30">
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.email}</TableCell>
                    <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                    <TableCell>{c.policies}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={c.status === "Active" ? "bg-success/10 text-success border-success/30" : "bg-muted text-muted-foreground"}>
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
};

export default Clients;
