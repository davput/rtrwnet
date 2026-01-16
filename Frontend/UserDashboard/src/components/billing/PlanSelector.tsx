import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSubscriptionPlans, useUpdateSubscription, useBillingDashboard } from '@/hooks/useBilling';
import { Check, Loader2, Star, TrendingUp, TrendingDown, Users, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SubscriptionPlan } from '@/types/billing';

export function PlanSelector() {
  const navigate = useNavigate();
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: billing, refetch: refetchBilling } = useBillingDashboard();
  const updateSubscription = useUpdateSubscription();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const currentPlanId = billing?.subscription.plan_id;
  const currentPlan = plans?.find(p => p.id === currentPlanId);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsConfirmOpen(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan) return;
    
    const isUpgradeAction = currentPlan && selectedPlan.price > currentPlan.price;
    const isDowngradeAction = currentPlan && selectedPlan.price < currentPlan.price;
    
    try {
      console.log('=== UPGRADE DEBUG ===');
      console.log('Selected plan:', selectedPlan);
      console.log('Selected plan ID:', selectedPlan.id);
      console.log('Selected plan name:', selectedPlan.name);
      console.log('Current plan:', currentPlan);
      console.log('Sending request with plan_id:', selectedPlan.id);
      
      const result = await updateSubscription.mutateAsync({ plan_id: selectedPlan.id });
      console.log('Update result:', result);
      
      // Check if upgrade requires payment
      if (result?.requires_payment && result?.order_id) {
        toast({
          title: '📝 Order Dibuat',
          description: `Silakan lanjutkan ke pembayaran untuk upgrade ke ${selectedPlan.name}`,
        });
        setIsConfirmOpen(false);
        setSelectedPlan(null);
        // Redirect to payment page
        navigate(`/payment/${result.order_id}`);
        return;
      }
      
      // Downgrade or settings update - applied immediately
      if (isDowngradeAction) {
        toast({
          title: '✅ Downgrade Berhasil!',
          description: `Paket berhasil diubah ke ${selectedPlan.name}`,
        });
      } else if (isUpgradeAction) {
        toast({
          title: '✅ Upgrade Berhasil!',
          description: `Paket berhasil diupgrade ke ${selectedPlan.name}`,
        });
      } else {
        toast({
          title: 'Berhasil',
          description: `Paket berhasil diubah ke ${selectedPlan.name}`,
        });
      }
      
      // Refresh billing data
      refetchBilling();
      
      setIsConfirmOpen(false);
      setSelectedPlan(null);
    } catch (error: any) {
      console.error('Update failed:', error);
      toast({
        title: 'Gagal',
        description: error?.response?.data?.error?.message || error?.response?.data?.message || 'Gagal mengubah paket. Silakan coba lagi.',
        variant: 'destructive',
      });
      setSelectedPlan(null);
    }
  };

  if (plansLoading) {
    return <PlanSelectorSkeleton />;
  }

  const isUpgrade = selectedPlan && currentPlan && selectedPlan.price > currentPlan.price;
  const isDowngrade = selectedPlan && currentPlan && selectedPlan.price < currentPlan.price;

  return (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Pilih Paket Langganan</h3>
          <p className="text-sm text-muted-foreground">
            Upgrade atau downgrade paket sesuai kebutuhan bisnis Anda
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans?.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlan={currentPlan}
              isCurrent={plan.id === currentPlanId}
              isLoading={selectedPlan?.id === plan.id && updateSubscription.isPending}
              onSelect={() => handleSelectPlan(plan)}
            />
          ))}
        </div>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isUpgrade ? 'Upgrade Paket' : isDowngrade ? 'Downgrade Paket' : 'Ubah Paket'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div>
                  Anda akan mengubah paket dari <strong>{currentPlan?.name}</strong> ke{' '}
                  <strong>{selectedPlan?.name}</strong>.
                </div>
                {isUpgrade && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 text-sm">
                    <div className="text-blue-900 dark:text-blue-100">
                      💳 Upgrade memerlukan pembayaran. Anda akan diarahkan ke halaman pembayaran setelah konfirmasi.
                    </div>
                  </div>
                )}
                {isDowngrade && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 text-sm">
                    <div className="text-amber-900 dark:text-amber-100">
                      ⚠️ Downgrade akan langsung aktif. Pastikan data Anda sesuai dengan limit paket baru.
                    </div>
                  </div>
                )}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-sm">
                    <span>Harga baru:</span>
                    <span className="font-semibold">
                      Rp {selectedPlan?.price.toLocaleString('id-ID')}/bulan
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Limit pelanggan:</span>
                    <span className="font-semibold">{selectedPlan?.max_customers}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Limit user:</span>
                    <span className="font-semibold">{selectedPlan?.max_users}</span>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateSubscription.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmUpgrade}
              disabled={updateSubscription.isPending}
            >
              {updateSubscription.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : isUpgrade ? (
                'Lanjut ke Pembayaran'
              ) : (
                'Ya, Ubah Paket'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface PlanCardProps {
  plan: SubscriptionPlan;
  currentPlan?: SubscriptionPlan;
  isCurrent: boolean;
  isLoading: boolean;
  onSelect: () => void;
}

function PlanCard({ plan, currentPlan, isCurrent, isLoading, onSelect }: PlanCardProps) {
  const isRecommended = plan.slug === 'professional'; // Atau logic lain
  const isUpgrade = currentPlan && plan.price > currentPlan.price;
  const isDowngrade = currentPlan && plan.price < currentPlan.price;

  return (
    <Card className={`relative ${isCurrent ? 'border-primary shadow-md' : isRecommended ? 'border-blue-500 shadow-md' : ''}`}>
      {isRecommended && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-blue-600 hover:bg-blue-700">
            <Star className="mr-1 h-3 w-3" />
            Rekomendasi
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{plan.name}</CardTitle>
            <CardDescription className="mt-1">{plan.description}</CardDescription>
          </div>
          {isCurrent && (
            <Badge variant="default" className="shrink-0">Aktif</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">
              Rp {(plan.price / 1000).toFixed(0)}K
            </span>
            <span className="text-sm text-muted-foreground">/bulan</span>
          </div>
          {!isCurrent && currentPlan && (
            <p className="text-xs text-muted-foreground mt-1">
              {isUpgrade && `+Rp ${((plan.price - currentPlan.price) / 1000).toFixed(0)}K dari paket saat ini`}
              {isDowngrade && `-Rp ${((currentPlan.price - plan.price) / 1000).toFixed(0)}K dari paket saat ini`}
            </p>
          )}
        </div>

        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">{plan.max_customers === -1 ? 'Unlimited' : plan.max_customers} Pelanggan</p>
              <p className="text-xs text-muted-foreground">Maksimal pelanggan aktif</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <UserCog className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">{plan.max_users === -1 ? 'Unlimited' : plan.max_users} User</p>
              <p className="text-xs text-muted-foreground">Maksimal user/staff</p>
            </div>
          </div>
        </div>

        {plan.features && Object.keys(plan.features).length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Fitur</p>
            <ul className="space-y-1.5">
              {Object.entries(plan.features).map(([key, value]) => {
                if (value === false) return null;
                return (
                  <li key={key} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <span>{formatFeatureValue(key, value)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button
          className="w-full"
          variant={isCurrent ? 'outline' : isUpgrade ? 'default' : 'outline'}
          disabled={isCurrent || isLoading}
          onClick={onSelect}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memproses...
            </>
          ) : isCurrent ? (
            'Paket Aktif'
          ) : isUpgrade ? (
            <>
              <TrendingUp className="mr-2 h-4 w-4" />
              Upgrade
            </>
          ) : isDowngrade ? (
            <>
              <TrendingDown className="mr-2 h-4 w-4" />
              Downgrade
            </>
          ) : (
            'Pilih Paket'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function formatFeatureValue(key: string, value: any): string {
  const name = formatFeatureName(key);
  if (value === true) return name;
  if (typeof value === 'string') return `${name}: ${value}`;
  if (typeof value === 'number') return `${name}: ${value}`;
  return name;
}

function formatFeatureName(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function PlanSelectorSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-32 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
