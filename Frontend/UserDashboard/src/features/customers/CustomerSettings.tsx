import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { settingsApi } from "@/api/settings.api";
import type { UpdateTenantSettingsRequest } from "@/types/settings";

interface CustomerSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerSettings({ open, onOpenChange }: CustomerSettingsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [billingType, setBillingType] = useState<"prepaid" | "postpaid">("postpaid");
  const [billingDay, setBillingDay] = useState(1);
  const [gracePeriod, setGracePeriod] = useState(7);
  const [lateFee, setLateFee] = useState(10000);
  const [invoicePrefix, setInvoicePrefix] = useState("INV");
  const [invoiceDueDays, setInvoiceDueDays] = useState(14);
  const [autoSuspend, setAutoSuspend] = useState(true);
  const [suspendDays, setSuspendDays] = useState(7);

  useEffect(() => {
    if (!open) return;
    
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const data = await settingsApi.getTenantSettings();
        setBillingType(data.billing_type || "postpaid");
        setBillingDay(data.billing_day || 1);
        setGracePeriod(data.grace_period_days || 7);
        setLateFee(data.late_fee || 10000);
        setInvoicePrefix(data.invoice_prefix || "INV");
        setInvoiceDueDays(data.invoice_due_days || 14);
        setAutoSuspend(data.auto_suspend_enabled);
        setSuspendDays(data.auto_suspend_days || 7);
      } catch (error) {
        toast({ title: "Error", description: "Gagal memuat pengaturan", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [open, toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: UpdateTenantSettingsRequest = {
        billing_type: billingType,
        billing_date_type: "fixed",
        billing_day: billingDay,
        grace_period_days: gracePeriod,
        late_fee: lateFee,
        late_fee_type: "fixed",
        invoice_prefix: invoicePrefix,
        invoice_due_days: invoiceDueDays,
        auto_suspend_enabled: autoSuspend,
        auto_suspend_days: suspendDays,
        send_payment_reminder: true,
        send_payment_confirmation: true,
        auto_reactivate_on_payment: true,
      };
      
      await settingsApi.updateTenantSettings(payload);
      toast({ title: "Berhasil", description: "Pengaturan berhasil disimpan" });
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error", description: "Gagal menyimpan pengaturan", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pengaturan Pelanggan</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipe Tagihan</Label>
                <Select value={billingType} onValueChange={(v: any) => setBillingType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prepaid">Prepaid</SelectItem>
                    <SelectItem value="postpaid">Postpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tanggal Tagihan</Label>
                <Select value={billingDay.toString()} onValueChange={(v) => setBillingDay(parseInt(v))}>
                  <SelectTrigger>
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
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Masa Tenggang (hari)</Label>
                <Input
                  type="number"
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(parseInt(e.target.value) || 0)}
                  min={0}
                  max={30}
                />
              </div>

              <div className="space-y-2">
                <Label>Denda (Rp)</Label>
                <Input
                  type="number"
                  value={lateFee}
                  onChange={(e) => setLateFee(parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prefix Invoice</Label>
                <Input
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="INV"
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label>Jatuh Tempo (hari)</Label>
                <Input
                  type="number"
                  value={invoiceDueDays}
                  onChange={(e) => setInvoiceDueDays(parseInt(e.target.value) || 0)}
                  min={1}
                  max={60}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label>Suspend Otomatis</Label>
              <Switch checked={autoSuspend} onCheckedChange={setAutoSuspend} />
            </div>

            {autoSuspend && (
              <div className="space-y-2 ml-4">
                <Label>Suspend Setelah (hari)</Label>
                <Input
                  type="number"
                  value={suspendDays}
                  onChange={(e) => setSuspendDays(parseInt(e.target.value) || 0)}
                  min={1}
                  max={30}
                  className="w-32"
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CustomerSettings;
