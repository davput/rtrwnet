import { useState, useEffect, forwardRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Settings, CreditCard, Calendar, Bell, FileText, Loader2 } from "lucide-react";
import { settingsApi } from "@/api/settings.api";
import type { TenantSettings, UpdateTenantSettingsRequest } from "@/types/settings";

// Currency Input Component with thousand separator
interface CurrencyInputProps {
  value: number | "";
  onChange: (value: number | "") => void;
  placeholder?: string;
  className?: string;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, placeholder = "0", className }, ref) => {
    const formatNumber = (num: number | ""): string => {
      if (num === "" || num === 0) return "";
      return num.toLocaleString("id-ID");
    };

    const parseNumber = (str: string): number | "" => {
      const cleaned = str.replace(/\./g, "").replace(/,/g, "");
      if (cleaned === "") return "";
      const num = parseInt(cleaned, 10);
      return isNaN(num) ? "" : num;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseNumber(e.target.value);
      onChange(parsed);
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          Rp
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={formatNumber(value)}
          onChange={handleChange}
          placeholder={placeholder}
          className={`pl-10 ${className || ""}`}
        />
      </div>
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";

// Number Input Component that allows empty value
interface NumberInputProps {
  value: number | "";
  onChange: (value: number | "") => void;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, min, max, placeholder = "0", className }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === "") {
        onChange("");
        return;
      }
      const num = parseInt(val, 10);
      if (!isNaN(num)) {
        if (max !== undefined && num > max) {
          onChange(max);
        } else if (min !== undefined && num < min) {
          onChange(min);
        } else {
          onChange(num);
        }
      }
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={value === "" ? "" : value}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
      />
    );
  }
);
NumberInput.displayName = "NumberInput";

interface CustomerSettingsData {
  // Billing Settings
  billingType: "prepaid" | "postpaid";
  billingDateType: "fixed" | "recycle";
  billingDay: number | "";
  gracePeriod: number | "";
  lateFee: number | "";
  lateFeeType: "fixed" | "percentage";

  // Invoice Settings
  invoicePrefix: string;
  autoGenerateInvoice: boolean;
  invoiceDueDays: number | "";
  generateInvoiceDaysBefore: number | "";

  // Notification Settings
  sendInvoiceReminder: boolean;
  reminderDaysBefore: number | "";
  sendPaymentConfirmation: boolean;
  sendSuspensionWarning: boolean;
  warningDaysBeforeSuspension: number | "";

  // Auto Actions
  autoSuspendOnOverdue: boolean;
  suspendAfterDays: number | "";
  autoReactivateOnPayment: boolean;
}

const defaultSettings: CustomerSettingsData = {
  billingType: "postpaid",
  billingDateType: "fixed",
  billingDay: 1,
  gracePeriod: 7,
  lateFee: 10000,
  lateFeeType: "fixed",
  invoicePrefix: "INV",
  autoGenerateInvoice: true,
  invoiceDueDays: 14,
  generateInvoiceDaysBefore: 7,
  sendInvoiceReminder: true,
  reminderDaysBefore: 3,
  sendPaymentConfirmation: true,
  sendSuspensionWarning: true,
  warningDaysBeforeSuspension: 3,
  autoSuspendOnOverdue: true,
  suspendAfterDays: 7,
  autoReactivateOnPayment: true,
};

