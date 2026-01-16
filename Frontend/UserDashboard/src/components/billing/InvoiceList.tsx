import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useBillingDashboard } from '@/hooks/useBilling';
import { Download, FileText, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InvoiceInfo } from '@/types/billing';

const statusColors: Record<InvoiceInfo['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<InvoiceInfo['status'], string> = {
  pending: 'Menunggu',
  paid: 'Lunas',
  failed: 'Gagal',
  cancelled: 'Dibatalkan',
};

export function InvoiceList() {
  const { data, isLoading } = useBillingDashboard();
  const navigate = useNavigate();
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceInfo | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const handlePayInvoice = (invoice: InvoiceInfo) => {
    setSelectedInvoice(invoice);
    setIsPaymentDialogOpen(true);
  };

  const handleProceedToPayment = () => {
    if (selectedInvoice) {
      // Navigate to payment page
      navigate(`/payment/${selectedInvoice.invoice_no}`);
      setIsPaymentDialogOpen(false);
    }
  };

  if (isLoading) {
    return <InvoiceListSkeleton />;
  }

  const invoices = data?.invoices || [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Riwayat Invoice
          </CardTitle>
          <CardDescription>
            Daftar invoice dan status pembayaran
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada invoice
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Invoice</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_no}</TableCell>
                    <TableCell>
                      {format(new Date(invoice.issued_date), 'd MMM yyyy', { locale: id })}
                    </TableCell>
                    <TableCell>
                      Rp {invoice.amount.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[invoice.status]}>
                        {statusLabels[invoice.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {invoice.status === 'pending' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handlePayInvoice(invoice)}
                          >
                            Bayar
                          </Button>
                        )}
                        {invoice.download_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(invoice.download_url!, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pembayaran Invoice</DialogTitle>
            <DialogDescription>
              Lanjutkan ke halaman pembayaran untuk menyelesaikan transaksi
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">No. Invoice:</span>
                  <span className="font-medium">{selectedInvoice.invoice_no}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Jumlah:</span>
                  <span className="font-semibold text-lg">
                    Rp {selectedInvoice.amount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tanggal:</span>
                  <span>{format(new Date(selectedInvoice.issued_date), 'd MMMM yyyy', { locale: id })}</span>
                </div>
              </div>
              
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 text-sm">
                <p className="text-blue-900 dark:text-blue-100">
                  💡 Anda akan diarahkan ke halaman pembayaran untuk menyelesaikan transaksi ini.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsPaymentDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleProceedToPayment}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Lanjut Bayar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function InvoiceListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-60" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
