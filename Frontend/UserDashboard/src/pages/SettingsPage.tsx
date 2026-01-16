import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileSettings } from '@/components/account/ProfileSettings';
import { SecuritySettings } from '@/components/account/SecuritySettings';
import { NotificationSettings } from '@/components/account/NotificationSettings';
import { BusinessSettings } from '@/components/account/BusinessSettings';
import { BillingSettings } from '@/components/account/BillingSettings';
import { useAuth } from '@/features/auth/auth.store';
import { User, Shield, Bell, Building2, Receipt } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola pengaturan akun dan preferensi Anda</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Keamanan
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifikasi
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="business" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Bisnis
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Tagihan
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettings />
        </TabsContent>

        {isAdmin && (
          <>
            <TabsContent value="business" className="space-y-4">
              <BusinessSettings />
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              <BillingSettings />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
