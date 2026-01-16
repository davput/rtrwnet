import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Calendar,
  ExternalLink,
  CreditCard,
  ArrowRight
} from "lucide-react";
import { api, BillingDashboard } from "@/lib/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState<BillingDashboard | null>(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      // Check if user is logged in
      const accessToken = sessionStorage.getItem('access_token');
      const tenantId = sessionStorage.getItem('tenant_id');

      // If coming from registration, might have URL params
      const urlTenantId = searchParams.get('tenant_id');
      const urlEmail = searchParams.get('email');
      const urlTrialEnds = searchParams.get('trial_ends');

      if (!accessToken && !urlTenantId) {
        // Not logged in and no registration data
        navigate('/login');
        return;
      }

      // If from registration (has URL params but no token yet)
      if (urlTenantId && !accessToken) {
        // Show registration success data
        const mockData: BillingDashboard = {
          tenant: {
            id: urlTenantId,
            name: 'Your ISP',
            subdomain: 'yourisp',
            email: urlEmail || '',
            phone: '',
            is_active: true,
          },
          subscription: {
            id: '',
            plan_id: '',
            plan_name: 'Standard Plan',
            plan_slug: 'standard',
            status: 'trial',
            is_trial: true,
            start_date: new Date().toISOString(),
            end_date: urlTrialEnds || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            next_billing_date: urlTrialEnds || '',
            days_left: 7,
            auto_renew: false,
            payment_method: '',
          },
          billing: {
            current_plan: 'Standard Plan',
            monthly_price: 299000,
            currency: 'IDR',
            next_billing: urlTrialEnds || '',
            payment_method: '',
            can_upgrade: false,
            can_downgrade: false,
            available_plans: [],
          },
          usage: {
            current_period_start: new Date().toISOString(),
            current_period_end: urlTrialEnds || '',
            days_used: 0,
            days_remaining: 7,
          },
          invoices: [],
        };
        setBillingData(mockData);
        setLoading(false);
        return;
      }

      // If logged in, fetch from API
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8089';
      const billingData = await api.getBillingDashboard(accessToken!, tenantId!);
      setBillingData(billingData);
    } catch (error: any) {
      console.error('Error loading billing data:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal memuat data billing",
        variant: "destructive",
      });
      // Don't redirect on error, show error state
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  const handleGoToDashboard = () => {
    const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL || "https://app.rtrwnet.com";
    const tenantId = billingData?.tenant.id || sessionStorage.getItem('tenant_id');
    const email = sessionStorage.getItem('user_email');
    window.location.href = `${dashboardUrl}?tenant_id=${tenantId}&email=${email}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!billingData) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Gagal memuat data billing</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')}>Kembali ke Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const daysRemaining = billingData.subscription.days_left || 0;

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Dashboard Billing</h1>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Keluar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Selamat! Akun Anda Sudah Aktif 🎉
          </h2>
          <p className="text-muted-foreground">
            {billingData.subscription.is_trial 
              ? 'Trial 7 hari Anda telah dimulai. Silakan lanjutkan ke dashboard untuk mulai mengelola jaringan Anda.'
              : 'Subscription Anda aktif. Silakan lanjutkan ke dashboard.'}
          </p>
        </div>

        <div className="space-y-6">
          {/* Trial Status Card */}
          {billingData.subscription.is_trial && (
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Status Trial
                  </CardTitle>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    Aktif
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="text-center p-6 rounded-lg bg-muted/50">
                    <div className="text-5xl font-bold text-primary mb-2">{daysRemaining}</div>
                    <p className="text-sm text-muted-foreground">Hari tersisa</p>
                  </div>
                  <div className="flex flex-col justify-center space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Trial berakhir:</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground">
                      {billingData.subscription.trial_ends
                        ? new Date(billingData.subscription.trial_ends).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Billing Info Card */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Informasi Billing
              </CardTitle>
              <CardDescription>
                Detail paket subscription Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm text-muted-foreground">Paket Saat Ini</p>
                  <p className="text-lg font-semibold text-foreground">{billingData.billing.current_plan}</p>
                </div>
                <Badge variant="outline" className="text-lg font-bold">
                  Rp {(billingData.billing.monthly_price / 1000).toFixed(0)}K/bulan
                </Badge>
              </div>

              {billingData.subscription.is_trial && (
                <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Gratis selama trial
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Anda tidak akan dikenakan biaya selama masa trial 7 hari. 
                        Setelah trial berakhir, Anda dapat memilih untuk melanjutkan subscription atau membatalkan.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status Pembayaran</span>
                  <span className={`font-medium ${billingData.subscription.is_trial ? 'text-green-600' : 'text-foreground'}`}>
                    {billingData.subscription.is_trial ? 'Trial Aktif' : billingData.subscription.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tenant</span>
                  <span className="font-medium text-foreground">{billingData.tenant.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subdomain</span>
                  <span className="font-medium text-foreground">{billingData.tenant.subdomain}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle>Siap Memulai?</CardTitle>
              <CardDescription>
                Akses dashboard tenant untuk mulai mengelola pelanggan, billing, dan jaringan Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleGoToDashboard}
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25"
              >
                Buka Dashboard Tenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <div className="mt-4 p-4 rounded-lg bg-card/50 border border-border">
                <p className="text-xs text-muted-foreground mb-2">Dashboard URL:</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                    {import.meta.env.VITE_DASHBOARD_URL || "https://dashboard.yourdomain.com"}
                  </code>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Email konfirmasi telah dikirim ke <strong className="text-foreground">{sessionStorage.getItem('user_email')}</strong></span>
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Anda dapat login ke dashboard tenant menggunakan email dan password yang telah Anda daftarkan</span>
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Jika ada pertanyaan, hubungi support kami di support@netmanage.com</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
