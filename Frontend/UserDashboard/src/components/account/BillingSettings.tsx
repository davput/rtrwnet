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
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Receipt, Bell } from 'lucide-react';
import { useTenantSettings, useUpdateTenantSettings } from '@/hooks/useSettings';

export function BillingSettings() {
  const { data: settings, isLoading } = useTenantSettings();
  const updateSettings = useUpdateTenantSettings();

  // Billing
  const [defaultDueDate, setDefaultDueDate] = useState(10);
  const [gracePeriodDays, setGracePeriodDays] = useState(7);
  const [autoSuspendEnabled, setAutoSuspendEnabled] = useState(true);
  const [autoSuspendDays, setAutoSuspendDays] = useState(14);

  // Invoice
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState(0);

  // Notifications
  const [sendPaymentReminder, setSendPaymentReminder] = useState(true);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(3);
  const [sendOverdueNotice, setSendOverdueNotice] = useState(true);

  useEffect(() => {
    if (settings) {
      setDefaultDueDate(settings.default_due_date);
      setGracePeriodDays(settings.grace_period_days);
      setAutoSuspendEnabled(settings.auto_suspend_enabled);
      setAutoSuspendDays(settings.auto_suspend_days);
      setInvoicePrefix(settings.invoice_prefix || 'INV');
      setTaxEnabled(settings.tax_enabled);
      setTaxPercentage(settings.tax_percentage);
      setSendPaymentReminder(settings.send_payment_reminder);
      setReminderDaysBefore(settings.reminder_days_before);
      setSendOverdueNotice(settings.send_overdue_notice);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        default_due_date: defaultDueDate,
        grace_period_days: gracePeriodDays,
        auto_suspend_enabled: autoSuspendEnabled,
        auto_suspend_days: autoSuspendDays,
        invoice_prefix: invoicePrefix,
        tax_enabled: taxEnabled,
        tax_percentage: taxPercentage,
        send_payment_reminder: sendPaymentReminder,
        reminder_days_before: reminderDaysBefore,
        send_overdue_notice: sendOverdueNotice,
      });
      toast.success('Pengaturan billing berhasil diperbarui');
    } catch (error) {
      toast.error('Gagal memperbarui pengaturan billing');
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
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Billing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Pengaturan Tagihan
          </CardTitle>
          <CardDescription>Konfigurasi tanggal jatuh tempo dan isolir otomatis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="due-date">Tanggal Jatuh Tempo Default</Label>
              <Input
                id="due-date"
                type="number"
                min={1}
                max={31}
                value={defaultDueDate}
                onChange={(e) => setDefaultDueDate(parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Tanggal 1-31 setiap bulan</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="grace-period">Masa Tenggang (hari)</Label>
              <Input
                id="grace-period"
                type="number"
                min={0}
                max={30}
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Hari setelah jatuh tempo</p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Isolir Otomatis</Label>
              <p className="text-sm text-muted-foreground">
                Otomatis isolir pelanggan yang belum bayar
              </p>
            </div>
            <Switch checked={autoSuspendEnabled} onCheckedChange={setAutoSuspendEnabled} />
          </div>

          {autoSuspendEnabled && (
            <div className="grid gap-2">
              <Label htmlFor="suspend-days">Isolir Setelah (hari)</Label>
              <Input
                id="suspend-days"
                type="number"
                min={1}
                max={60}
                value={autoSuspendDays}
                onChange={(e) => setAutoSuspendDays(parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Hari setelah jatuh tempo</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Invoice</CardTitle>
          <CardDescription>Konfigurasi format invoice dan pajak</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="invoice-prefix">Prefix Invoice</Label>
            <Input
              id="invoice-prefix"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              placeholder="INV"
            />
            <p className="text-xs text-muted-foreground">Contoh: INV-2024-001</p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Aktifkan Pajak</Label>
              <p className="text-sm text-muted-foreground">Tambahkan pajak ke tagihan</p>
            </div>
            <Switch checked={taxEnabled} onCheckedChange={setTaxEnabled} />
          </div>

          {taxEnabled && (
            <div className="grid gap-2">
              <Label htmlFor="tax-percentage">Persentase Pajak (%)</Label>
              <Input
                id="tax-percentage"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(parseFloat(e.target.value))}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifikasi Pelanggan
          </CardTitle>
          <CardDescription>Pengaturan pengingat pembayaran untuk pelanggan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Pengingat Pembayaran</Label>
              <p className="text-sm text-muted-foreground">
                Kirim pengingat sebelum jatuh tempo
              </p>
            </div>
            <Switch checked={sendPaymentReminder} onCheckedChange={setSendPaymentReminder} />
          </div>

          {sendPaymentReminder && (
            <div className="grid gap-2">
              <Label htmlFor="reminder-days">Kirim Pengingat (hari sebelum)</Label>
              <Input
                id="reminder-days"
                type="number"
                min={1}
                max={14}
                value={reminderDaysBefore}
                onChange={(e) => setReminderDaysBefore(parseInt(e.target.value))}
              />
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifikasi Keterlambatan</Label>
              <p className="text-sm text-muted-foreground">
                Kirim notifikasi saat pembayaran terlambat
              </p>
            </div>
            <Switch checked={sendOverdueNotice} onCheckedChange={setSendOverdueNotice} />
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
              'Simpan Semua Pengaturan'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
