import { useState } from "react";
import { useDashboard } from "./dashboard.store";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Wifi, CreditCard, TrendingUp, AlertCircle, Clock, Plus, FileText, ArrowUpRight, ArrowDownRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export function DashboardPage() {
  const { statistics, revenue, recent, loading, error } = useDashboard();
  const navigate = useNavigate();
  const [periodFilter, setPeriodFilter] = useState("this_month");

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Gagal memuat data dashboard: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = {
    totalCustomers: statistics?.total_customers || 0,
    activeCustomers: statistics?.active_customers || 0,
    suspendedCustomers: statistics?.suspended_customers || 0,
    newCustomersMonth: statistics?.new_customers_month || 0,
    monthlyRevenue: statistics?.monthly_revenue || 0,
    pendingPayments: statistics?.pending_payments || 0,
    overduePayments: statistics?.overdue_payments || 0,
  };

  const revenueData = {
    thisMonth: revenue?.this_month || 0,
    lastMonth: revenue?.last_month || 0,
    growth: revenue?.growth || 0,
    collected: revenue?.collected || 0,
    pending: revenue?.pending || 0,
    overdue: revenue?.overdue || 0,
    collectionRate: revenue?.collection_rate || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Pilih periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7_days">7 hari terakhir</SelectItem>
            <SelectItem value="this_month">Bulan ini</SelectItem>
            <SelectItem value="last_month">Bulan lalu</SelectItem>
            <SelectItem value="3_months">3 bulan terakhir</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards - Clickable */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div onClick={() => navigate('/pelanggan')} className="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5">
            <StatCard
              title="Total Pelanggan"
              value={stats.totalCustomers.toString()}
              description={`${stats.activeCustomers} aktif, ${stats.suspendedCustomers} suspended`}
              icon={Users}
              trend="neutral"
              trendValue={`+${stats.newCustomersMonth} bulan ini`}
            />
          </div>
          <div onClick={() => navigate('/pelanggan?status=active')} className="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5">
            <StatCard
              title="Pelanggan Aktif"
              value={stats.activeCustomers.toString()}
              description="Pelanggan yang berlangganan"
              icon={Wifi}
              trend="up"
              trendValue={stats.totalCustomers > 0 ? `${((stats.activeCustomers / stats.totalCustomers) * 100).toFixed(1)}% dari total` : '0%'}
              iconColor="bg-emerald-500/20 text-emerald-400"
            />
          </div>
          <div onClick={() => navigate('/tagihan')} className="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5">
            <StatCard
              title="Pendapatan Bulan Ini"
              value={`Rp ${revenueData.thisMonth.toLocaleString('id-ID')}`}
              description={`Collection rate: ${revenueData.collectionRate.toFixed(1)}%`}
              icon={CreditCard}
              trend={revenueData.growth >= 0 ? "up" : "down"}
              trendValue={`${revenueData.growth >= 0 ? '+' : ''}${revenueData.growth.toFixed(1)}% dari bulan lalu`}
              iconColor="bg-blue-500/20 text-blue-400"
            />
          </div>
          <div onClick={() => navigate('/tagihan?status=pending')} className="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5">
            <StatCard
              title="Tagihan Tertunda"
              value={`${stats.pendingPayments + stats.overduePayments}`}
              description={`Rp ${(revenueData.pending + revenueData.overdue).toLocaleString('id-ID')}`}
              icon={Clock}
              trend={stats.overduePayments > 0 ? "down" : "up"}
              trendValue={`${stats.overduePayments} terlambat bayar`}
              iconColor={stats.overduePayments > 0 ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}
            />
          </div>
        </div>
      )}

      {/* Revenue & Recent Activities - Same height */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Summary */}
        <Card className="border border-border/50 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Ringkasan Pendapatan
            </CardTitle>
            <CardDescription>Perbandingan pendapatan bulan ini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <>
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Collection Rate</span>
                    <div className="flex items-center gap-1">
                      {revenueData.collectionRate >= 80 ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-amber-400" />
                      )}
                      <span className={`text-lg font-bold ${revenueData.collectionRate >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {revenueData.collectionRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={revenueData.collectionRate} className="h-2" />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 transition-colors hover:bg-emerald-500/15">
                  <div>
                    <p className="text-sm text-muted-foreground">Terkumpul</p>
                    <p className="text-xl font-bold text-foreground">
                      Rp {revenueData.collected.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-medium">
                    Sukses
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 transition-colors hover:bg-amber-500/15">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-xl font-bold text-foreground">
                      Rp {revenueData.pending.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 font-medium">
                    {stats.pendingPayments} tagihan
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/30 transition-colors hover:bg-red-500/15">
                  <div>
                    <p className="text-sm text-muted-foreground">Terlambat</p>
                    <p className="text-xl font-bold text-foreground">
                      Rp {revenueData.overdue.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/40 font-medium">
                    {stats.overduePayments} tagihan
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="border border-border/50 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              Pembayaran Terbaru
            </CardTitle>
            <CardDescription>5 pembayaran terakhir</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recent?.recent_payments && recent.recent_payments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.recent_payments.slice(0, 5).map((payment) => (
                    <TableRow key={payment.id} className="border-border/50 hover:bg-muted/50 transition-colors cursor-pointer">
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{payment.customer_code}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">Rp {payment.amount.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(payment.payment_date), 'd MMM', { locale: id })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <FileText className="h-8 w-8 text-primary/60" />
                </div>
                <p className="text-foreground/80 font-medium mb-1">Belum ada pembayaran</p>
                <p className="text-sm text-muted-foreground mb-4">Mulai dengan membuat tagihan pertama</p>
                <Button onClick={() => navigate('/tagihan/buat')} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Buat Tagihan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Recent Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5" />
              Peringatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recent?.alerts && recent.alerts.length > 0 ? (
              <div className="space-y-3">
                {recent.alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg flex items-start gap-3 border transition-colors cursor-pointer ${
                      alert.severity === 'error'
                        ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/15'
                        : alert.severity === 'warning'
                        ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15'
                        : 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/15'
                    }`}
                  >
                    <AlertCircle
                      className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                        alert.severity === 'error'
                          ? 'text-red-400'
                          : alert.severity === 'warning'
                          ? 'text-amber-400'
                          : 'text-blue-400'
                      }`}
                    />
                    <div>
                      <p className="font-medium text-foreground">{alert.message}</p>
                      {alert.count && (
                        <p className="text-sm text-muted-foreground">{alert.count} item</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-emerald-500/15 p-3 mb-3">
                  <AlertCircle className="h-6 w-6 text-emerald-400" />
                </div>
                <p className="text-foreground/80 font-medium">Tidak ada peringatan</p>
                <p className="text-xs text-muted-foreground mt-1">Semua berjalan dengan baik!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Pelanggan Baru
            </CardTitle>
            <CardDescription>Pelanggan terbaru bulan ini</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recent?.recent_customers && recent.recent_customers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Nama</TableHead>
                    <TableHead>Paket</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.recent_customers.slice(0, 5).map((customer) => (
                    <TableRow key={customer.id} className="border-border/50 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/pelanggan/${customer.id}`)}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">{customer.customer_code}</p>
                        </div>
                      </TableCell>
                      <TableCell>{customer.service_plan}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            customer.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }
                        >
                          {customer.status === 'active' ? 'Aktif' : customer.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <Users className="h-8 w-8 text-primary/60" />
                </div>
                <p className="text-foreground/80 font-medium mb-1">Belum ada pelanggan baru</p>
                <p className="text-sm text-muted-foreground mb-4">Tambahkan pelanggan pertama Anda</p>
                <Button onClick={() => navigate('/pelanggan/tambah')} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Tambah Pelanggan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;
