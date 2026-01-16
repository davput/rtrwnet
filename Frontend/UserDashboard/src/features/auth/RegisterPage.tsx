import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Check, Building2, CreditCard, Sparkles, Mail, ShieldCheck, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billing_cycle: string;
  max_customers: number;
  max_users: number;
  features: Record<string, boolean>;
}

interface SignUpResponse {
  tenant_id: string;
  user_id: string;
  order_id?: string;
  amount?: number;
  payment_url?: string;
  snap_token?: string;
  is_trial: boolean;
  trial_ends?: string;
  message: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8089/api/v1';

export function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Start from step 1 (account info)
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [signUpResult, setSignUpResult] = useState<SignUpResponse | null>(null);
  
  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [formData, setFormData] = useState({
    isp_name: '',
    owner_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    plan_id: '',
    use_trial: true,
    agree_terms: false,
  });

  // Load plans on mount
  useEffect(() => {
    fetchPlans();
  }, []);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/public/plans`);
      const result = await response.json();
      if (result.success && result.data?.plans) {
        setPlans(result.data.plans);
        if (result.data.plans.length > 0) {
          setFormData(prev => ({ ...prev, plan_id: result.data.plans[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    } finally {
      setLoadingPlans(false);
    }
  };

  // Validate Step 1 (Account Info)
  const validateStep1 = () => {
    if (!formData.isp_name || formData.isp_name.length < 3) {
      setError('Nama ISP minimal 3 karakter');
      return false;
    }
    if (!formData.owner_name || formData.owner_name.length < 2) {
      setError('Nama pemilik minimal 2 karakter');
      return false;
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Email tidak valid');
      return false;
    }
    if (!formData.phone || formData.phone.length < 10) {
      setError('Nomor telepon minimal 10 digit');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return false;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Password tidak cocok');
      return false;
    }
    return true;
  };

  // Validate Step 3 (Plan Selection)
  const validateStep3 = () => {
    if (!formData.plan_id) {
      setError('Pilih paket langganan');
      return false;
    }
    if (!formData.agree_terms) {
      setError('Anda harus menyetujui syarat dan ketentuan');
      return false;
    }
    return true;
  };

  // Handle next from Step 1 to Step 2 (just move to step 2, don't send OTP yet)
  const handleStep1Next = () => {
    setError(null);
    if (!validateStep1()) return;
    setStep(2); // Move to step 2 without sending OTP
  };

  // Send OTP (called manually from step 2)
  const handleSendOTP = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          purpose: 'registration',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || result.message || 'Gagal mengirim OTP');
      }

      setOtpSent(true);
      setCountdown(60);
      setSuccess('Kode OTP telah dikirim ke email Anda');
      setOtp(['', '', '', '', '', '']);
      
      // Focus first OTP input
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim OTP');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
      verifyOTP(newOtp.join(''));
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      verifyOTP(pastedData);
    }
  };

  // Handle OTP keydown
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const verifyOTP = async (otpCode: string) => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: otpCode,
          purpose: 'registration',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || result.message || 'Kode OTP tidak valid');
      }

      setOtpVerified(true);
      setSuccess('Email berhasil diverifikasi!');
      
      setTimeout(() => {
        setStep(3);
        setSuccess(null);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verifikasi gagal');
      setOtp(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setError(null);
    setSuccess(null);
    if (step === 2) {
      setOtpSent(false);
      setOtpVerified(false);
      setOtp(['', '', '', '', '', '']);
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateStep3()) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/public/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isp_name: formData.isp_name,
          owner_name: formData.owner_name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          plan_id: formData.plan_id,
          use_trial: formData.use_trial,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || result.message || 'Registrasi gagal');
      }

      setSignUpResult(result.data);

      if (result.data.is_trial) {
        setStep(5); // Success
      } else {
        setStep(4); // Payment
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!signUpResult?.snap_token) {
      if (signUpResult?.payment_url) {
        window.location.href = signUpResult.payment_url;
      }
      return;
    }

    // @ts-ignore
    if (window.snap) {
      // @ts-ignore
      window.snap.pay(signUpResult.snap_token, {
        onSuccess: () => setStep(5),
        onPending: () => setError('Pembayaran pending. Silakan selesaikan pembayaran.'),
        onError: () => setError('Pembayaran gagal. Silakan coba lagi.'),
        onClose: () => setError('Anda menutup popup pembayaran tanpa menyelesaikan pembayaran.'),
      });
    } else if (signUpResult?.payment_url) {
      window.location.href = signUpResult.payment_url;
    }
  };

  const selectedPlan = plans.find(p => p.id === formData.plan_id);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Data Akun';
      case 2: return 'Verifikasi Email';
      case 3: return 'Pilih Paket Langganan';
      case 4: return 'Pembayaran';
      case 5: return 'Registrasi Berhasil!';
      default: return '';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1: return 'Lengkapi data ISP dan akun Anda';
      case 2: return 'Masukkan kode OTP yang dikirim ke email Anda';
      case 3: return 'Pilih paket yang sesuai dengan kebutuhan Anda';
      case 4: return 'Selesaikan pembayaran untuk mengaktifkan akun';
      case 5: return 'Akun Anda telah berhasil dibuat';
      default: return '';
    }
  };

  const getStepIcon = (s: number) => {
    switch (s) {
      case 1: return <User className="h-4 w-4" />;
      case 2: return <Mail className="h-4 w-4" />;
      default: return s;
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {getStepTitle()}
          </CardTitle>
          <CardDescription className="text-center">
            {getStepDescription()}
          </CardDescription>

          {/* Progress indicator */}
          <div className="flex justify-center pt-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                      step >= s
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {step > s ? <Check className="h-4 w-4" /> : getStepIcon(s)}
                  </div>
                  {s < 5 && (
                    <div
                      className={cn(
                        'w-6 h-1 mx-1 transition-all',
                        step > s ? 'bg-primary' : 'bg-muted'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-300">{success}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Account Info */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); handleStep1Next(); }} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="isp_name">Nama ISP / RT-RW Net</Label>
                  <Input
                    id="isp_name"
                    placeholder="Contoh: RT Net Cempaka"
                    value={formData.isp_name}
                    onChange={(e) => setFormData({ ...formData, isp_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner_name">Nama Pemilik</Label>
                  <Input
                    id="owner_name"
                    placeholder="Nama lengkap"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    placeholder="08xxxxxxxxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Konfirmasi Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="Ulangi password"
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Lanjutkan
              </Button>
            </form>
          )}

          {/* Step 2: Email Verification (OTP) */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Verifikasi email Anda
                </p>
                <p className="font-medium">{formData.email}</p>
              </div>

              {!otpSent ? (
                // Show "Kirim OTP" button before OTP is sent
                <div className="space-y-4">
                  <p className="text-center text-sm text-muted-foreground">
                    Klik tombol di bawah untuk mengirim kode OTP ke email Anda
                  </p>
                  <Button 
                    onClick={handleSendOTP} 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mengirim OTP...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Kirim Kode OTP
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                // Show OTP input after OTP is sent
                <div className="space-y-4">
                  <Label className="text-center block">Masukkan Kode OTP</Label>
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => (otpInputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={index === 0 ? handleOtpPaste : undefined}
                        className="w-12 h-12 text-center text-xl font-bold"
                        disabled={loading || otpVerified}
                      />
                    ))}
                  </div>

                  {otpVerified && (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <ShieldCheck className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="text-green-600 font-medium">Email Terverifikasi!</p>
                    </div>
                  )}

                  {!otpVerified && (
                    <div className="flex flex-col items-center gap-2">
                      <Button
                        variant="ghost"
                        onClick={handleSendOTP}
                        disabled={countdown > 0 || loading}
                        className="text-sm"
                      >
                        {countdown > 0 ? `Kirim ulang dalam ${countdown}s` : 'Kirim Ulang OTP'}
                      </Button>
                    </div>
                  )}

                  {loading && !otpVerified && (
                    <div className="flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              )}

              <Button variant="outline" onClick={handleBack} className="w-full">
                Kembali
              </Button>
            </div>
          )}
          {/* Step 3: Plan Selection */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Show verified email badge */}
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span className="text-sm">Email terverifikasi: <span className="font-medium">{formData.email}</span></span>
              </div>

              {loadingPlans ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  <RadioGroup
                    value={formData.plan_id}
                    onValueChange={(value) => setFormData({ ...formData, plan_id: value })}
                    className="grid gap-4"
                  >
                    {plans.map((plan) => (
                      <div key={plan.id} className="relative">
                        <RadioGroupItem
                          value={plan.id}
                          id={plan.id}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={plan.id}
                          className={cn(
                            'flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all',
                            'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5',
                            'hover:border-primary/50'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Building2 className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-semibold">{plan.name}</p>
                                <p className="text-sm text-muted-foreground">{plan.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold">{formatPrice(plan.price)}</p>
                              <p className="text-sm text-muted-foreground">/{plan.billing_cycle === 'monthly' ? 'bulan' : 'tahun'}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-1 bg-muted rounded">
                              {plan.max_customers === -1 ? 'Unlimited' : plan.max_customers} pelanggan
                            </span>
                            <span className="px-2 py-1 bg-muted rounded">
                              {plan.max_users === -1 ? 'Unlimited' : plan.max_users} user
                            </span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  {/* Trial option */}
                  <div className="flex items-center space-x-2 p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                    <Checkbox
                      id="use_trial"
                      checked={formData.use_trial}
                      onCheckedChange={(checked) => setFormData({ ...formData, use_trial: checked as boolean })}
                    />
                    <Label htmlFor="use_trial" className="flex items-center gap-2 cursor-pointer">
                      <Sparkles className="h-4 w-4 text-green-600" />
                      <span>Gunakan Free Trial 7 Hari</span>
                      <span className="text-sm text-muted-foreground">(Tidak perlu kartu kredit)</span>
                    </Label>
                  </div>

                  {/* Terms */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agree_terms"
                      checked={formData.agree_terms}
                      onCheckedChange={(checked) => setFormData({ ...formData, agree_terms: checked as boolean })}
                    />
                    <Label htmlFor="agree_terms" className="text-sm cursor-pointer">
                      Saya menyetujui <a href="#" className="text-primary underline">Syarat dan Ketentuan</a> serta <a href="#" className="text-primary underline">Kebijakan Privasi</a>
                    </Label>
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                      Kembali
                    </Button>
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Memproses...
                        </>
                      ) : formData.use_trial ? (
                        'Mulai Free Trial'
                      ) : (
                        'Lanjut ke Pembayaran'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </form>
          )}

          {/* Step 4: Payment */}
          {step === 4 && signUpResult && (
            <div className="space-y-6">
              <div className="p-6 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="h-6 w-6 text-primary" />
                  <h3 className="font-semibold text-lg">Ringkasan Pembayaran</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Paket</span>
                    <span className="font-medium">{selectedPlan?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order ID</span>
                    <span className="font-mono text-sm">{signUpResult.order_id}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{formatPrice(signUpResult.amount || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={handlePayment} className="w-full" size="lg">
                <CreditCard className="mr-2 h-5 w-5" />
                Bayar Sekarang
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Pembayaran diproses secara aman melalui Midtrans
              </p>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 5 && signUpResult && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Selamat!</h3>
                <p className="text-muted-foreground">{signUpResult.message}</p>
              </div>

              {signUpResult.is_trial && signUpResult.trial_ends && (
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Free Trial aktif hingga:</span>{' '}
                    {new Date(signUpResult.trial_ends).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Button onClick={() => navigate('/login')} className="w-full" size="lg">
                  Login ke Dashboard
                </Button>
                <p className="text-sm text-muted-foreground">
                  Gunakan email <span className="font-mono">{formData.email}</span> untuk login
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-center">
          {step < 4 && (
            <p className="text-sm text-muted-foreground">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Login di sini
              </Link>
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default RegisterPage;
