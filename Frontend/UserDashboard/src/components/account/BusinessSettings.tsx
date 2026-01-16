import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2, Building2 } from 'lucide-react';
import { useTenantSettings, useUpdateTenantSettings } from '@/hooks/useSettings';

export function BusinessSettings() {
  const { data: settings, isLoading } = useTenantSettings();
  const updateSettings = useUpdateTenantSettings();

  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.company_name || '');
      setCompanyAddress(settings.company_address || '');
      setCompanyPhone(settings.company_phone || '');
      setCompanyEmail(settings.company_email || '');
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        company_name: companyName,
        company_address: companyAddress,
        company_phone: companyPhone,
        company_email: companyEmail,
      });
      toast.success('Pengaturan bisnis berhasil diperbarui');
    } catch (error) {
      toast.error('Gagal memperbarui pengaturan bisnis');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="grid gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Informasi Bisnis
        </CardTitle>
        <CardDescription>Informasi dasar tentang ISP/RT RW Net Anda</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="company-name">Nama Perusahaan/ISP</Label>
          <Input
            id="company-name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Contoh: RT RW Net Sejahtera"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="company-address">Alamat</Label>
          <Textarea
            id="company-address"
            value={companyAddress}
            onChange={(e) => setCompanyAddress(e.target.value)}
            placeholder="Alamat lengkap perusahaan"
            rows={3}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="company-phone">Nomor Telepon</Label>
            <Input
              id="company-phone"
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="company-email">Email</Label>
            <Input
              id="company-email"
              type="email"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
              placeholder="admin@isp.com"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            'Simpan Perubahan'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
