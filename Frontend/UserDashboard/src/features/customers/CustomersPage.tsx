import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CustomerTable } from "./CustomerTable";
import { CustomerForm } from "./CustomerForm";
import { CustomerSettings } from "./CustomerSettings";
import { useCustomers, useCustomerStats } from "./customer.store";
import { ImportExportDialog } from "./ImportExportDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, FileSpreadsheet, Users, UserCheck, UserX, Clock, Wifi, Settings } from "lucide-react";
import { PlanLimitBanner, LimitedButton } from "@/components/plan";
import { usePlanLimits } from "@/contexts/PlanLimitsContext";
import { useCustomerEvents } from "@/hooks/useCustomerEvents";

// Stats Cards Component
function CustomerStatsCards({ stats }: { stats: any }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pelanggan</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Aktif</CardTitle>
          <UserCheck className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Online</CardTitle>
          <Wifi className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-500">{stats.online || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Suspended</CardTitle>
          <UserX className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
        </CardContent>
      </Card>
    </div>
  );
}

// Stats Skeleton
function CustomerStatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Table Skeleton
function CustomerTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function CustomersPage() {
  const navigate = useNavigate();
  const { customers, loading: customersLoading, refresh: refreshCustomers } = useCustomers();
  const { stats, loading: statsLoading, refresh: refreshStats } = useCustomerStats();
  const { refresh: refreshPlanLimits } = usePlanLimits();
  const [showImportExport, setShowImportExport] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Combined refresh function - memoized to prevent unnecessary re-renders
  const handleRefresh = useCallback(() => {
    refreshCustomers();
    refreshStats();
  }, [refreshCustomers, refreshStats]);

  // Full refresh including plan limits (for manual actions)
  const handleFullRefresh = useCallback(() => {
    refreshCustomers();
    refreshStats();
    refreshPlanLimits();
  }, [refreshCustomers, refreshStats, refreshPlanLimits]);

  // Subscribe to realtime customer events (SSE)
  useCustomerEvents({
    onAnyEvent: () => {
      // Refresh data when any customer event occurs (online/offline)
      handleRefresh();
    },
    enabled: true,
  });

  return (
    <div className="space-y-6">
      {/* Plan Limit Banner */}
      <PlanLimitBanner type="customer" alwaysShow />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Pelanggan</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Pengaturan
          </Button>
          <LimitedButton 
            limitType="customer" 
            onClick={() => setShowAddCustomer(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Tambah Pelanggan
          </LimitedButton>
          <Button variant="outline" onClick={() => setShowImportExport(true)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Import / Export
          </Button>
        </div>
      </div>

      {statsLoading ? (
        <CustomerStatsCardsSkeleton />
      ) : (
        <CustomerStatsCards stats={stats} />
      )}

      {customersLoading ? (
        <CustomerTableSkeleton />
      ) : (
        <CustomerTable 
          customers={customers} 
          onEdit={(customer) => navigate(`/pelanggan/${customer.id}/edit`)}
          onRefresh={handleRefresh}
          autoRefreshInterval={0} // Disabled - using SSE for realtime updates
        />
      )}

      <ImportExportDialog 
        open={showImportExport} 
        onOpenChange={setShowImportExport}
        onImportSuccess={handleFullRefresh}
      />

      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
          </DialogHeader>
          <CustomerForm 
            mode="create" 
            onSuccess={() => {
              setShowAddCustomer(false);
              handleFullRefresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <CustomerSettings open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
}

export default CustomersPage;
