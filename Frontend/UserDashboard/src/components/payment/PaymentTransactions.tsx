import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { usePayments, useRecordPayment } from "@/hooks/usePayments";
import { useCustomers } from "@/hooks/useCustomers";
import { useDebounce } from "@/hooks/useDebounce";
import { settingsApi } from "@/api/settings.api";
import { paymentApi } from "@/features/payments/payment.api";
import { toast } from "sonner";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { PaymentStatus, PaymentFilters, RecordPaymentRequest } from "@/types/payment";
import type { TenantSettings } from "@/types/settings";

const statusColors: Record<PaymentStatus, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  overdue: "bg-red-100 text-red-800",
};

const statusLabels: Record<PaymentStatus, string> = {
  paid: "Lunas",
  pending: "Menunggu",
  overdue: "Terlambat",
};

export function PaymentTransactions() {
  const [filters, setFilters] = useState<PaymentFilters>({
    page: 1,
    per_page: 10,
  });
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [billingSettings, setBillingSettings] = useState<TenantSettings | null>(null);
  const [formData, setFormData] = useState<RecordPaymentRequest>({
    customer_id: "",
    amount: 0,
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "transfer",
    notes: "",
  });

  const debouncedSearch = useDebounce(search, 500);
  const { data, isLoading, refetch } = usePayments(filters);
  const { data: customersData } = useCustomers({ per_page: 100 });
  const recordPayment = useRecordPayment();

  const payments = data?.data?.payments || [];
  const total = data?.data?.total || 0;
  const page = data?.data?.page || 1;
  const perPage = data?.data?.per_page || 10;
  const customers = customersData?.data?.customers || [];
  const activeCustomers = customers.filter(c => c.status === 'active');

  const loadBillingSettings = async () => {
    try {
      const settings = await settingsApi.getTenantSettings();
      setBillingSettings(settings);
    } catch (error) {
      console.error("Error loading billing settings:", error);
    }
  };

  const handleOpenInvoiceDialog = async () => {
    await loadBillingSettings();
    setInvoiceDialogOpen(true);
  };

  const handleGenerateInvoices = async () => {
    if (activeCustomers.length === 0) {
      toast.error("Tidak ada pelanggan aktif untuk dibuatkan invoice");
      return;
    }

    setIsGenerating(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const customer of activeCustomers) {
        try {
          await paymentApi.create({
            customer_id: customer.id,
            amount: customer.monthly_fee || 0,
            payment_date: "",
            payment_method: "",
            notes: `Invoice untuk periode ${format(new Date(), 'MMMM yyyy')}`,
          });
          successCount++;
        } catch {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} invoice berhasil dibuat`);
        refetch();
      }
      if (failCount > 0) {
        toast.error(`${failCount} invoice gagal dibuat`);
      }
      setInvoiceDialogOpen(false);
    } catch (error) {
      toast.error("Gagal membuat invoice");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      status: status === "all" ? undefined : (status as PaymentStatus),
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleRecordPayment = async () => {
    if (!formData.customer_id || formData.amount <= 0) {
      toast.error("Pilih pelanggan dan masukkan jumlah pembayaran");
      return;
    }

    try {
      await recordPayment.mutateAsync({
        ...formData,
        payment_date: new Date(formData.payment_date).toISOString(),
      });
      toast.success("Pembayaran berhasil dicatat");
      setDialogOpen(false);
      setFormData({
        customer_id: "",
        amount: 0,
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "transfer",
        notes: "",
      });
    } catch {
      toast.error("Gagal mencatat pembayaran");
    }
  };

  // Calculate summary
  const paidCount = payments.filter((p) => p.status === "paid").length;
  const pendingCount = payments.filter((p) => p.status === "pending").length;
  const overdueCount = payments.filter((p) => p.status === "overdue").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Transaksi Pembayaran</CardTitle>
            <CardDescription>
              Kelola semua transaksi pembayaran pelanggan RT/RW Net Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari transaksi..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={filters.status || "all"}
                  onValueChange={handleStatusFilter}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="paid">Lunas</SelectItem>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="overdue">Terlambat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pelanggan</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead>Jatuh Tempo</TableHead>
                        <TableHead>Tgl Bayar</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Metode</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Tidak ada data pembayaran
                          </TableCell>
                        </TableRow>
                      ) : (
                        payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{payment.customer_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {payment.customer_code}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              Rp {payment.amount.toLocaleString("id-ID")}
                            </TableCell>
                            <TableCell>
                              {format(new Date(payment.due_date), "d MMM yyyy", {
                                locale: id,
                              })}
                            </TableCell>
                            <TableCell>
                              {payment.payment_date
                                ? format(new Date(payment.payment_date), "d MMM yyyy", {
                                    locale: id,
                                  })
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusColors[payment.status]}>
                                {statusLabels[payment.status]}
                              </Badge>
                              {payment.days_overdue && payment.days_overdue > 0 && (
                                <span className="text-xs text-red-600 ml-1">
                                  +{payment.days_overdue} hari
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{payment.payment_method || "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {total > 0 && (
                  <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-sm text-muted-foreground">
                      Menampilkan {(page - 1) * perPage + 1} -{" "}
                      {Math.min(page * perPage, total)} dari {total} pembayaran
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-sm">
                        Halaman {page} dari {Math.ceil(total / perPage)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= Math.ceil(total / perPage)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>Catat pembayaran baru</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Catat Pembayaran
            </Button>

            <Button 
              className="w-full" 
              variant="outline" 
              onClick={handleOpenInvoiceDialog}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Invoice
            </Button>

            <div>
              <h4 className="text-sm font-semibold mb-2">Ringkasan</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium">{total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lunas:</span>
                  <span className="font-medium text-green-600">{paidCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Menunggu:</span>
                  <span className="font-medium text-yellow-600">{pendingCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Terlambat:</span>
                  <span className="font-medium text-red-600">{overdueCount}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Pembayaran</DialogTitle>
            <DialogDescription>Catat pembayaran dari pelanggan</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Pelanggan</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, customer_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pelanggan" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.customer_code} - {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Jumlah</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                }
                placeholder="0"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tanggal Bayar</Label>
                <Input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_date: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Metode</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      payment_method: value as "transfer" | "cash" | "e-wallet",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="e-wallet">E-Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Catatan (Opsional)</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Catatan pembayaran"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleRecordPayment} disabled={recordPayment.isPending}>
              {recordPayment.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Invoice Massal</DialogTitle>
            <DialogDescription>
              Buat invoice untuk semua pelanggan aktif
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {billingSettings && (
              <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
                <h4 className="font-medium text-sm">Pengaturan Billing</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Tipe: </span>
                    <Badge variant={billingSettings.billing_type === 'prepaid' ? 'default' : 'secondary'}>
                      {billingSettings.billing_type === 'prepaid' ? 'Prepaid' : 'Postpaid'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Jatuh Tempo: </span>
                    <span className="font-medium">{billingSettings.invoice_due_days} hari</span>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="font-medium text-sm">Ringkasan</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pelanggan Aktif:</span>
                  <span className="font-medium">{activeCustomers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Tagihan:</span>
                  <span className="font-medium">
                    Rp {activeCustomers.reduce((sum, c) => sum + (c.monthly_fee || 0), 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Periode:</span>
                  <span className="font-medium">{format(new Date(), 'MMMM yyyy', { locale: id })}</span>
                </div>
              </div>
            </div>

            {billingSettings?.billing_type === 'prepaid' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                <strong>Prepaid:</strong> Invoice akan dibuat untuk periode layanan berikutnya
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleGenerateInvoices} disabled={isGenerating || activeCustomers.length === 0}>
              {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate {activeCustomers.length} Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