// Map API response to local state
const mapApiToLocal = (api: TenantSettings): CustomerSettingsData => ({
  billingType: api.billing_type || "postpaid",
  billingDateType: api.billing_date_type || "fixed",
  billingDay: api.billing_day || 1,
  gracePeriod: api.grace_period_days || 7,
  lateFee: api.late_fee || 0,
  lateFeeType: api.late_fee_type || "fixed",
  invoicePrefix: api.invoice_prefix || "INV",
  autoGenerateInvoice: true, // Not stored in API yet
  invoiceDueDays: api.invoice_due_days || 14,
  generateInvoiceDaysBefore: api.generate_invoice_days_before || 7,
  sendInvoiceReminder: api.send_payment_reminder,
  reminderDaysBefore: api.reminder_days_before || 3,
  sendPaymentConfirmation: api.send_payment_confirmation,
  sendSuspensionWarning: api.send_suspension_warning,
  warningDaysBeforeSuspension: api.warning_days_before_suspension || 3,
  autoSuspendOnOverdue: api.auto_suspend_enabled,
  suspendAfterDays: api.auto_suspend_days || 7,
  autoReactivateOnPayment: api.auto_reactivate_on_payment,
});

// Map local state to API request
const mapLocalToApi = (local: CustomerSettingsData): UpdateTenantSettingsRequest => ({
  billing_type: local.billingType,
  billing_date_type: local.billingDateType,
  billing_day: local.billingDay === "" ? undefined : local.billingDay,
  grace_period_days: local.gracePeriod === "" ? undefined : local.gracePeriod,
  late_fee: local.lateFee === "" ? undefined : local.lateFee,
  late_fee_type: local.lateFeeType,
  invoice_prefix: local.invoicePrefix,
  invoice_due_days: local.invoiceDueDays === "" ? undefined : local.invoiceDueDays,
  generate_invoice_days_before:
    local.generateInvoiceDaysBefore === "" ? undefined : local.generateInvoiceDaysBefore,
  send_payment_reminder: local.sendInvoiceReminder,
  reminder_days_before: local.reminderDaysBefore === "" ? undefined : local.reminderDaysBefore,
  send_payment_confirmation: local.sendPaymentConfirmation,
  send_suspension_warning: local.sendSuspensionWarning,
  warning_days_before_suspension:
    local.warningDaysBeforeSuspension === "" ? undefined : local.warningDaysBeforeSuspension,
  auto_suspend_enabled: local.autoSuspendOnOverdue,
  auto_suspend_days: local.suspendAfterDays === "" ? undefined : local.suspendAfterDays,
  auto_reactivate_on_payment: local.autoReactivateOnPayment,
});

