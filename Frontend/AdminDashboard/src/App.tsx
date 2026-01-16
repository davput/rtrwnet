import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { MainLayout } from "@/components/layout/MainLayout";
import { Dashboard } from "@/pages/Dashboard";
import { Tenants } from "@/pages/Tenants";
import { TenantDetail } from "@/pages/TenantDetail";
import { Plans } from "@/pages/Plans";
import { AdminUsers } from "@/pages/AdminUsers";
import { AuditLogs } from "@/pages/AuditLogs";
import { Support } from "@/pages/Support";
import { SupportDetail } from "@/pages/SupportDetail";
import { Settings } from "@/pages/Settings";
import { Login } from "@/pages/Login";
import { Payments } from "@/pages/Payments";
import { LiveChats } from "@/pages/LiveChats";
import Notifications from "@/pages/Notifications";

// Auth guard component
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("admin_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="admin-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="tenants" element={<Tenants />} />
            <Route path="tenants/:id" element={<TenantDetail />} />
            <Route path="plans" element={<Plans />} />
            <Route path="payments" element={<Payments />} />
            <Route path="admins" element={<AdminUsers />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="support" element={<Support />} />
            <Route path="support/:id" element={<SupportDetail />} />
            <Route path="live-chats" element={<LiveChats />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
