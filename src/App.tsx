import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import CreateInvoice from "@/pages/CreateInvoice";
import InvoiceHistory from "@/pages/InvoiceHistory";
import Clients from "@/pages/Clients";
import Business from "@/pages/Business";
import TemplateEditor from "@/pages/TemplateEditor";
import BusinessTools from "@/pages/BusinessTools";
import RecurringInvoices from "@/pages/RecurringInvoices";
import Settings from "@/pages/Settings";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/invoices/create" element={<CreateInvoice />} />
                <Route path="/invoices/history" element={<InvoiceHistory />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/business" element={<Business />} />
                <Route path="/templates" element={<TemplateEditor />} />
                <Route path="/tools" element={<BusinessTools />} />
                <Route path="/recurring" element={<RecurringInvoices />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
