import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { initializeDemoData } from "@/store/useStore";
import Dashboard from "@/pages/Dashboard";
import CreateInvoice from "@/pages/CreateInvoice";
import InvoiceHistory from "@/pages/InvoiceHistory";
import Clients from "@/pages/Clients";
import Business from "@/pages/Business";
import TemplateEditor from "@/pages/TemplateEditor";
import BusinessTools from "@/pages/BusinessTools";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    initializeDemoData();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/invoices/create" element={<CreateInvoice />} />
              <Route path="/invoices/history" element={<InvoiceHistory />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/business" element={<Business />} />
              <Route path="/templates" element={<TemplateEditor />} />
              <Route path="/tools" element={<BusinessTools />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
