import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCustomer } from "./customer.store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, MoreVertical, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CustomerProfileTab } from "@/components/customers/detail/ProfileTab";
import { CustomerBillingTab } from "@/components/customers/detail/BillingTab";
import { CustomerMonitoringTab } from "@/components/customers/detail/MonitoringTab";
import { CustomerServiceTab } from "@/components/customers/detail/ServiceTab";
import { CustomerTicketsTab } from "@/components/customers/detail/TicketsTab";
import { CustomerHistoryTab } from "@/components/customers/detail/HistoryTab";

function CustomerDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [refreshing, setRefreshing] = useState(false);

  const { customer, loading, error, refresh } = useCustomer(id);

  // Handler untuk refresh data dari semua tab
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Handler ketika ada perubahan data di tab manapun
  const onDataChange = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  if (loading) {
    return <CustomerDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Error</h2>
        <p className="mb-4">{error}</p>
        <Button onClick={() => navigate("/pelanggan")}>
          Kembali ke Daftar Pelanggan
        </Button>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-2xl font-bold mb-4">Pelanggan Tidak Ditemukan</h2>
        <Button onClick={() => navigate("/pelanggan")}>
          Kembali ke Daftar Pelanggan
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/pelanggan")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {customer.customer_code} - {customer.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Detail informasi pelanggan
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={() => navigate(`/pelanggan/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Reset Password PPPoE</DropdownMenuItem>
              <DropdownMenuItem>Cetak Kartu Pelanggan</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                Terminasi Layanan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="service">Layanan</TabsTrigger>
          <TabsTrigger value="tickets">Tiket</TabsTrigger>
          <TabsTrigger value="history">Riwayat</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <CustomerProfileTab customer={customer} onDataChange={onDataChange} />
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <CustomerBillingTab customer={customer} onDataChange={onDataChange} />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <CustomerMonitoringTab customer={customer} onDataChange={onDataChange} />
        </TabsContent>

        <TabsContent value="service" className="space-y-4">
          <CustomerServiceTab customer={customer} onDataChange={onDataChange} />
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <CustomerTicketsTab customer={customer} onDataChange={onDataChange} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <CustomerHistoryTab customer={customer} onDataChange={onDataChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CustomerDetailPage;
