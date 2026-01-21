import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Eye } from 'lucide-react';
import { captivePortalApi } from '@/api/hotspot.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function HotspotPortal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['captive-portal-settings'],
    queryFn: captivePortalApi.getSettings,
  });

  const updateMutation = useMutation({
    mutationFn: captivePortalApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['captive-portal-settings'] });
      toast({ title: 'Pengaturan portal berhasil disimpan' });
    },
    onError: () => {
      toast({ title: 'Gagal menyimpan pengaturan', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      logo_url: formData.get('logo_url') as string,
      promotional_text: formData.get('promotional_text') as string,
      redirect_url: formData.get('redirect_url') as string,
      primary_color: formData.get('primary_color') as string,
      secondary_color: formData.get('secondary_color') as string,
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Captive Portal</h1>
          <p className="text-muted-foreground">Kustomisasi tampilan halaman login hotspot</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Portal</CardTitle>
              <CardDescription>
                Sesuaikan branding dan tampilan captive portal Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo_url">URL Logo</Label>
                  <Input
                    id="logo_url"
                    name="logo_url"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    defaultValue={settings?.logo_url}
                  />
                  <p className="text-xs text-muted-foreground">
                    URL gambar logo yang akan ditampilkan di halaman login
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="promotional_text">Teks Promosi</Label>
                  <Textarea
                    id="promotional_text"
                    name="promotional_text"
                    placeholder="Selamat datang di WiFi kami!"
                    rows={3}
                    defaultValue={settings?.promotional_text}
                  />
                  <p className="text-xs text-muted-foreground">
                    Teks yang akan ditampilkan di halaman login
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="redirect_url">URL Redirect</Label>
                  <Input
                    id="redirect_url"
                    name="redirect_url"
                    type="url"
                    placeholder="https://www.google.com"
                    defaultValue={settings?.redirect_url}
                  />
                  <p className="text-xs text-muted-foreground">
                    URL tujuan setelah login berhasil
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="primary_color">Warna Utama</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary_color"
                        name="primary_color"
                        type="color"
                        defaultValue={settings?.primary_color || '#3B82F6'}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={settings?.primary_color || '#3B82F6'}
                        readOnly
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondary_color">Warna Sekunder</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondary_color"
                        name="secondary_color"
                        type="color"
                        defaultValue={settings?.secondary_color || '#10B981'}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={settings?.secondary_color || '#10B981'}
                        readOnly
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={updateMutation.isPending} className="flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    Simpan Pengaturan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview Portal</CardTitle>
              <CardDescription>
                Pratinjau tampilan captive portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border rounded-lg p-8 space-y-6"
                style={{
                  backgroundColor: '#f9fafb',
                  borderColor: settings?.primary_color || '#3B82F6',
                }}
              >
                {settings?.logo_url && (
                  <div className="flex justify-center">
                    <img
                      src={settings.logo_url}
                      alt="Logo"
                      className="h-16 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="text-center space-y-2">
                  <h2
                    className="text-2xl font-bold"
                    style={{ color: settings?.primary_color || '#3B82F6' }}
                  >
                    WiFi Hotspot
                  </h2>
                  {settings?.promotional_text && (
                    <p className="text-sm text-gray-600">{settings.promotional_text}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Username</label>
                    <input
                      type="text"
                      placeholder="Masukkan kode voucher"
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Password</label>
                    <input
                      type="password"
                      placeholder="Masukkan password"
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                      disabled
                    />
                  </div>
                  <button
                    className="w-full py-2 rounded-md text-white font-medium"
                    style={{ backgroundColor: settings?.primary_color || '#3B82F6' }}
                    disabled
                  >
                    Login
                  </button>
                </div>

                <div className="text-center text-xs text-gray-500">
                  Powered by RT/RW Net SaaS
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informasi Portal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Tenant ID:</span>
                <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                  {settings?.tenant_id}
                </code>
              </div>
              <div>
                <span className="font-medium">URL Portal:</span>
                <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded break-all">
                  {window.location.origin}/api/v1/public/hotspot/portal/{settings?.tenant_id}
                </code>
              </div>
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  Gunakan URL di atas untuk konfigurasi captive portal di router MikroTik Anda
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
