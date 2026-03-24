import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RenewalWidget } from "@/components/dashboard/RenewalWidget";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { IntermediaryTable } from "@/components/dashboard/IntermediaryTable";
import { FileText, Users, Clock, DollarSign, Target } from "lucide-react";

const Index = () => {
  // TODO: Replace with real role check
  const isAdmin = true;

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Active Policies"
            value="156"
            icon={FileText}
            variant="primary"
            trend={{ value: 12, label: "vs last month" }}
          />
          <StatCard
            title="Total Clients"
            value="136"
            icon={Users}
            variant="success"
            trend={{ value: 8, label: "vs last month" }}
          />
          <StatCard
            title="Pending Payments"
            value="23"
            icon={Clock}
            variant="warning"
            subtitle="₹3,45,000 outstanding"
          />
          <StatCard
            title="Total Revenue"
            value="₹44.8L"
            icon={DollarSign}
            variant="primary"
            trend={{ value: 15, label: "this quarter" }}
          />
          <StatCard
            title="Active Leads"
            value="18"
            icon={Target}
            variant="default"
            trend={{ value: -5, label: "vs last month" }}
          />
        </div>

        {/* Charts + Renewals Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart />
          <RenewalWidget />
        </div>

        {/* Intermediary Table (Admin only) */}
        {isAdmin && <IntermediaryTable />}
      </div>
    </DashboardLayout>
  );
};

export default Index;
