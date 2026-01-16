import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Bell, Shield, Database, User } from "lucide-react";
import { AvatarUpload } from "@/components/AvatarUpload";
import { useQuery } from "@tanstack/react-query";
import * as adminApi from "@/api/admin.api";

export function Settings() {
  const { data: profileData } = useQuery({
    queryKey: ["admin", "profile"],
    queryFn: adminApi.getAdminProfile,
  });

  const profile = profileData?.data?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">Konfigurasi sistem admin</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            Umum
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifikasi
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Keamanan
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Database className="h-4 w-4" />
            Sistem
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profil Admin</CardTitle>
              <CardDescription>Kelola informasi profil Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center">
                <AvatarUpload
                  currentAvatarUrl={profile?.avatar_url}
                  userName={profile?.name || "Admin"}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin_name">Nama</Label>
                  <Input id="admin_name" defaultValue={profile?.name || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin_email">Email</Label>
                  <Input id="admin_email" type="email" defaultValue={profile?.email || ""} />
                </div>
              </div>
              <Button>Simpan Perubahan</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Umum</CardTitle>
              <CardDescription>Konfigurasi dasar platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platform_name">Nama Platform</Label>
                  <Input id="platform_name" defaultValue="RT/RW Net SaaS" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support_email">Email Support</Label>
                  <Input id="support_email" type="email" defaultValue="support@rtwnet.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="homepage_url">URL Homepage</Label>
                <Input id="homepage_url" defaultValue="https://rtwnet.com" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mode Maintenance</p>
                  <p className="text-sm text-muted-foreground">
                    Aktifkan untuk menonaktifkan akses tenant sementara
                  </p>
                </div>
                <Switch />
              </div>
              <Button>Simpan Perubahan</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Notifikasi</CardTitle>
              <CardDescription>Kelola notifikasi email dan sistem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Tenant Baru</p>
                    <p className="text-sm text-muted-foreground">
                      Notifikasi saat ada tenant baru mendaftar
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Pembayaran Gagal</p>
                    <p className="text-sm text-muted-foreground">
                      Notifikasi saat pembayaran tenant gagal
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Support Ticket</p>
                    <p className="text-sm text-muted-foreground">
                      Notifikasi saat ada tiket support baru
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Trial Expiring</p>
                    <p className="text-sm text-muted-foreground">
                      Notifikasi saat trial tenant akan berakhir
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <Button>Simpan Perubahan</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Keamanan</CardTitle>
              <CardDescription>Konfigurasi keamanan sistem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Wajibkan 2FA untuk semua admin
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Session Timeout</p>
                    <p className="text-sm text-muted-foreground">
                      Logout otomatis setelah tidak aktif
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session_duration">Durasi Session (menit)</Label>
                  <Input id="session_duration" type="number" defaultValue="60" className="w-32" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">IP Whitelist</p>
                    <p className="text-sm text-muted-foreground">
                      Batasi akses admin dari IP tertentu
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
              <Button>Simpan Perubahan</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Sistem</CardTitle>
              <CardDescription>Konfigurasi teknis sistem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="api_url">API URL</Label>
                  <Input id="api_url" defaultValue="https://api.rtwnet.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook_url">Webhook URL</Label>
                  <Input id="webhook_url" defaultValue="https://api.rtwnet.com/webhooks" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Debug Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Aktifkan logging detail untuk debugging
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto Backup</p>
                    <p className="text-sm text-muted-foreground">
                      Backup database otomatis setiap hari
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Database</h4>
                <div className="flex items-center gap-4">
                  <Button variant="outline">Backup Sekarang</Button>
                  <Button variant="outline">Clear Cache</Button>
                </div>
              </div>
              <Button>Simpan Perubahan</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
