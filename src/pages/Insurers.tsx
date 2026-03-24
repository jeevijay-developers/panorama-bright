import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";

const mockInsurers = [
  { id: "1", name: "HDFC Ergo", contact: "support@hdfcergo.com", intermediaries: 12, status: "Active" },
  { id: "2", name: "ICICI Lombard", contact: "help@icicilombard.com", intermediaries: 8, status: "Active" },
  { id: "3", name: "LIC", contact: "info@lic.in", intermediaries: 15, status: "Active" },
  { id: "4", name: "Star Health", contact: "care@starhealth.in", intermediaries: 6, status: "Inactive" },
];

const Insurers = () => (
  <DashboardLayout title="Insurers">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search insurers..." className="pl-9" />
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Add Insurer</Button>
      </div>
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs">Name</TableHead>
                <TableHead className="text-muted-foreground text-xs">Contact</TableHead>
                <TableHead className="text-muted-foreground text-xs">Intermediaries</TableHead>
                <TableHead className="text-muted-foreground text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInsurers.map((i) => (
                <TableRow key={i.id} className="border-border/30 cursor-pointer hover:bg-muted/30">
                  <TableCell className="font-medium">{i.name}</TableCell>
                  <TableCell className="text-muted-foreground">{i.contact}</TableCell>
                  <TableCell>{i.intermediaries}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={i.status === "Active" ? "bg-success/10 text-success border-success/30" : "bg-muted text-muted-foreground"}>
                      {i.status}
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

export default Insurers;
