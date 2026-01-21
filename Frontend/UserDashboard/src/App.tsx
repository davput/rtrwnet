import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SubscriptionGuard } from "./components/auth/SubscriptionGuard";
import { OnboardingGuard } from "./components/auth/OnboardingGuard";
import { FeatureProtectedRoute } from "./components/auth/FeatureProtectedRoute";
import { PlanLimitsProvider } from "./contexts/PlanLimitsContext";

// Features
import { LoginPage, RegisterPage } from "@/features/auth";
import { DashboardPage } from "@/features/dashboard";
import { CustomersPage, CustomerDetailPage, CustomerForm, CustomerSettings } from "@/features/customers";
import { ServicePlansPage, ServicePlanForm } from "@/features/service-plans";
import { PaymentsPage } from "@/features/payments";
import { TicketsPage, TicketDetailPage, TicketForm } from "@/features/tickets";
import { InfrastructurePage } from "@/features/infrastructure";
import { DevicesPage } from "@/features/devices";
import { RadiusPage } from "@/features/radius";

// Legacy pages (to be migrated)
import ServicePlanDetailPage from "./pages/ServicePlanDetail";
import ServicePlansCatalogPage from "./pages/ServicePlansCatalog";
import BillingPage from "./pages/BillingPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentInstructionPage from "./pages/PaymentInstructionPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import AccountSettings from "./pages/AccountSettings";
import SubscriptionRequired from "./pages/SubscriptionRequired";
import SetupWizard from "./pages/SetupWizard";
import SupportTickets from "./pages/SupportTickets";
import SupportTicketDetail from "./pages/SupportTicketDetail";
import NotificationsPage from "./pages/NotificationsPage";

// Hotspot pages
import HotspotPackages from "./pages/HotspotPackages";
import HotspotUsers from "./pages/HotspotUsers";
import HotspotSessions from "./pages/HotspotSessions";
import HotspotPortal from "./pages/HotspotPortal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="rtwnet-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Subscription required page (protected but no subscription check) */}
            <Route path="/subscription-required" element={
              <ProtectedRoute>
                <SubscriptionRequired />
              </ProtectedRoute>
            } />
            
            {/* Setup wizard page (protected, after subscription, before onboarding) */}
            <Route path="/setup" element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <SetupWizard />
                </SubscriptionGuard>
              </ProtectedRoute>
            } />
            
            {/* Protected routes wrapped in DashboardLayout with Subscription Guard and Onboarding Guard */}
            <Route element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <OnboardingGuard>
                    <PlanLimitsProvider>
                      <DashboardLayout />
                    </PlanLimitsProvider>
                  </OnboardingGuard>
                </SubscriptionGuard>
              </ProtectedRoute>
            }>
              <Route path="/" element={<DashboardPage />} />
              
              {/* Customers - requires customer_management feature */}
              <Route path="/pelanggan" element={
                <FeatureProtectedRoute feature="customer_management">
                  <CustomersPage />
                </FeatureProtectedRoute>
              } />
              <Route path="/pelanggan/tambah" element={
                <FeatureProtectedRoute feature="customer_management">
                  <CustomerForm />
                </FeatureProtectedRoute>
              } />
              <Route path="/pelanggan/:id" element={
                <FeatureProtectedRoute feature="customer_management">
                  <CustomerDetailPage />
                </FeatureProtectedRoute>
              } />
              <Route path="/pelanggan/:id/edit" element={
                <FeatureProtectedRoute feature="customer_management">
                  <CustomerForm mode="edit" />
                </FeatureProtectedRoute>
              } />
              
              {/* Service Plans */}
              <Route path="/paket-internet" element={<ServicePlansPage />} />
              <Route path="/paket-internet/katalog" element={<ServicePlansCatalogPage />} />
              <Route path="/paket-internet/:id" element={<ServicePlanDetailPage />} />
              
              {/* Payments - requires billing_management feature */}
              <Route path="/pembayaran" element={
                <FeatureProtectedRoute feature="billing_management">
                  <PaymentsPage />
                </FeatureProtectedRoute>
              } />
              
              {/* Tickets */}
              <Route path="/tiket" element={<TicketsPage />} />
              <Route path="/tiket/tambah" element={<TicketForm />} />
              <Route path="/tiket/:id" element={<TicketDetailPage />} />
              
              {/* Support Tickets (communication with platform admin) */}
              <Route path="/support-tickets" element={<SupportTickets />} />
              <Route path="/support-tickets/:id" element={<SupportTicketDetail />} />
              
              {/* Notifications */}
              <Route path="/notifikasi" element={<NotificationsPage />} />
              
              {/* Infrastructure - requires network_monitoring feature */}
              <Route path="/infrastruktur" element={
                <FeatureProtectedRoute feature="network_monitoring">
                  <InfrastructurePage />
                </FeatureProtectedRoute>
              } />
              
              {/* Devices - requires device_management feature */}
              <Route path="/perangkat" element={
                <FeatureProtectedRoute feature="device_management">
                  <DevicesPage />
                </FeatureProtectedRoute>
              } />

              {/* RADIUS - requires mikrotik_integration feature */}
              <Route path="/radius" element={
                <FeatureProtectedRoute feature="mikrotik_integration">
                  <RadiusPage />
                </FeatureProtectedRoute>
              } />

              {/* Hotspot - requires hotspot_management feature */}
              <Route path="/hotspot/paket" element={
                <FeatureProtectedRoute feature="hotspot_management">
                  <HotspotPackages />
                </FeatureProtectedRoute>
              } />
              <Route path="/hotspot/users" element={
                <FeatureProtectedRoute feature="hotspot_management">
                  <HotspotUsers />
                </FeatureProtectedRoute>
              } />
              <Route path="/hotspot/sesi" element={
                <FeatureProtectedRoute feature="hotspot_management">
                  <HotspotSessions />
                </FeatureProtectedRoute>
              } />
              <Route path="/hotspot/portal" element={
                <FeatureProtectedRoute feature="hotspot_management">
                  <HotspotPortal />
                </FeatureProtectedRoute>
              } />
              
              {/* Settings */}
              <Route path="/akun-settings" element={<AccountSettings />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/payment/:orderId" element={<PaymentPage />} />
              <Route path="/payment/:orderId/instruction" element={<PaymentInstructionPage />} />
              <Route path="/pengaturan" element={<SettingsPage />} />
            </Route>
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
