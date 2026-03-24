import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Clients from "./pages/Clients";
import Policies from "./pages/Policies";
import Quotations from "./pages/Quotations";
import Renewals from "./pages/Renewals";
import Leads from "./pages/Leads";
import Insurers from "./pages/Insurers";
import Commissions from "./pages/Commissions";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/quotations" element={<Quotations />} />
          <Route path="/renewals" element={<Renewals />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/insurers" element={<Insurers />} />
          <Route path="/commissions" element={<Commissions />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
