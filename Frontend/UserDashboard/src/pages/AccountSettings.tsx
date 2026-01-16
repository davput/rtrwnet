
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "@/components/account/ProfileSettings";
import { SecuritySettings } from "@/components/account/SecuritySettings";
import { NotificationSettings } from "@/components/account/NotificationSettings";
import { User, Shield, Bell } from "lucide-react";

const AccountSettings = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Pengaturan Akun</h1>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="inline-flex h-11 items-center justify-start gap-1 rounded-lg bg-muted/50 p-1 md:w-auto">
          <TabsTrigger 
            value="profile" 
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-md"
          >
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger 
            value="security"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-md"
          >
            <Shield className="h-4 w-4" />
            Keamanan
          </TabsTrigger>
          <TabsTrigger 
            value="notifications"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-md"
          >
            <Bell className="h-4 w-4" />
            Notifikasi
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="space-y-4 mt-6">
          <ProfileSettings />
        </TabsContent>
        <TabsContent value="security" className="space-y-4 mt-6">
          <SecuritySettings />
        </TabsContent>
        <TabsContent value="notifications" className="space-y-4 mt-6">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountSettings;
