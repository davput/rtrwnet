import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBillingDashboard } from '@/hooks/useBilling';
import { CreditCard, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const statusColors = {
  trial: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const statusLabels = {
  trial: 'Trial',
  active: 'Aktif',
  expired: 'Kadaluarsa',
  cancelled: 'Dibatalkan',
};

export function BillingOverview() {
  const { data, isLoading, error } = useBillingDashboard();

  if (isLoading) {
    return <BillingOverviewSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Gagal memuat data billing</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { subscription, billing, usage } = data;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Current Plan */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paket Saat Ini</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{subscription.plan_name}</div>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={statusColors[subscription.status]}>
              {statusLabels[subscription.status]}
            </Badge>
            {subscription.is_trial && (
              <Badge variant="outline">Trial</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Rp {billing.monthly_price.toLocaleString('id-ID')} / bulan
          </p>
        </CardContent>
      </Card>

      {/* Subscription Period */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Periode Langganan</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{subscription.days_left ?? 0} hari</div>
          <p className="text-xs text-muted-foreground">
            tersisa hingga {subscription.end_date && !isNaN(new Date(subscription.end_date).getTime()) 
              ? format(new Date(subscription.end_date), 'd MMMM yyyy', { locale: id })
              : '-'}
          </p>
          {subscription.next_billing_date && !isNaN(new Date(subscription.next_billing_date).getTime()) && (
            <p className="text-xs text-muted-foreground mt-1">
              Tagihan berikutnya: {format(new Date(subscription.next_billing_date), 'd MMM yyyy', { locale: id })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Penggunaan</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usage.days_used} hari</div>
          <p className="text-xs text-muted-foreground">
            digunakan dari periode ini
          </p>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all"
              style={{ width: `${(usage.days_used / (usage.days_used + usage.days_remaining)) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BillingOverviewSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-48" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
