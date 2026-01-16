import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SelectPlan from "./pages/SelectPlan";
import VerifyEmail from "./pages/VerifyEmail";
import TermsOfService from "./pages/TermsOfService";
import ConfirmTrial from "./pages/ConfirmTrial";
import Payment from "./pages/Payment";
import PaymentCustom from "./pages/PaymentCustom";
import PaymentFinish from "./pages/PaymentFinish";
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
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/select-plan" element={<SelectPlan />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/confirm-trial" element={<ConfirmTrial />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/payment/:orderId" element={<PaymentCustom />} />
          <Route path="/payment/finish" element={<PaymentFinish />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
