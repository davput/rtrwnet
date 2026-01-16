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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useUserSettings, useUpdateNotificationSettings } from '@/hooks/useSettings';

export function NotificationSettings() {
  const { data: settings, isLoading } = useUserSettings();
  const updateNotifications = useUpdateNotificationSettings();

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [paymentNotifications, setPaymentNotifications] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);
  const [marketingNotifications, setMarketingNotifications] = useState(false);

  useEffect(() => {
    if (settings) {
      setEmailNotifications(settings.email_notifications);
      setPaymentNotifications(settings.payment_notifications);
      setSystemNotifications(settings.system_notifications);
      setMarketingNotifications(settings.marketing_notifications);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateNotifications.mutateAsync({
        email_notifications: emailNotifications,
        payment_notifications: paymentNotifications,
        system_notifications: systemNotifications,
        marketing_notifications: marketingNotifications,
      });
      toast.success('Pengaturan notifikasi berhasil diperbarui');
    } catch (error) {
      toast.error('Gagal memperbarui pengaturan notifikasi');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-10" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Notifikasi</CardTitle>
        <CardDescription>Atur jenis notifikasi yang ingin Anda terima</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Notifikasi Email</Label>
              <p className="text-sm text-muted-foreground">Terima notifikasi melalui email</p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="payment-notifications">Notifikasi Pembayaran</Label>
              <p className="text-sm text-muted-foreground">
                Menerima notifikasi tentang status pembayaran
              </p>
            </div>
            <Switch
              id="payment-notifications"
              checked={paymentNotifications}
              onCheckedChange={setPaymentNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="system-notifications">Notifikasi Sistem</Label>
              <p className="text-sm text-muted-foreground">
                Menerima notifikasi tentang pembaruan dan pemberitahuan sistem
              </p>
            </div>
            <Switch
              id="system-notifications"
              checked={systemNotifications}
              onCheckedChange={setSystemNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing-notifications">Notifikasi Pemasaran</Label>
              <p className="text-sm text-muted-foreground">
                Menerima pembaruan tentang produk dan fitur baru
              </p>
            </div>
            <Switch
              id="marketing-notifications"
              checked={marketingNotifications}
              onCheckedChange={setMarketingNotifications}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSave} disabled={updateNotifications.isPending}>
          {updateNotifications.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            'Simpan Pengaturan'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
