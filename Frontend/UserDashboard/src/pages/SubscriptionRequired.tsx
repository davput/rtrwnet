import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Building2,
  Wallet,
  QrCode,
  Copy,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertTriangle,
  LogOut,
  CreditCard,
  Sparkles,
  Crown,
  Rocket,
  ArrowRight,
  ArrowLeft,
  Tag,
  ShoppingCart,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { authStore } from '@/features/auth/auth.store';
import { billingApi } from '@/api/billing.api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8089/api/v1';

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billing_cycle: string;
  max_customers: number;
  max_users: number;
  features: Record<string, any>;
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
}

interface PaymentResponse {
  order_id: string;
  payment_type: string;
  transaction_status: string;
  gross_amount: number;
  expiry_time: string;
  payment_info: PaymentInfo;
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

type Step = 'info' | 'checkout' | 'payment-instruction';

export default function SubscriptionRequired() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [step, setStep] = useState<Step>('info');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  // Subscription info
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('');
  const [currentPlanName, setCurrentPlanName] = useState<string>('');
  const [trialEndDate, setTrialEndDate] = useState<string>('');
  
  // Plans & Payment
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);

  // Collapsible state for payment method groups
  const [bankOpen, setBankOpen] = useState(false);
  const [ewalletOpen, setEwalletOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!paymentData?.expiry_time || step !== 'payment-instruction') return;

    const calculateTimeRemaining = () => {
      const expiryDate = new Date(paymentData.expiry_time);
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
  }, [paymentData?.expiry_time, step]);

  const loadInitialData = async () => {
    try {
      // Load subscription status
      try {
        const billingData = await billingApi.getDashboard();
        setSubscriptionStatus(billingData.subscription?.status || 'expired');
        setCurrentPlanName(billingData.subscription?.plan_name || '');
        setTrialEndDate(billingData.subscription?.end_date || '');
      } catch {
        setSubscriptionStatus('expired');
      }

      // Load plans
      const plansResponse = await fetch(`${API_URL}/public/plans`);
      const plansData = await plansResponse.json();
      if (plansData.success) {
        setPlans(plansData.data.plans);
      }

      // Load payment methods
      const methodsResponse = await fetch(`${API_URL}/public/payment-methods`);
      const methodsData = await methodsResponse.json();
      if (methodsData.success) {
        setPaymentMethods(methodsData.data.payment_methods);
      }

      // Check for pending order
      const token = authStore.getToken();
      const tenantId = authStore.getTenantId();
      
      try {
        const pendingTxResponse = await fetch(`${API_URL}/billing/pending-order`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId || '',
          },
        });
        const pendingTxData = await pendingTxResponse.json();
        
        if (pendingTxData.success && pendingTxData.data?.order_id) {
          setOrderId(pendingTxData.data.order_id);
          
          if (pendingTxData.data.has_payment && pendingTxData.data.payment_info) {
            const existingPaymentData: PaymentResponse = {
              order_id: pendingTxData.data.order_id,
              payment_type: pendingTxData.data.payment_method || '',
              transaction_status: 'pending',
              gross_amount: pendingTxData.data.amount,
              expiry_time: pendingTxData.data.expires_at || '',
              payment_info: pendingTxData.data.payment_info,
            };
            setPaymentData(existingPaymentData);
            setStep('payment-instruction');
            return;
          }
        }
      } catch (e) {
        console.log('No pending order found');
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSubscriptionOrder = async () => {
    if (!selectedPlan) return;

    setProcessing(true);
    try {
      const token = authStore.getToken();
      const tenantId = authStore.getTenantId();

      const response = await fetch(`${API_URL}/billing/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '',
        },
        body: JSON.stringify({ plan_id: selectedPlan.id }),
      });

      const data = await response.json();
      if (data.success && data.data?.order_id) {
        setOrderId(data.data.order_id);
        toast({ title: 'Order dibuat', description: 'Silakan pilih metode pembayaran' });
      } else {
        toast({ title: 'Gagal', description: data.message || 'Gagal membuat order', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal membuat pesanan', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    
    // Demo coupon validation
    setTimeout(() => {
      if (couponCode.toUpperCase() === 'DISKON10') {
        const discount = (selectedPlan?.price || 0) * 0.1;
        setAppliedCoupon({
          valid: true,
          code: couponCode,
          discount_type: 'percentage',
          discount_value: 10,
          discount_amount: discount,
          final_amount: (selectedPlan?.price || 0) - discount,
          message: 'Diskon 10% berhasil diterapkan!',
        });
        toast({ title: 'Kupon Diterapkan!', description: 'Diskon 10% berhasil diterapkan!' });
      } else {
        toast({ title: 'Kupon Tidak Valid', description: 'Kupon tidak dapat digunakan', variant: 'destructive' });
      }
      setCouponLoading(false);
    }, 500);
  };

  const removeCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
  };

  const createPayment = async () => {
    if (!selectedMethod || !orderId) {
      if (!orderId) await createSubscriptionOrder();
      if (!selectedMethod) {
        toast({ title: 'Pilih Metode Pembayaran', description: 'Silakan pilih metode pembayaran', variant: 'destructive' });
        return;
      }
    }

    setProcessing(true);
    try {
      const response = await fetch(`${API_URL}/public/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, payment_method: selectedMethod }),
      });

      const data = await response.json();
      if (data.success) {
        setPaymentData(data.data);
        setStep('payment-instruction');
        toast({ title: 'Pembayaran Dibuat', description: 'Silakan selesaikan pembayaran' });
      } else {
        toast({ title: 'Gagal', description: data.message || 'Gagal membuat pembayaran', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Terjadi kesalahan', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!orderId) return;
    setCheckingStatus(true);
    try {
      const response = await fetch(`${API_URL}/public/payments/${orderId}/status`);
      const data = await response.json();

      if (data.success) {
        if (data.data.transaction_status === 'paid' || data.data.transaction_status === 'settlement') {
          toast({ title: 'Pembayaran Berhasil!', description: 'Akun Anda telah aktif.' });
          setTimeout(() => { window.location.href = '/'; }, 1500);
        } else {
          toast({ title: `Status: ${data.data.transaction_status}`, description: 'Pembayaran belum diterima.' });
        }
      }
    } catch (error) {
      console.error('Failed to check status:', error);
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

  const handleLogout = () => {
    authStore.clearAuth();
    window.location.href = '/login';
  };

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'basic': return Rocket;
      case 'standard': return Sparkles;
      case 'premium': return Crown;
      default: return CreditCard;
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

  const groupedMethods = paymentMethods.reduce((acc, method) => {
    const group = method.type === 'bank_transfer' || method.type === 'echannel' ? 'bank' : 'ewallet';
    if (!acc[group]) acc[group] = [];
    acc[group].push(method);
    return acc;
  }, {} as Record<string, PaymentMethod[]>);

  const getStatusMessage = () => {
    switch (subscriptionStatus) {
      case 'expired':
        return {
          title: 'Masa Trial Telah Berakhir',
          description: `Trial Anda untuk paket ${currentPlanName} telah berakhir${trialEndDate ? ` pada ${new Date(trialEndDate).toLocaleDateString('id-ID')}` : ''}. Berlangganan sekarang untuk melanjutkan.`,
          icon: Clock,
          color: 'text-orange-500',
          bgColor: 'bg-orange-100',
        };
      case 'cancelled':
        return {
          title: 'Langganan Dibatalkan',
          description: 'Langganan Anda telah dibatalkan. Berlangganan kembali untuk mengakses dashboard.',
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-100',
        };
      default:
        return {
          title: 'Langganan Diperlukan',
          description: 'Anda perlu berlangganan untuk mengakses dashboard.',
          icon: AlertTriangle,
          color: 'text-primary',
          bgColor: 'bg-primary/10',
        };
    }
  };

  const finalAmount = appliedCoupon ? appliedCoupon.final_amount : (selectedPlan?.price || 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusMessage();
  const StatusIcon = statusInfo.icon;

  // Step 1: Info - Show subscription status
  if (step === 'info') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className={`w-16 h-16 rounded-full ${statusInfo.bgColor} flex items-center justify-center mx-auto mb-4`}>
              <StatusIcon className={`h-8 w-8 ${statusInfo.color}`} />
            </div>
            <CardTitle>{statusInfo.title}</CardTitle>
            <CardDescription className="mt-2">{statusInfo.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" size="lg" onClick={() => setStep('checkout')}>
              Pilih Paket Langganan
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="ghost" className="w-full" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Checkout - Two column layout
  if (step === 'checkout') {
    return (
      <div className="min-h-screen bg-muted/30 py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setStep('info')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Pilih Paket & Metode Pembayaran</h1>
            <p className="text-muted-foreground">Pilih paket yang sesuai dengan kebutuhan bisnis Anda</p>
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Left Column - Order Summary */}
            <div className="lg:col-span-2 space-y-4">
              {/* Plan Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Pilih Paket
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {plans.map((plan) => {
                    const PlanIcon = getPlanIcon(plan.slug);
                    const isSelected = selectedPlan?.id === plan.id;
                    return (
                      <div
                        key={plan.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => { setSelectedPlan(plan); setAppliedCoupon(null); }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            <PlanIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{plan.name}</p>
                              <p className="font-bold">Rp {(plan.price / 1000).toFixed(0)}K</p>
                            </div>
                            <p className="text-xs text-muted-foreground">{plan.max_customers} pelanggan • {plan.max_users} user</p>
                          </div>
                          {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Order Summary */}
              {selectedPlan && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Rincian Pesanan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Paket {selectedPlan.name}</span>
                        <span>Rp {selectedPlan.price.toLocaleString('id-ID')}</span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-green-600">
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
              )}

              {/* Coupon */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Kode Kupon
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-700">{appliedCoupon.code}</p>
                          <p className="text-xs text-green-600">{appliedCoupon.message}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={removeCoupon} className="text-red-500 hover:text-red-600">
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
                        disabled={!selectedPlan}
                      />
                      <Button variant="outline" onClick={applyCoupon} disabled={!couponCode.trim() || couponLoading || !selectedPlan}>
                        {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Terapkan'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

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
                  <CardDescription>Pilih metode pembayaran yang Anda inginkan</CardDescription>
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
                    <span className="font-semibold text-lg">Rp {finalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={async () => {
                      if (!orderId) await createSubscriptionOrder();
                      await createPayment();
                    }}
                    disabled={!selectedPlan || !selectedMethod || processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Memproses...
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

  // Step 3: Payment Instruction
  if (step === 'payment-instruction' && paymentData) {
    const getBankName = (bank?: string) => {
      const banks: Record<string, string> = { bca: 'BCA', bni: 'BNI', bri: 'BRI', mandiri: 'Mandiri', permata: 'Permata' };
      return banks[bank?.toLowerCase() || ''] || bank?.toUpperCase() || '';
    };

    const vaInfo = paymentData.payment_info?.va_number ? {
      bank: paymentData.payment_info.bank,
      number: paymentData.payment_info.va_number,
    } : null;

    const mandiriBill = paymentData.payment_info?.biller_code ? {
      biller_code: paymentData.payment_info.biller_code,
      bill_key: paymentData.payment_info.bill_key,
    } : null;

    const qrCodeUrl = paymentData.payment_info?.qr_url;
    const amount = paymentData.gross_amount || 0;

    if (isExpired) {
      return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-8 pb-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold">Waktu Pembayaran Habis</h2>
              <p className="text-muted-foreground">Silakan buat pesanan baru.</p>
              <Button onClick={() => { setStep('checkout'); setPaymentData(null); setOrderId(''); }}>
                Buat Pesanan Baru
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-muted/30 py-8 px-4">
        <div className="container mx-auto max-w-lg">
          <Button variant="ghost" className="mb-6" onClick={() => setStep('checkout')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>

          {/* Timer */}
          <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span className="text-sm text-orange-700">Selesaikan pembayaran</span>
                </div>
                <span className="text-xl font-bold text-orange-700 font-mono">{timeRemaining}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader className="text-center border-b">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                {vaInfo || mandiriBill ? <Building2 className="h-8 w-8 text-primary" /> : <QrCode className="h-8 w-8 text-primary" />}
              </div>
              <CardTitle>Instruksi Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="text-center py-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Pembayaran</p>
                <p className="text-3xl font-bold text-primary">Rp {amount.toLocaleString('id-ID')}</p>
              </div>

              {vaInfo && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Nomor VA {getBankName(vaInfo.bank)}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-mono font-bold">{vaInfo.number}</p>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(vaInfo.number || '')}>
                      {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {mandiriBill && (
                <>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Kode Biller</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-mono font-bold">{mandiriBill.biller_code}</p>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(mandiriBill.biller_code || '')}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Bill Key</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-mono font-bold">{mandiriBill.bill_key}</p>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(mandiriBill.bill_key || '')}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {qrCodeUrl && (
                <div className="text-center">
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 mx-auto bg-white p-2 rounded-lg" />
                  <p className="text-sm text-muted-foreground mt-2">Scan dengan aplikasi e-wallet</p>
                </div>
              )}

              <Separator />

              <Button className="w-full" size="lg" onClick={checkPaymentStatus} disabled={checkingStatus}>
                {checkingStatus ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memeriksa...</>
                ) : (
                  <><RefreshCw className="h-4 w-4 mr-2" />Saya Sudah Bayar</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
