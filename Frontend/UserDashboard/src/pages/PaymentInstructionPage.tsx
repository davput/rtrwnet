import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Copy,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  Building2,
  QrCode,
  ExternalLink,
} from 'lucide-react';
import { authStore } from '@/features/auth/auth.store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8089/api/v1';

interface PaymentInfo {
  bank?: string;
  va_number?: string;
  biller_code?: string;
  bill_key?: string;
  qr_url?: string;
  qr_string?: string;
  deeplink?: string;
  payment_type?: string;
}

interface PaymentData {
  order_id: string;
  transaction_id?: string;
  payment_type: string;
  transaction_status: string;
  amount?: number;
  gross_amount?: number;
  expiry_time?: string;
  payment_info?: PaymentInfo;
  va_numbers?: Array<{ bank: string; va_number: string }>;
  permata_va_number?: string;
  biller_code?: string;
  bill_key?: string;
  qr_code_url?: string;
  deeplink_url?: string;
}

export default function PaymentInstructionPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(
    location.state?.paymentData || null
  );
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!paymentData && orderId) {
      loadPaymentStatus();
    } else {
      setLoading(false);
    }
  }, [orderId, paymentData]);

  // Countdown timer
  useEffect(() => {
    const expiryTime = paymentData?.expiry_time;
    if (!expiryTime) return;

    const calculateTimeRemaining = () => {
      const expiryDate = new Date(expiryTime);
      const now = new Date();
      const diff = expiryDate.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining('Waktu habis');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}j ${minutes}m ${seconds}d`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}d`);
      } else {
        setTimeRemaining(`${seconds} detik`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [paymentData?.expiry_time]);

  const loadPaymentStatus = async () => {
    try {
      const token = authStore.getToken();
      const tenantId = authStore.getTenantId();

      const response = await fetch(`${API_URL}/payment/${orderId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '',
        },
      });

      const data = await response.json();
      if (data.success) {
        setPaymentData(data.data);
        
        if (data.data.status === 'paid' || data.data.transaction_status === 'settlement') {
          toast({
            title: 'Pembayaran Berhasil!',
            description: 'Akun Anda telah aktif.',
          });
          setTimeout(() => navigate('/'), 2000);
        }
      }
    } catch (error) {
      console.error('Failed to load payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    setCheckingStatus(true);
    try {
      const token = authStore.getToken();
      const tenantId = authStore.getTenantId();

      const response = await fetch(`${API_URL}/payment/${orderId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '',
        },
      });

      const data = await response.json();
      if (data.success) {
        const status = data.data.status || data.data.transaction_status;
        
        if (status === 'paid' || status === 'settlement') {
          toast({
            title: 'Pembayaran Berhasil!',
            description: 'Akun Anda telah aktif. Mengalihkan ke dashboard...',
          });
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        } else {
          toast({
            title: `Status: ${status}`,
            description: 'Pembayaran belum diterima. Silakan selesaikan pembayaran.',
          });
        }
      }
    } catch (error) {
      console.error('Failed to check status:', error);
      toast({
        title: 'Error',
        description: 'Gagal memeriksa status pembayaran',
        variant: 'destructive',
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ description: 'Disalin ke clipboard' });
  };

  const getBankName = (bank?: string) => {
    const banks: Record<string, string> = {
      bca: 'BCA',
      bni: 'BNI',
      bri: 'BRI',
      mandiri: 'Mandiri',
      permata: 'Permata',
      cimb: 'CIMB Niaga',
    };
    return banks[bank?.toLowerCase() || ''] || bank?.toUpperCase() || '';
  };

  const formatExpiryDate = (expiryTime?: string) => {
    if (!expiryTime) return '-';
    try {
      const date = new Date(expiryTime);
      return date.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return expiryTime;
    }
  };

  // Extract payment info
  const getVANumber = () => {
    if (paymentData?.va_numbers && paymentData.va_numbers.length > 0) {
      return {
        bank: paymentData.va_numbers[0].bank,
        number: paymentData.va_numbers[0].va_number,
      };
    }
    if (paymentData?.permata_va_number) {
      return { bank: 'permata', number: paymentData.permata_va_number };
    }
    if (paymentData?.payment_info?.va_number) {
      return {
        bank: paymentData.payment_info.bank,
        number: paymentData.payment_info.va_number,
      };
    }
    return null;
  };

  const getMandiriBill = () => {
    if (paymentData?.biller_code && paymentData?.bill_key) {
      return {
        biller_code: paymentData.biller_code,
        bill_key: paymentData.bill_key,
      };
    }
    if (paymentData?.payment_info?.biller_code) {
      return {
        biller_code: paymentData.payment_info.biller_code,
        bill_key: paymentData.payment_info.bill_key,
      };
    }
    return null;
  };

  const getQRCode = () => {
    return paymentData?.qr_code_url || paymentData?.payment_info?.qr_url;
  };

  const getDeeplink = () => {
    return paymentData?.deeplink_url || paymentData?.payment_info?.deeplink;
  };

  const amount = paymentData?.amount || paymentData?.gross_amount || 0;
  const vaInfo = getVANumber();
  const mandiriBill = getMandiriBill();
  const qrCodeUrl = getQRCode();
  const deeplinkUrl = getDeeplink();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Memuat instruksi pembayaran...</p>
        </div>
      </div>
    );
  }

  // Expired state
  if (isExpired) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Waktu Pembayaran Habis</h2>
              <p className="text-muted-foreground">
                Batas waktu pembayaran telah berakhir. Silakan buat pesanan baru.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-4">
              <Button variant="outline" onClick={() => navigate('/billing')}>
                Kembali
              </Button>
              <Button onClick={() => navigate('/billing')}>
                Buat Pesanan Baru
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/billing')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Billing
          </Button>
        </div>

        {/* Timer Card */}
        <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-orange-700 dark:text-orange-400">Selesaikan pembayaran sebelum</p>
                  <p className="font-medium text-orange-900 dark:text-orange-300">
                    {formatExpiryDate(paymentData?.expiry_time)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-orange-600">Sisa waktu</p>
                <p className="text-xl font-bold text-orange-700 dark:text-orange-400 font-mono">
                  {timeRemaining}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Instruction Card */}
        <Card>
          <CardHeader className="text-center border-b">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              {vaInfo || mandiriBill ? (
                <Building2 className="h-8 w-8 text-primary" />
              ) : (
                <QrCode className="h-8 w-8 text-primary" />
              )}
            </div>
            <CardTitle>Instruksi Pembayaran</CardTitle>
            <CardDescription>
              {vaInfo && `Transfer ke Virtual Account ${getBankName(vaInfo.bank)}`}
              {mandiriBill && 'Bayar via Mandiri Bill Payment'}
              {qrCodeUrl && 'Scan QR Code untuk membayar'}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Amount */}
            <div className="text-center py-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Pembayaran</p>
              <p className="text-3xl font-bold text-primary">
                Rp {amount.toLocaleString('id-ID')}
              </p>
            </div>

            {/* VA Number */}
            {vaInfo && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Bank</p>
                    <p className="font-semibold">{getBankName(vaInfo.bank)}</p>
                  </div>
                  <Badge variant="outline">{vaInfo.bank?.toUpperCase()}</Badge>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Nomor Virtual Account</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-mono font-bold tracking-wider">
                      {vaInfo.number}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(vaInfo.number || '')}
                    >
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Mandiri Bill */}
            {mandiriBill && (
              <div className="space-y-3">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Kode Biller</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-mono font-bold">{mandiriBill.biller_code}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(mandiriBill.biller_code || '')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Kode Pembayaran (Bill Key)</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-mono font-bold">{mandiriBill.bill_key}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(mandiriBill.bill_key || '')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* QR Code */}
            {qrCodeUrl && (
              <div className="text-center space-y-4">
                <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Scan QR code di atas menggunakan aplikasi e-wallet Anda
                </p>
                {deeplinkUrl && (
                  <Button variant="outline" asChild>
                    <a href={deeplinkUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Buka di Aplikasi
                    </a>
                  </Button>
                )}
              </div>
            )}

            <Separator />

            {/* Check Status Button */}
            <div className="flex flex-col gap-3">
              <Button
                className="w-full"
                size="lg"
                onClick={checkPaymentStatus}
                disabled={checkingStatus}
              >
                {checkingStatus ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memeriksa Status...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Saya Sudah Bayar
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Klik tombol di atas setelah Anda menyelesaikan pembayaran
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Cara Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            {vaInfo && (
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Buka aplikasi mobile banking atau ATM {getBankName(vaInfo.bank)}</li>
                <li>Pilih menu Transfer atau Pembayaran</li>
                <li>Pilih Virtual Account atau Transfer ke Bank Lain</li>
                <li>Masukkan nomor Virtual Account: <span className="font-mono font-medium text-foreground">{vaInfo.number}</span></li>
                <li>Masukkan nominal: <span className="font-medium text-foreground">Rp {amount.toLocaleString('id-ID')}</span></li>
                <li>Konfirmasi dan selesaikan pembayaran</li>
              </ol>
            )}
            {mandiriBill && (
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Buka aplikasi Livin' by Mandiri atau ATM Mandiri</li>
                <li>Pilih menu Bayar/Beli</li>
                <li>Pilih Multipayment</li>
                <li>Masukkan Kode Biller: <span className="font-mono font-medium text-foreground">{mandiriBill.biller_code}</span></li>
                <li>Masukkan Kode Pembayaran: <span className="font-mono font-medium text-foreground">{mandiriBill.bill_key}</span></li>
                <li>Konfirmasi dan selesaikan pembayaran</li>
              </ol>
            )}
            {qrCodeUrl && (
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Buka aplikasi e-wallet Anda (GoPay, OVO, DANA, dll)</li>
                <li>Pilih menu Scan atau Bayar</li>
                <li>Arahkan kamera ke QR Code di atas</li>
                <li>Periksa detail pembayaran</li>
                <li>Konfirmasi dan selesaikan pembayaran</li>
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
