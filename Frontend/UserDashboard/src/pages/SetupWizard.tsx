import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Package,
  Users,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Rocket,
} from 'lucide-react';
import { api } from '@/api/axios';

interface OnboardingStatus {
  completed: boolean;
  current_step: number;
  steps: OnboardingStep[];
  progress: number;
}

interface OnboardingStep {
  step: number;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

interface ServicePlanForm {
  name: string;
  description: string;
  speed_download: number;
  speed_upload: number;
  price: number;
}

export default function SetupWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);

  // Service plan form
  const [servicePlan, setServicePlan] = useState<ServicePlanForm>({
    name: '',
    description: '',
    speed_download: 10,
    speed_upload: 5,
    price: 100000,
  });

  // Check if service plan already exists
  const [hasServicePlan, setHasServicePlan] = useState(false);

  useEffect(() => {
    loadOnboardingStatus();
  }, []);

  const loadOnboardingStatus = async () => {
    try {
      const response = await api.get('/onboarding/status');
      const data = response.data.data;
      setOnboardingStatus(data);

      // If already completed, redirect to dashboard
      if (data.completed) {
        navigate('/');
        return;
      }

      // Check if service plan step is completed
      const servicePlanStep = data.steps.find((s: OnboardingStep) => s.step === 2);
      if (servicePlanStep?.completed) {
        setHasServicePlan(true);
        setCurrentStep(2); // Go to finish step
      }
    } catch (error) {
      console.error('Failed to load onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStep = async (step: number, completed: boolean) => {
    try {
      await api.put('/onboarding/step', { step, completed });
    } catch (error) {
      console.error('Failed to update step:', error);
    }
  };

  const completeOnboarding = async () => {
    setSaving(true);
    try {
      await api.post('/onboarding/complete');
      toast({
        title: 'Setup Selesai! 🎉',
        description: 'Selamat datang di RT/RW Net Dashboard',
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menyelesaikan setup',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateServicePlan = async () => {
    if (!servicePlan.name.trim()) {
      toast({
        title: 'Error',
        description: 'Nama paket harus diisi',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await api.post('/service-plans', servicePlan);
      await updateStep(2, true);
      setHasServicePlan(true);
      toast({ title: 'Paket internet berhasil dibuat!' });
      setCurrentStep(2);
      loadOnboardingStatus();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal membuat paket internet',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const skipToFinish = () => {
    setCurrentStep(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  const progress = hasServicePlan ? 100 : 50;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="container mx-auto max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <Rocket className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Setup Cepat</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Selamat Datang! 👋</h1>
          <p className="text-muted-foreground">Satu langkah lagi untuk memulai</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center mt-2">{progress}% selesai</p>
        </div>

        {/* Step Content */}
        <Card className="shadow-lg">
          {/* Step 1: Create Service Plan */}
          {currentStep === 1 && !hasServicePlan && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Buat Paket Internet</CardTitle>
                <CardDescription>Buat paket layanan pertama untuk pelanggan Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="planName">Nama Paket *</Label>
                  <Input
                    id="planName"
                    placeholder="Contoh: Paket Hemat 10 Mbps"
                    value={servicePlan.name}
                    onChange={(e) => setServicePlan({ ...servicePlan, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planDesc">Deskripsi</Label>
                  <Textarea
                    id="planDesc"
                    placeholder="Deskripsi singkat paket (opsional)"
                    value={servicePlan.description}
                    onChange={(e) => setServicePlan({ ...servicePlan, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="speedDown">Download (Mbps)</Label>
                    <Input
                      id="speedDown"
                      type="number"
                      value={servicePlan.speed_download}
                      onChange={(e) =>
                        setServicePlan({ ...servicePlan, speed_download: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="speedUp">Upload (Mbps)</Label>
                    <Input
                      id="speedUp"
                      type="number"
                      value={servicePlan.speed_upload}
                      onChange={(e) =>
                        setServicePlan({ ...servicePlan, speed_upload: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Harga per Bulan (Rp)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={servicePlan.price}
                    onChange={(e) => setServicePlan({ ...servicePlan, price: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex flex-col gap-2 pt-4">
                  <Button onClick={handleCreateServicePlan} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Package className="h-4 w-4 mr-2" />}
                    Buat Paket
                  </Button>
                  <Button variant="ghost" size="sm" onClick={skipToFinish}>
                    Lewati, buat nanti
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Complete */}
          {(currentStep === 2 || hasServicePlan) && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Siap Digunakan! 🎉</CardTitle>
                <CardDescription>Dashboard Anda sudah siap</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <p className="text-sm flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Akun bisnis sudah aktif
                  </p>
                  {hasServicePlan ? (
                    <p className="text-sm flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Paket internet sudah dibuat
                    </p>
                  ) : (
                    <p className="text-sm flex items-center gap-2 text-muted-foreground">
                      <Package className="h-4 w-4" />
                      Buat paket di menu Paket Internet
                    </p>
                  )}
                  <p className="text-sm flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Tambah pelanggan di menu Pelanggan
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Button onClick={completeOnboarding} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Mulai Menggunakan Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  {!hasServicePlan && (
                    <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Buat paket dulu
                    </Button>
                  )}
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
