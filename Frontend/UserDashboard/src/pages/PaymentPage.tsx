import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Building2,
  Wallet,
  QrCode,
  ArrowLeft,
  Tag,
  CheckCircle2,
  XCircle,
  ShoppingCart,
  CreditCard,
  Shield,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { authStore } from '@/features/auth/auth.store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8089/api/v1';

interface OrderDetails {
  order_id: string;
  amount: number;
  status: string;
  tenant_name: string;
  tenant_email: string;
  plan_id?: string;
  plan_name?: string;
  plan_slug?: string;
  created_at: string;
  has_payment?: boolean;
  payment_info?: PaymentInfo;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  bank?: string;
  description: string;
  icon: string;
}

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

interface CouponResult {
  valid: boolean;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_amount: number;
  final_amount: number;
  message: string;
}

export default function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);

  // Collapsible state for payment method groups
  const [bankOpen, setBankOpen] = useState(false);
  const [ewalletOpen, setEwalletOpen] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
      loadPaymentMethods();
    }
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      const token = authStore.getToken();
      const tenantId = authStore.getTenantId();

      const response = await fetch(`${API_URL}/payment/${orderId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '',
        },
      });

      const data = await response.json();
      if (data.success) {
        setOrderDetails(data.data);
        
        // If already has payment, redirect to instruction page
        if (data.data.has_payment && data.data.payment_info) {
          navigate(`/payment/${orderId}/instruction`, { 
            state: { paymentData: data.data } 
          });
        }
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Gagal memuat detail pesanan',
          variant: 'destructive',
        });
        navigate('/billing');
      }
    } catch (error) {
      console.error('Failed to load order:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat detail pesanan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const response = await fetch(`${API_URL}/public/payment-methods`);
      const data = await response.json();
      if (data.success) {
        setPaymentMethods(data.data.payment_methods || []);
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    try {
      const token = authStore.getToken();
      const tenantId = authStore.getTenantId();

      const response = await fetch(`${API_URL}/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '',
        },
        body: JSON.stringify({
          code: couponCode,
          order_id: orderId,
        }),
      });

      const data = await response.json();
      if (data.success && data.data.valid) {
        setCouponResult(data.data);
        setAppliedCoupon(data.data);
        toast({
          title: 'Kupon Diterapkan!',
          description: data.data.message,
        });
      } else {
        setCouponResult({
          valid: false,
          code: couponCode,
          discount_type: 'fixed',
          discount_value: 0,
          discount_amount: 0,
          final_amount: orderDetails?.amount || 0,
          message: data.message || 'Kupon tidak valid',
        });
        toast({
          title: 'Kupon Tidak Valid',
          description: data.message || 'Kupon tidak dapat digunakan',
          variant: 'destructive',
        });
      }
    } catch (error) {
      // For demo, simulate coupon validation
      if (couponCode.toUpperCase() === 'DISKON10') {
        const discount = (orderDetails?.amount || 0) * 0.1;
        const result: CouponResult = {
          valid: true,
          code: couponCode,
          discount_type: 'percentage',
          discount_value: 10,
          discount_amount: discount,
          final_amount: (orderDetails?.amount || 0) - discount,
          message: 'Diskon 10% berhasil diterapkan!',
        };
        setCouponResult(result);
        setAppliedCoupon(result);
        toast({
          title: 'Kupon Diterapkan!',
          description: result.message,
        });
      } else {
        setCouponResult({
          valid: false,
          code: couponCode,
          discount_type: 'fixed',
          discount_value: 0,
          discount_amount: 0,
          final_amount: orderDetails?.amount || 0,
          message: 'Kupon tidak valid atau sudah kadaluarsa',
        });
      }
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponResult(null);
    setAppliedCoupon(null);
  };

  const createPayment = async () => {
    if (!selectedMethod) {
      toast({
        title: 'Pilih Metode Pembayaran',
        description: 'Silakan pilih metode pembayaran terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const token = authStore.getToken();
      const tenantId = authStore.getTenantId();

      const response = await fetch(`${API_URL}/payment/${orderId}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '',
        },
        body: JSON.stringify({
          payment_method: selectedMethod,
          coupon_code: appliedCoupon?.code || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Pembayaran Dibuat',
          description: 'Silakan selesaikan pembayaran',
        });
        // Navigate to payment instruction page
        navigate(`/payment/${orderId}/instruction`, {
          state: { paymentData: data.data },
        });
      } else {
        toast({
          title: 'Gagal',
          description: data.message || 'Gagal membuat pembayaran',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'bank_transfer':
      case 'echannel':
        return Building2;
      case 'gopay':
      case 'shopeepay':
        return Wallet;
      case 'qris':
        return QrCode;
      default:
        return CreditCard;
    }
  };

  const groupedMethods = paymentMethods.reduce(
    (acc, method) => {
      const group = method.type === 'bank_transfer' || method.type === 'echannel' ? 'bank' : 'ewallet';
      if (!acc[group]) acc[group] = [];
      acc[group].push(method);
      return acc;
    },
    {} as Record<string, PaymentMethod[]>
  );

  const finalAmount = appliedCoupon ? appliedCoupon.final_amount : (orderDetails?.amount || 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Memuat detail pesanan...</p>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Pesanan Tidak Ditemukan</h2>
            <p className="text-muted-foreground mb-4">
              Pesanan dengan ID {orderId} tidak ditemukan atau sudah kadaluarsa.
            </p>
            <Button onClick={() => navigate('/billing')}>
              Kembali ke Billing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Checkout Pembayaran</h1>
          <p className="text-muted-foreground">
            Selesaikan pembayaran untuk mengaktifkan langganan Anda
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left Column - Order Summary */}
          <div className="lg:col-span-2 space-y-4">
            {/* Order Details Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Rincian Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Plan Info */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{orderDetails.plan_name || 'Paket Langganan'}</p>
                      <p className="text-sm text-muted-foreground">Langganan Bulanan</p>
                    </div>
                    <Badge variant="outline">{orderDetails.plan_slug || 'subscription'}</Badge>
                  </div>
                </div>

                {/* Order Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order ID</span>
                    <span className="font-mono text-xs">{orderDetails.order_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nama</span>
                    <span>{orderDetails.tenant_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span>{orderDetails.tenant_email}</span>
                  </div>
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>Rp {orderDetails.amount.toLocaleString('id-ID')}</span>
                  </div>
                  
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Diskon ({appliedCoupon.code})
                      </span>
                      <span>- Rp {appliedCoupon.discount_amount.toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">Rp {finalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coupon Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Kode Kupon
                </CardTitle>
                <CardDescription>
                  Punya kode promo? Masukkan di sini
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-400">
                          {appliedCoupon.code}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-500">
                          {appliedCoupon.message}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeCoupon}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      Hapus
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Masukkan kode kupon"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="uppercase"
                    />
                    <Button
                      variant="outline"
                      onClick={applyCoupon}
                      disabled={!couponCode.trim() || couponLoading}
                    >
                      {couponLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Terapkan'
                      )}
                    </Button>
                  </div>
                )}

                {couponResult && !couponResult.valid && (
                  <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    {couponResult.message}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Security Badge */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
              <Shield className="h-4 w-4" />
              <span>Pembayaran aman & terenkripsi</span>
            </div>
          </div>

          {/* Right Column - Payment Methods */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Pilih Metode Pembayaran
                </CardTitle>
                <CardDescription>
                  Pilih metode pembayaran yang Anda inginkan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Bank Transfer - Collapsible */}
                {groupedMethods.bank && groupedMethods.bank.length > 0 && (
                  <Collapsible open={bankOpen} onOpenChange={setBankOpen}>
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center justify-between w-full p-4 rounded-lg border bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">Transfer Bank / Virtual Account</p>
                            <p className="text-xs text-muted-foreground">{groupedMethods.bank.length} metode tersedia</p>
                          </div>
                        </div>
                        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${bankOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                      <RadioGroup value={selectedMethod} onValueChange={(value) => { setSelectedMethod(value); setBankOpen(false); }}>
                        <div className="grid gap-2">
                          {groupedMethods.bank.map((method) => {
                            const Icon = getMethodIcon(method.type);
                            const isSelected = selectedMethod === method.id;
                            return (
                              <div
                                key={method.id}
                                className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                  isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                }`}
                                onClick={() => { setSelectedMethod(method.id); setBankOpen(false); }}
                              >
                                <RadioGroupItem value={method.id} id={method.id} />
                                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                  <Label htmlFor={method.id} className="cursor-pointer font-medium text-sm">{method.name}</Label>
                                </div>
                                {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                              </div>
                            );
                          })}
                        </div>
                      </RadioGroup>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* E-Wallet & QRIS - Collapsible */}
                {groupedMethods.ewallet && groupedMethods.ewallet.length > 0 && (
                  <Collapsible open={ewalletOpen} onOpenChange={setEwalletOpen}>
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center justify-between w-full p-4 rounded-lg border bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">E-Wallet & QRIS</p>
                            <p className="text-xs text-muted-foreground">{groupedMethods.ewallet.length} metode tersedia</p>
                          </div>
                        </div>
                        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${ewalletOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                      <RadioGroup value={selectedMethod} onValueChange={(value) => { setSelectedMethod(value); setEwalletOpen(false); }}>
                        <div className="grid gap-2">
                          {groupedMethods.ewallet.map((method) => {
                            const Icon = getMethodIcon(method.type);
                            const isSelected = selectedMethod === method.id;
                            return (
                              <div
                                key={method.id}
                                className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                  isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                }`}
                                onClick={() => { setSelectedMethod(method.id); setEwalletOpen(false); }}
                              >
                                <RadioGroupItem value={method.id} id={method.id} />
                                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                  <Label htmlFor={method.id} className="cursor-pointer font-medium text-sm">{method.name}</Label>
                                </div>
                                {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                              </div>
                            );
                          })}
                        </div>
                      </RadioGroup>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Selected Method Display */}
                {selectedMethod && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm text-muted-foreground">Metode dipilih:</p>
                    <p className="font-medium text-primary">
                      {paymentMethods.find(m => m.id === selectedMethod)?.name}
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-col gap-4 border-t pt-6">
                <div className="w-full flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Bayar dalam 24 jam
                  </span>
                  <span className="font-semibold text-lg">
                    Rp {finalAmount.toLocaleString('id-ID')}
                  </span>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={createPayment}
                  disabled={!selectedMethod || processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Memproses Pembayaran...
                    </>
                  ) : (
                    <>
                      Bayar Sekarang
                      <CreditCard className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
