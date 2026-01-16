import { useState, useEffect } from "react";
import type { Customer } from "@/features/customers/customer.types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Plus,
  FileText,
  Settings2,
} from "lucide-react";
import { paymentApi } from "@/features/payments/payment.api";
import { settingsApi } from "@/api/settings.api";
import type { Payment } from "@/features/payments/payment.types";
import type { TenantSettings } from "@/types/settings";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface BillingTabProps {
  customer: Customer;
  onDataChange?: () => void;
}

export function CustomerBillingTab({ customer, onDataChange }: BillingTabProps) {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingSettings, setBillingSettings] = useState<TenantSettings | null>(null);
  
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [paymentData, setPaymentData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    amount: customer.monthly_fee || 0,
    paymentMethod: 'transfer',
    notes: '',
  });

  useEffect(() => {
    loadPayments();
    loadBillingSettings();
  }, [customer.id]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentApi.getAll({ customer_id: customer.id });
      setPayments(data.payments || []);
    } catch (error) {
      console.error("Error loading payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBillingSettings = async () => {
    try {
      const settings = await settingsApi.getTenantSettings();
      setBillingSettings(settings);
    } catch (error) {
      console.error("Error loading billing settings:", error);
    }
  };

  const handleGenerateInvoice = async () => {
    setIsProcessing(true);
    try {
      // Create a pending payment (invoice)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (billingSettings?.invoice_due_days || 14));
      
      await paymentApi.create({
        customer_id: customer.id,
        amount: customer.monthly_fee || 0,
        payment_date: "", // Empty for invoice (not paid yet)
        payment_method: "",
        notes: `Invoice untuk periode ${format(new Date(), 'MMMM yyyy')}`,
      });

      toast({
        title: "Invoice Dibuat",
        description: "Invoice berhasil dibuat untuk pelanggan ini",
      });

      setIsInvoiceDialogOpen(false);
      loadPayments();
      onDataChange?.();
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast({
        title: "Error",
        description: "Gagal membuat invoice",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordPayment = async () => {
    setIsProcessing(true);
    try {
      await paymentApi.create({
        customer_id: customer.id,
        amount: paymentData.amount,
        payment_date: paymentData.paymentDate,
        payment_method: paymentData.paymentMethod,
        notes: paymentData.notes,
      });

      toast({
        title: "Pembayaran Berhasil",
        description: "Pembayaran telah dicatat",
      });

      setIsPaymentDialogOpen(false);
      loadPayments();
      onDataChange?.();
    } catch (error) {
      console.error("Error recording payment:", error);
      toast({
        title: "Error",
        description: "Gagal mencatat pembayaran",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Lunas</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Terlambat</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Billing Settings Info */}
      {billingSettings && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Pengaturan Billing
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Tipe: </span>
                <Badge variant={billingSettings.billing_type === 'prepaid' ? 'default' : 'secondary'}>
                  {billingSettings.billing_type === 'prepaid' ? 'Prepaid' : 'Postpaid'}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Tanggal: </span>
                <span className="font-medium">
                  {billingSettings.billing_date_type === 'fixed' 
                    ? `Tanggal ${billingSettings.billing_day}` 
                    : 'Recycle (Tanggal Aktivasi)'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Jatuh Tempo: </span>
                <span className="font-medium">{billingSettings.invoice_due_days} hari</span>
              </div>
              {billingSettings.late_fee > 0 && (
                <div>
                  <span className="text-muted-foreground">Denda: </span>
                  <span className="font-medium">
                    {billingSettings.late_fee_type === 'percentage' 
                      ? `${billingSettings.late_fee}%`
                      : `Rp ${billingSettings.late_fee.toLocaleString('id-ID')}`}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tagihan Bulanan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {(customer.monthly_fee || 0).toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jatuh Tempo</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Tanggal {customer.due_date || billingSettings?.billing_day || '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pembayaran</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.filter(p => p.status === 'paid').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoice Pending</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {payments.filter(p => p.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Riwayat Pembayaran & Invoice</CardTitle>
            <CardDescription>Daftar invoice dan pembayaran pelanggan</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsInvoiceDialogOpen(true)}>
              <FileText className="mr-2 h-4 w-4" />
              Buat Invoice
            </Button>
            <Button onClick={() => setIsPaymentDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Catat Pembayaran
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Belum ada riwayat pembayaran
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.payment_date 
                        ? format(new Date(payment.payment_date), 'dd MMM yyyy')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>Rp {payment.amount.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="capitalize">{payment.payment_method || '-'}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>{payment.notes || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Pembayaran</DialogTitle>
            <DialogDescription>
              Catat pembayaran untuk {customer.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tanggal Pembayaran</Label>
              <Input
                type="date"
                value={paymentData.paymentDate}
                onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Jumlah (Rp)</Label>
              <Input
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <Select
                value={paymentData.paymentMethod}
                onValueChange={(value) => setPaymentData({ ...paymentData, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Transfer Bank</SelectItem>
                  <SelectItem value="cash">Tunai</SelectItem>
                  <SelectItem value="e-wallet">E-Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                placeholder="Catatan pembayaran (opsional)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleRecordPayment} disabled={isProcessing}>
              {isProcessing ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Invoice</DialogTitle>
            <DialogDescription>
              Buat invoice tagihan untuk {customer.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pelanggan</span>
                <span className="font-medium">{customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kode</span>
                <span className="font-medium">{customer.customer_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tagihan</span>
                <span className="font-medium">Rp {(customer.monthly_fee || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jatuh Tempo</span>
                <span className="font-medium">{billingSettings?.invoice_due_days || 14} hari dari sekarang</span>
              </div>
              {billingSettings?.billing_type === 'prepaid' && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-sm text-blue-700 dark:text-blue-300">
                  <strong>Prepaid:</strong> Invoice ini untuk periode layanan berikutnya
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInvoiceDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleGenerateInvoice} disabled={isProcessing}>
              {isProcessing ? "Membuat..." : "Buat Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