export function CustomerSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<CustomerSettingsData>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const tenantSettings = await settingsApi.getTenantSettings();
        setSettings(mapApiToLocal(tenantSettings));
      } catch (error) {
        console.error("Failed to load settings:", error);
        toast({
          title: "Error",
          description: "Gagal memuat pengaturan",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [toast]);

  const handleChange = <K extends keyof CustomerSettingsData>(
    key: K,
    value: CustomerSettingsData[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await settingsApi.updateTenantSettings(mapLocalToApi(settings));
      toast({
        title: "Pengaturan Disimpan",
        description: "Pengaturan pelanggan berhasil diperbarui",
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan pengaturan",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6" />
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-1" />
            </div>
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pengaturan Pelanggan</h1>
            <p className="text-sm text-muted-foreground">
              Konfigurasi tagihan, invoice, dan notifikasi pelanggan
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan Pengaturan
        </Button>
      </div>

      {/* Billing Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>Pengaturan Tagihan</CardTitle>
          </div>
          <CardDescription>Konfigurasi siklus dan denda tagihan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Tipe Tagihan</Label>
            <Select
              value={settings.billingType}
              onValueChange={(v) => {
                handleChange("billingType", v as "prepaid" | "postpaid");
                // Prepaid selalu recycle date
                if (v === "prepaid") {
                  handleChange("billingDateType", "recycle");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prepaid">Prepaid (Bayar di Muka)</SelectItem>
                <SelectItem value="postpaid">Postpaid (Bayar di Akhir)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {settings.billingType === "prepaid" 
                ? "Pelanggan membayar sebelum menggunakan layanan. Invoice langsung dibuat saat customer ditambahkan."
                : "Pelanggan membayar setelah menggunakan layanan"}
            </p>
          </div>

          {/* Prepaid Info */}
          {settings.billingType === "prepaid" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Prepaid Mode:</strong> Setiap pelanggan baru akan langsung dibuatkan invoice. 
                Tagihan berikutnya berdasarkan tanggal aktivasi (recycle date).
              </p>
            </div>
          )}

          {/* Postpaid - pilih fixed atau recycle */}
          {settings.billingType === "postpaid" && (
            <>
              <div className="space-y-2">
                <Label>Tipe Tanggal Tagihan</Label>
                <Select
                  value={settings.billingDateType}
                  onValueChange={(v) => handleChange("billingDateType", v as "fixed" | "recycle")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Date (Tanggal Tetap)</SelectItem>
                    <SelectItem value="recycle">Recycle Date (Tanggal Aktivasi)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {settings.billingDateType === "fixed" 
                    ? "Semua pelanggan ditagih pada tanggal yang sama"
                    : "Setiap pelanggan ditagih berdasarkan tanggal aktivasinya"}
                </p>
              </div>

              {/* Fixed Date Settings */}
              {settings.billingDateType === "fixed" && (
                <div className="space-y-2">
                  <Label>Tanggal Tagihan Bulanan</Label>
                  <Select
                    value={settings.billingDay?.toString() || "1"}
                    onValueChange={(v) => handleChange("billingDay", parseInt(v))}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          Tanggal {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Semua tagihan akan dibuat pada tanggal {settings.billingDay || 1} setiap bulan
                  </p>
                </div>
              )}

              {/* Recycle Date Info */}
              {settings.billingDateType === "recycle" && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Recycle Date:</strong> Tagihan akan dibuat berdasarkan tanggal aktivasi masing-masing pelanggan. 
                    Contoh: Jika pelanggan diaktifkan tanggal 15, maka tagihan akan dibuat setiap tanggal 15.
                  </p>
                </div>
              )}
            </>
          )}

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Masa Tenggang (hari)</Label>
              <NumberInput
                value={settings.gracePeriod}
                onChange={(v) => handleChange("gracePeriod", v)}
                min={0}
                max={30}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Jumlah hari setelah jatuh tempo sebelum denda
              </p>
            </div>
            <div className="space-y-2">
              <Label>Jenis Denda</Label>
              <Select
                value={settings.lateFeeType}
                onValueChange={(v) => handleChange("lateFeeType", v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Nominal Tetap</SelectItem>
                  <SelectItem value="percentage">Persentase</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            {settings.lateFeeType === "percentage" ? (
              <>
                <Label>Denda Keterlambatan (%)</Label>
                <NumberInput
                  value={settings.lateFee}
                  onChange={(v) => handleChange("lateFee", v)}
                  min={0}
                  max={100}
                  placeholder="0"
                  className="w-32"
                />
              </>
            ) : (
              <>
                <Label>Denda Keterlambatan</Label>
                <CurrencyInput
                  value={settings.lateFee}
                  onChange={(v) => handleChange("lateFee", v)}
                  placeholder="0"
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Pengaturan Invoice</CardTitle>
          </div>
          <CardDescription>Konfigurasi pembuatan invoice otomatis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Prefix Invoice</Label>
              <Input
                value={settings.invoicePrefix}
                onChange={(e) => handleChange("invoicePrefix", e.target.value)}
                placeholder="INV"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                Contoh: {settings.invoicePrefix}-2024-0001
              </p>
            </div>
            <div className="space-y-2">
              <Label>Jatuh Tempo Invoice (hari)</Label>
              <NumberInput
                value={settings.invoiceDueDays}
                onChange={(v) => handleChange("invoiceDueDays", v)}
                min={1}
                max={60}
                placeholder="14"
              />
              <p className="text-xs text-muted-foreground">
                Batas waktu pembayaran setelah invoice dibuat
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Generate Invoice Otomatis</Label>
              <p className="text-sm text-muted-foreground">
                Buat invoice secara otomatis setiap siklus tagihan
              </p>
            </div>
            <Switch
              checked={settings.autoGenerateInvoice}
              onCheckedChange={(v) => handleChange("autoGenerateInvoice", v)}
            />
          </div>

          {settings.autoGenerateInvoice && settings.billingType === "prepaid" && (
            <div className="space-y-2 ml-4">
              <Label>Generate Invoice (hari sebelum periode baru)</Label>
              <NumberInput
                value={settings.generateInvoiceDaysBefore}
                onChange={(v) => handleChange("generateInvoiceDaysBefore", v)}
                min={1}
                max={30}
                placeholder="7"
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Invoice akan dibuat {settings.generateInvoiceDaysBefore || 7} hari sebelum periode layanan baru dimulai
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Pengaturan Notifikasi</CardTitle>
          </div>
          <CardDescription>Konfigurasi pengiriman notifikasi ke pelanggan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Kirim Pengingat Invoice</Label>
              <p className="text-sm text-muted-foreground">
                Kirim notifikasi sebelum jatuh tempo
              </p>
            </div>
            <Switch
              checked={settings.sendInvoiceReminder}
              onCheckedChange={(v) => handleChange("sendInvoiceReminder", v)}
            />
          </div>

          {settings.sendInvoiceReminder && (
            <div className="space-y-2 ml-4">
              <Label>Kirim Pengingat (hari sebelum jatuh tempo)</Label>
              <NumberInput
                value={settings.reminderDaysBefore}
                onChange={(v) => handleChange("reminderDaysBefore", v)}
                min={1}
                max={14}
                placeholder="3"
                className="w-32"
              />
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Konfirmasi Pembayaran</Label>
              <p className="text-sm text-muted-foreground">
                Kirim notifikasi saat pembayaran diterima
              </p>
            </div>
            <Switch
              checked={settings.sendPaymentConfirmation}
              onCheckedChange={(v) => handleChange("sendPaymentConfirmation", v)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Peringatan Suspend</Label>
              <p className="text-sm text-muted-foreground">
                Kirim peringatan sebelum akun di-suspend
              </p>
            </div>
            <Switch
              checked={settings.sendSuspensionWarning}
              onCheckedChange={(v) => handleChange("sendSuspensionWarning", v)}
            />
          </div>

          {settings.sendSuspensionWarning && (
            <div className="space-y-2 ml-4">
              <Label>Kirim Peringatan (hari sebelum suspend)</Label>
              <NumberInput
                value={settings.warningDaysBeforeSuspension}
                onChange={(v) => handleChange("warningDaysBeforeSuspension", v)}
                min={1}
                max={14}
                placeholder="3"
                className="w-32"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Aksi Otomatis</CardTitle>
          </div>
          <CardDescription>Konfigurasi suspend dan reaktivasi otomatis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Suspend Otomatis</Label>
              <p className="text-sm text-muted-foreground">
                Suspend pelanggan yang melewati batas waktu pembayaran
              </p>
            </div>
            <Switch
              checked={settings.autoSuspendOnOverdue}
              onCheckedChange={(v) => handleChange("autoSuspendOnOverdue", v)}
            />
          </div>

          {settings.autoSuspendOnOverdue && (
            <div className="space-y-2 ml-4">
              <Label>Suspend Setelah (hari dari jatuh tempo)</Label>
              <NumberInput
                value={settings.suspendAfterDays}
                onChange={(v) => handleChange("suspendAfterDays", v)}
                min={1}
                max={30}
                placeholder="7"
                className="w-32"
              />
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Reaktivasi Otomatis</Label>
              <p className="text-sm text-muted-foreground">
                Aktifkan kembali pelanggan setelah pembayaran diterima
              </p>
            </div>
            <Switch
              checked={settings.autoReactivateOnPayment}
              onCheckedChange={(v) => handleChange("autoReactivateOnPayment", v)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CustomerSettings;
