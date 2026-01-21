import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Home,
  Users,
  ChevronDown,
  CreditCard,
  Settings,
  Wifi,
  LogOut,
  ServerIcon,
  UserCircle,
  ChevronUp,
  Receipt,
  Ticket,
  Router,
  Lock,
  HelpCircle,
  Radio,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, memo } from "react";
import { useAuth } from "@/features/auth/auth.store";
import { usePlanLimits } from "@/contexts/PlanLimitsContext";

export const DashboardSidebar = memo(function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const { user, logout } = useAuth();
  const { hasFeature } = usePlanLimits();
  const isCollapsed = state === "collapsed";

  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const ispName = user?.isp_name || user?.name || "RT/RW Net";
  const userName = user?.name || "User";
  const userEmail = user?.email || "user@example.com";
  const currentPath = useMemo(() => location.pathname, [location.pathname]);

  const hasCustomerManagement = hasFeature("customer_management");
  const hasBillingManagement = hasFeature("billing_management");
  const hasNetworkMonitoring = hasFeature("network_monitoring");
  const hasDeviceManagement = hasFeature("device_management");
  const hasMikrotikIntegration = hasFeature("mikrotik_integration");

  useEffect(() => {
    if (isCollapsed) return;
    const path = currentPath;
    if (path.includes("/pelanggan") || path.includes("/paket-internet")) {
      setOpenMenu("pelanggan");
    } else if (path.includes("/hotspot")) {
      setOpenMenu("hotspot");
    }
  }, [currentPath, isCollapsed]);

  const isActive = useMemo(() => {
    return (path: string) => currentPath === path || currentPath.startsWith(path + "/");
  }, [currentPath]);

  const handleMenuToggle = (menuId: string) => {
    setOpenMenu(openMenu === menuId ? null : menuId);
  };

  const renderDisabledMenuItem = (icon: React.ReactNode, label: string) => (
    <SidebarMenuItem>
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarMenuButton className="opacity-40 cursor-not-allowed hover:bg-transparent">
            {icon}
            <span>{label}</span>
            <Lock size={12} className="ml-auto text-muted-foreground/60" />
          </SidebarMenuButton>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex flex-col gap-1">
          <p className="font-medium text-sm">{label} tidak tersedia</p>
          <p className="text-xs text-muted-foreground">Upgrade paket untuk mengakses fitur ini</p>
        </TooltipContent>
      </Tooltip>
    </SidebarMenuItem>
  );

  const MenuItemLink = ({ 
    to, 
    icon, 
    label, 
    isActiveCheck 
  }: { 
    to: string; 
    icon: React.ReactNode; 
    label: string; 
    isActiveCheck: boolean;
  }) => (
    <SidebarMenuItem>
      <SidebarMenuButton 
        asChild 
        className={cn(
          "relative transition-all duration-200",
          isActiveCheck && "bg-primary/10 text-primary font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:rounded-r-full before:bg-primary"
        )} 
        tooltip={isCollapsed ? label : undefined}
      >
        <Link to={to}>
          <span className={cn("transition-colors", isActiveCheck && "text-primary")}>{icon}</span>
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/50">
      {/* Header dengan Logo */}
      <SidebarHeader className="py-5 px-3">
        <div className={cn(
          "flex items-center gap-3 px-2 transition-all duration-200",
          isCollapsed && "justify-center px-0"
        )}>
          <div className={cn(
            "flex items-center justify-center rounded-lg bg-primary/10 p-2 transition-all",
            isCollapsed && "p-1.5"
          )}>
            <Wifi className={cn("text-primary transition-all", isCollapsed ? "h-5 w-5" : "h-5 w-5")} strokeWidth={2.5} />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <h1 className="text-base font-bold text-foreground leading-tight truncate max-w-[140px]">
                {ispName}
              </h1>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Dashboard
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator className="mx-3 opacity-50" />

      <SidebarContent className="overflow-y-auto px-2 py-2" data-sidebar>
        {/* Dashboard */}
        <SidebarGroup className="py-1">
          <SidebarGroupContent>
            <SidebarMenu>
              <MenuItemLink 
                to="/" 
                icon={<Home size={18} strokeWidth={2} />} 
                label="Dashboard" 
                isActiveCheck={currentPath === "/"} 
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Layanan */}
        <SidebarGroup className="py-1">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest px-2 mb-1">
              Layanan
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Pelanggan Menu */}
              {hasCustomerManagement ? (
                isCollapsed ? (
                  <SidebarMenuItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton 
                          className={cn(
                            "relative transition-all duration-200",
                            (isActive("/pelanggan") || isActive("/paket-internet")) && 
                            "bg-primary/10 text-primary font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:rounded-r-full before:bg-primary"
                          )} 
                          tooltip="Pelanggan"
                        >
                          <Users size={18} strokeWidth={2} />
                          <span>Pelanggan</span>
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start" className="w-48 ml-2">
                        <DropdownMenuItem asChild>
                          <Link to="/pelanggan" className={cn("cursor-pointer", isActive("/pelanggan") && "bg-primary/10 text-primary")}>
                            Daftar Pelanggan
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/paket-internet" className={cn("cursor-pointer", isActive("/paket-internet") && "bg-primary/10 text-primary")}>
                            Paket Internet
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                ) : (
                  <Collapsible 
                    open={openMenu === "pelanggan"} 
                    onOpenChange={(isOpen) => { if (!isOpen || openMenu !== "pelanggan") handleMenuToggle("pelanggan"); }} 
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton 
                          onClick={(e) => { e.stopPropagation(); handleMenuToggle("pelanggan"); }} 
                          className={cn(
                            "relative transition-all duration-200",
                            (isActive("/pelanggan") || isActive("/paket-internet")) && 
                            "bg-primary/10 text-primary font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:rounded-r-full before:bg-primary"
                          )}
                        >
                          <Users size={18} strokeWidth={2} />
                          <span>Pelanggan</span>
                          <ChevronDown 
                            className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" 
                            size={14} 
                            strokeWidth={2.5} 
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="animate-in slide-in-from-top-1 duration-200">
                        <SidebarMenuSub className="ml-5 mt-1 pl-3 border-l-2 border-primary/20">
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton 
                              asChild 
                              className={cn(
                                "transition-all duration-150 text-muted-foreground hover:text-foreground",
                                isActive("/pelanggan") && "bg-primary/10 text-primary font-medium"
                              )}
                            >
                              <Link to="/pelanggan" onClick={(e) => e.stopPropagation()}>
                                <span>Daftar Pelanggan</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton 
                              asChild 
                              className={cn(
                                "transition-all duration-150 text-muted-foreground hover:text-foreground",
                                isActive("/paket-internet") && "bg-primary/10 text-primary font-medium"
                              )}
                            >
                              <Link to="/paket-internet" onClick={(e) => e.stopPropagation()}>
                                <span>Paket Internet</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              ) : renderDisabledMenuItem(<Users size={18} strokeWidth={2} />, "Pelanggan")}

              {/* Hotspot Menu */}
              {hasMikrotikIntegration ? (
                isCollapsed ? (
                  <SidebarMenuItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton 
                          className={cn(
                            "relative transition-all duration-200",
                            isActive("/hotspot") && 
                            "bg-primary/10 text-primary font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:rounded-r-full before:bg-primary"
                          )} 
                          tooltip="Hotspot"
                        >
                          <Wifi size={18} strokeWidth={2} />
                          <span>Hotspot</span>
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start" className="w-48 ml-2">
                        <DropdownMenuItem asChild>
                          <Link to="/hotspot/paket" className={cn("cursor-pointer", isActive("/hotspot/paket") && "bg-primary/10 text-primary")}>
                            Paket Hotspot
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/hotspot/users" className={cn("cursor-pointer", isActive("/hotspot/users") && "bg-primary/10 text-primary")}>
                            User & Voucher
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/hotspot/sesi" className={cn("cursor-pointer", isActive("/hotspot/sesi") && "bg-primary/10 text-primary")}>
                            Sesi Aktif
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/hotspot/portal" className={cn("cursor-pointer", isActive("/hotspot/portal") && "bg-primary/10 text-primary")}>
                            Captive Portal
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                ) : (
                  <Collapsible 
                    open={openMenu === "hotspot"} 
                    onOpenChange={(isOpen) => { if (!isOpen || openMenu !== "hotspot") handleMenuToggle("hotspot"); }} 
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton 
                          onClick={(e) => { e.stopPropagation(); handleMenuToggle("hotspot"); }} 
                          className={cn(
                            "relative transition-all duration-200",
                            isActive("/hotspot") && 
                            "bg-primary/10 text-primary font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:rounded-r-full before:bg-primary"
                          )}
                        >
                          <Wifi size={18} strokeWidth={2} />
                          <span>Hotspot</span>
                          <ChevronDown 
                            className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" 
                            size={14} 
                            strokeWidth={2.5} 
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="animate-in slide-in-from-top-1 duration-200">
                        <SidebarMenuSub className="ml-5 mt-1 pl-3 border-l-2 border-primary/20">
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton 
                              asChild 
                              className={cn(
                                "transition-all duration-150 text-muted-foreground hover:text-foreground",
                                isActive("/hotspot/paket") && "bg-primary/10 text-primary font-medium"
                              )}
                            >
                              <Link to="/hotspot/paket" onClick={(e) => e.stopPropagation()}>
                                <span>Paket Hotspot</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton 
                              asChild 
                              className={cn(
                                "transition-all duration-150 text-muted-foreground hover:text-foreground",
                                isActive("/hotspot/users") && "bg-primary/10 text-primary font-medium"
                              )}
                            >
                              <Link to="/hotspot/users" onClick={(e) => e.stopPropagation()}>
                                <span>User & Voucher</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton 
                              asChild 
                              className={cn(
                                "transition-all duration-150 text-muted-foreground hover:text-foreground",
                                isActive("/hotspot/sesi") && "bg-primary/10 text-primary font-medium"
                              )}
                            >
                              <Link to="/hotspot/sesi" onClick={(e) => e.stopPropagation()}>
                                <span>Sesi Aktif</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton 
                              asChild 
                              className={cn(
                                "transition-all duration-150 text-muted-foreground hover:text-foreground",
                                isActive("/hotspot/portal") && "bg-primary/10 text-primary font-medium"
                              )}
                            >
                              <Link to="/hotspot/portal" onClick={(e) => e.stopPropagation()}>
                                <span>Captive Portal</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              ) : renderDisabledMenuItem(<Wifi size={18} strokeWidth={2} />, "Hotspot")}

              {/* Pembayaran */}
              {hasBillingManagement ? (
                <MenuItemLink 
                  to="/pembayaran" 
                  icon={<CreditCard size={18} strokeWidth={2} />} 
                  label="Pembayaran" 
                  isActiveCheck={isActive("/pembayaran")} 
                />
              ) : renderDisabledMenuItem(<CreditCard size={18} strokeWidth={2} />, "Pembayaran")}

              {/* Tiket Support */}
              <MenuItemLink 
                to="/tiket" 
                icon={<Ticket size={18} strokeWidth={2} />} 
                label="Tiket Support" 
                isActiveCheck={isActive("/tiket")} 
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Jaringan & Infrastruktur */}
        <SidebarGroup className="py-1">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest px-2 mb-1">
              Jaringan
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Infrastruktur */}
              {hasNetworkMonitoring ? (
                <MenuItemLink 
                  to="/infrastruktur" 
                  icon={<ServerIcon size={18} strokeWidth={2} />} 
                  label="Infrastruktur" 
                  isActiveCheck={isActive("/infrastruktur")} 
                />
              ) : renderDisabledMenuItem(<ServerIcon size={18} strokeWidth={2} />, "Infrastruktur")}

              {/* Perangkat */}
              {hasDeviceManagement ? (
                <MenuItemLink 
                  to="/perangkat" 
                  icon={<Router size={18} strokeWidth={2} />} 
                  label="Perangkat" 
                  isActiveCheck={isActive("/perangkat")} 
                />
              ) : renderDisabledMenuItem(<Router size={18} strokeWidth={2} />, "Perangkat")}

              {/* MikroTik */}
              {hasMikrotikIntegration ? (
                <MenuItemLink 
                  to="/radius" 
                  icon={<Radio size={18} strokeWidth={2} />} 
                  label="MikroTik" 
                  isActiveCheck={isActive("/radius")} 
                />
              ) : renderDisabledMenuItem(<Radio size={18} strokeWidth={2} />, "MikroTik")}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Billing & Pengaturan */}
        <SidebarGroup className="py-1">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest px-2 mb-1">
              Lainnya
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <MenuItemLink 
                to="/billing" 
                icon={<Receipt size={18} strokeWidth={2} />} 
                label="Billing" 
                isActiveCheck={isActive("/billing")} 
              />
              <MenuItemLink 
                to="/support-tickets" 
                icon={<HelpCircle size={18} strokeWidth={2} />} 
                label="Bantuan" 
                isActiveCheck={isActive("/support-tickets")} 
              />
              <MenuItemLink 
                to="/pengaturan" 
                icon={<Settings size={18} strokeWidth={2} />} 
                label="Pengaturan" 
                isActiveCheck={isActive("/pengaturan")} 
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="mx-3 opacity-50" />

      
    </Sidebar>
  );
});
