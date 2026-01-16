import { ServicePlanCard } from "@/components/service-plans/ServicePlanCard";
import { useServicePlans } from "@/features/service-plans/service-plan.store";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const ServicePlansCatalogPage = () => {
  const { plans, loading, error } = useServicePlans();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Katalog Paket Internet</h1>
        <p className="text-sm text-muted-foreground">
          Daftar lengkap paket internet dengan detail fitur
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Gagal memuat data paket: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[400px]" />
          ))}
        </div>
      ) : plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <ServicePlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Belum ada paket internet tersedia
        </div>
      )}
    </div>
  );
};

export default ServicePlansCatalogPage;
