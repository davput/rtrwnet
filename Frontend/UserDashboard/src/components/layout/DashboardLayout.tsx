
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./Sidebar";
import { DashboardHeader } from "./Header";
import { LiveChat } from "@/components/chat/LiveChat";
import { useState } from "react";
import { Outlet } from "react-router-dom";

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps = {}) {
  const [open, setOpen] = useState(() => {
    // Initialize from localStorage
    const savedState = localStorage.getItem("sidebar-state");
    return savedState !== "collapsed";
  });

  // Save sidebar state to localStorage when it changes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    localStorage.setItem("sidebar-state", newOpen ? "expanded" : "collapsed");
  };

  return (
    <SidebarProvider open={open} onOpenChange={handleOpenChange}>
      <div className="h-screen flex w-full overflow-hidden">
        <DashboardSidebar />
        <div className="flex flex-col flex-1 w-full h-screen overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6 bg-background">
            {children || <Outlet />}
          </main>
        </div>
      </div>
      <LiveChat />
    </SidebarProvider>
  );
}
