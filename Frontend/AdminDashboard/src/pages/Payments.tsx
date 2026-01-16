import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  CreditCard,
  DollarSign,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { getPaymentTransactions, getPaymentStats, reconcilePayment } from "@/api/admin.api";
import type { PaymentTransaction, PaymentTransactionFilters } from "@/types";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  expired: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  refunded: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  cancelled: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  paid: <CheckCircle className="h-3 w-3" />,
  failed: <XCircle className="h-3 w-3" />,
  expired: <AlertCircle className="h-3 w-3" />,
  refunded: <RefreshCw className="h-3 w-3" />,
  cancelled: <XCircle className="h-3 w-3" />,
};

export function Payments() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [filters, setFilters] = useState<PaymentTransactionFilters>({
    status: "",
    search: "",
  });

  const [reconcileDialog, setReconcileDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<{
    isMatched: boolean;
    localStatus: string;
    gatewayStatus: string;
    message: string;
    updatedStatus?: string;
  } | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    pendingCount: 0,
    paidCount: 0,
    failedCount: 0,
    expiredCount: 0,
  });

  const fetchStats = async () => {
    try {
      const response = await getPaymentStats();
      if (response.data.success) {
        const data = response.data.data;
        setStats({
          totalTransactions: data.total_transactions,
          totalRevenue: data.total_revenue,
          pendingCount: data.pending_count,
          paidCount: data.paid_count,
          failedCount: data.failed_count,
          expiredCount: data.expired_count,
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await getPaymentTransactions({
        page,
        per_page: perPage,
        status: filters.status || undefined,
        search: filters.search || undefined,
      });
      if (response.data.success) {
        setTransactions(response.data.data.transactions || []);
        setTotal(response.data.data.total);
      }
    } catch (error) {
      toast.error("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchTransactions();
  }, [page, filters.status]);

  const handleSearch = () => {
    setPage(1);
    fetchTransactions();
  };

  const handleRefresh = () => {
    fetchStats();
    fetchTransactions();
  };

  const handleReconcile = async () => {
    if (!selectedTransaction) return;
    
    setReconciling(true);
    setReconcileResult(null);
    
    try {
      const response = await reconcilePayment(selectedTransaction.order_id);
      if (response.data.success) {
        const result = response.data.data;
        setReconcileResult({
          isMatched: result.is_matched,
          localStatus: result.local_status,
          gatewayStatus: result.gateway_status,
          message: result.message,
          updatedStatus: result.updated_status,
        });
        
        if (result.updated_status) {
          toast.success(`Payment status updated to ${result.updated_status}`);
          fetchTransactions();
        } else if (result.is_matched) {
          toast.info("Payment status is already synchronized");
        }
      }
    } catch (error) {
      toast.error("Failed to reconcile payment");
    } finally {
      setReconciling(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPages = Math.ceil(total / perPage);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Transactions</h1>
          <p className="text-muted-foreground">
            Manage and reconcile payment transactions
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paidCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by Order ID or Transaction ID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
        </div>
        <Select
          value={filters.status || "all"}
          onValueChange={(value) => setFilters({ ...filters, status: value === "all" ? "" : value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch}>Search</Button>
      </div>


      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Gateway</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono text-sm">{tx.order_id}</TableCell>
                  <TableCell>{tx.tenant_name || "-"}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(tx.amount)}</TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[tx.status]} flex items-center gap-1 w-fit`}>
                      {statusIcons[tx.status]}
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{tx.payment_method || "-"}</TableCell>
                  <TableCell>{tx.payment_gateway || "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(tx.created_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTransaction(tx);
                        setReconcileResult(null);
                        setReconcileDialog(true);
                      }}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reconcile
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} transactions
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}


      {/* Reconcile Dialog */}
      <Dialog open={reconcileDialog} onOpenChange={setReconcileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reconcile Payment</DialogTitle>
            <DialogDescription>
              Check and synchronize payment status with Midtrans gateway
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order ID</p>
                  <p className="font-mono">{selectedTransaction.order_id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">{formatCurrency(selectedTransaction.amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Status</p>
                  <Badge className={statusColors[selectedTransaction.status]}>
                    {selectedTransaction.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Gateway</p>
                  <p>{selectedTransaction.payment_gateway || "-"}</p>
                </div>
              </div>

              {reconcileResult && (
                <div className={`p-4 rounded-lg ${
                  reconcileResult.isMatched 
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" 
                    : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                }`}>
                  <div className="flex items-start gap-3">
                    {reconcileResult.isMatched ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-medium">{reconcileResult.message}</p>
                      <div className="text-sm text-muted-foreground">
                        <p>Local: {reconcileResult.localStatus}</p>
                        <p>Gateway: {reconcileResult.gatewayStatus}</p>
                        {reconcileResult.updatedStatus && (
                          <p className="text-green-600 dark:text-green-400">
                            Updated to: {reconcileResult.updatedStatus}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReconcileDialog(false)}>
                  Close
                </Button>
                <Button onClick={handleReconcile} disabled={reconciling}>
                  {reconciling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Check Gateway Status
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
