
import { Settings, User, LogOut, Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/features/auth/auth.store";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

export function DashboardHeader() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toggleSidebar } = useSidebar();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      // Pastikan redirect ke login setelah logout
      navigate("/login");
    }
  };

  const getUserInitials = () => {
    if (!user) return 'AD';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="flex-shrink-0 h-16 border-b border-sidebar-border bg-sidebar flex items-center px-4 md:px-6 gap-3">
      {/* Sidebar Toggle dengan icon Menu */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleSidebar}
        className="h-9 w-9"
      >
        <Menu className="h-5 w-5" strokeWidth={2} />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
      
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        
        {/* Notifications Dropdown */}
        <NotificationDropdown />
        
        {/* User Menu Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="cursor-pointer">
              <AvatarImage src={user?.avatar_url || user?.avatar || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground">{getUserInitials()}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center justify-start gap-3 p-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatar_url || user?.avatar || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground">{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium">{user?.name || 'Admin'}</p>
                <p className="text-sm text-muted-foreground">{user?.email || 'admin@rtwnet.com'}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/akun-settings")}>
              <User className="mr-2 h-4 w-4" />
              <span>Pengaturan Akun</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/pengaturan")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Preferensi Sistem</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Keluar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
