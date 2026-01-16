import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Customer, CustomerStatus } from "./customer.types";
import { customerApi } from "./customer.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Wifi,
  WifiOff,
  Search,
  PlayCircle,
  PauseCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onRefresh?: () => void;
  loading?: boolean;
  autoRefreshInterval?: number; // in milliseconds, default 10000 (10 seconds)
}

function StatusBadge({ status }: { status: CustomerStatus }) {
  const config = {
    active: { label: "Aktif", className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" },
    suspended: { label: "Suspended", className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" },
    pending_activation: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800" },
    inactive: { label: "Tidak Aktif", className: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800" },
    terminated: { label: "Terminated", className: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800" },
  };
  const { label, className } = config[status] || config.inactive;
  return <Badge variant="outline" className={className}>{label}</Badge>;
}

function ServiceTypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; className: string }> = {
    dhcp: { label: "DHCP", className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400" },
    pppoe: { label: "PPPoE", className: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400" },
    static: { label: "Static", className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400" },
  };
  const { label, className } = config[type] || config.dhcp;
  return <Badge variant="outline" className={className}>{label}</Badge>;
}

type BulkAction = "delete" | "activate" | "suspend" | "terminate" | null;

type SortField = "customer_code" | "name" | "phone" | "service_plan" | "status" | "monthly_fee" | "is_online";
type SortDirection = "asc" | "desc";

export function CustomerTable({ 
  customers, 
  onEdit, 
  onRefresh, 
  loading = false,
  autoRefreshInterval = 10000 // 10 seconds default
}: CustomerTableProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Auto refresh effect
  useEffect(() => {
    if (!onRefresh || autoRefreshInterval <= 0) return;
    
    const interval = setInterval(() => {
      onRefresh();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [onRefresh, autoRefreshInterval]);
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Single delete state
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Bulk action state
  const [bulkAction, setBulkAction] = useState<BulkAction>(null);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  
  // Filter & pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Sorting state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortField(null);
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort icon component
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="ml-1 h-3 w-3" />
      : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  // Filter and sort customers
  const filteredAndSortedCustomers = useMemo(() => {
    let result = customers.filter((customer) => {
      const matchesSearch = 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm);
      
      const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
      const matchesServiceType = serviceTypeFilter === "all" || customer.service_type === serviceTypeFilter;
      
      return matchesSearch && matchesStatus && matchesServiceType;
    });

    // Apply sorting
    if (sortField) {
      result = [...result].sort((a, b) => {
        let aValue: string | number | boolean = "";
        let bValue: string | number | boolean = "";

        switch (sortField) {
          case "customer_code":
            aValue = a.customer_code || "";
            bValue = b.customer_code || "";
            break;
          case "name":
            aValue = a.name || "";
            bValue = b.name || "";
            break;
          case "phone":
            aValue = a.phone || "";
            bValue = b.phone || "";
            break;
          case "service_plan":
            aValue = a.service_plan?.name || "";
            bValue = b.service_plan?.name || "";
            break;
          case "status":
            aValue = a.status || "";
            bValue = b.status || "";
            break;
          case "monthly_fee":
            aValue = a.monthly_fee || 0;
            bValue = b.monthly_fee || 0;
            break;
          case "is_online":
            aValue = a.is_online ? 1 : 0;
            bValue = b.is_online ? 1 : 0;
            break;
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc" 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });
    }

    return result;
  }, [customers, searchTerm, statusFilter, serviceTypeFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCustomers.length / pageSize);
  const paginatedCustomers = filteredAndSortedCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Selection handlers
  const isAllSelected = paginatedCustomers.length > 0 && 
    paginatedCustomers.every((c) => selectedIds.has(c.id));
  
  const isSomeSelected = paginatedCustomers.some((c) => selectedIds.has(c.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const newSelected = new Set(selectedIds);
      paginatedCustomers.forEach((c) => newSelected.delete(c.id));
      setSelectedIds(newSelected);
    } else {
      const newSelected = new Set(selectedIds);
      paginatedCustomers.forEach((c) => newSelected.add(c.id));
      setSelectedIds(newSelected);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Single delete
  const handleDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    try {
      await customerApi.deleteCustomer(customerToDelete.id);
      toast({
        title: "Pelanggan berhasil dihapus",
        description: `Data pelanggan ${customerToDelete.name} telah dihapus.`,
      });
      onRefresh?.();
    } catch (error) {
      toast({
        title: "Gagal menghapus pelanggan",
        description: "Terjadi kesalahan saat menghapus data pelanggan.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setCustomerToDelete(null);
    }
  };

  // Bulk actions
  const handleBulkAction = (action: BulkAction) => {
    if (selectedIds.size === 0) {
      toast({
        title: "Tidak ada pelanggan dipilih",
        description: "Pilih minimal satu pelanggan untuk melakukan aksi.",
        variant: "destructive",
      });
      return;
    }
    setBulkAction(action);
  };

  const confirmBulkAction = async () => {
    if (!bulkAction || selectedIds.size === 0) return;
    
    setIsProcessingBulk(true);
    const ids = Array.from(selectedIds);
    let successCount = 0;
    let failCount = 0;

    for (const id of ids) {
      try {
        switch (bulkAction) {
          case "delete":
            await customerApi.deleteCustomer(id);
            break;
          case "activate":
            await customerApi.activateCustomer(id);
            break;
          case "suspend":
            await customerApi.suspendCustomer(id);
            break;
          case "terminate":
            await customerApi.terminateCustomer(id);
            break;
        }
        successCount++;
      } catch {
        failCount++;
      }
    }

    const actionLabels: Record<string, string> = {
      delete: "dihapus",
      activate: "diaktifkan",
      suspend: "disuspend",
      terminate: "diterminasi",
    };

    toast({
      title: `Aksi selesai`,
      description: `${successCount} pelanggan berhasil ${actionLabels[bulkAction]}${failCount > 0 ? `, ${failCount} gagal` : ""}`,
      variant: failCount > 0 ? "destructive" : "default",
    });

    setIsProcessingBulk(false);
    setBulkAction(null);
    clearSelection();
    onRefresh?.();
  };

  const getBulkActionTitle = () => {
    switch (bulkAction) {
      case "delete": return "Hapus Pelanggan";
      case "activate": return "Aktifkan Pelanggan";
      case "suspend": return "Suspend Pelanggan";
      case "terminate": return "Terminasi Pelanggan";
      default: return "";
    }
  };

  const getBulkActionDescription = () => {
    const count = selectedIds.size;
    switch (bulkAction) {
      case "delete": return `Apakah Anda yakin ingin menghapus ${count} pelanggan? Tindakan ini tidak dapat dibatalkan.`;
      case "activate": return `Apakah Anda yakin ingin mengaktifkan ${count} pelanggan?`;
      case "suspend": return `Apakah Anda yakin ingin mensuspend ${count} pelanggan?`;
      case "terminate": return `Apakah Anda yakin ingin menterminasi ${count} pelanggan?`;
      default: return "";
    }
  };

  if (loading) {
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

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Daftar Pelanggan</CardTitle>
            
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                <span className="text-sm font-medium">{selectedIds.size} dipilih</span>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("activate")}>
                  <PlayCircle className="h-4 w-4 mr-1" />
                  Aktifkan
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("suspend")}>
                  <PauseCircle className="h-4 w-4 mr-1" />
                  Suspend
                </Button>
                <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleBulkAction("delete")}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Hapus
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, kode, atau telepon..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending_activation">Pending</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
            <Select value={serviceTypeFilter} onValueChange={(v) => { setServiceTypeFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="dhcp">DHCP</SelectItem>
                <SelectItem value="pppoe">PPPoE</SelectItem>
                <SelectItem value="static">Static IP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                      className={isSomeSelected && !isAllSelected ? "opacity-50" : ""}
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort("customer_code")}
                  >
                    <div className="flex items-center">
                      Kode
                      <SortIcon field="customer_code" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Nama
                      <SortIcon field="name" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort("phone")}
                  >
                    <div className="flex items-center">
                      Telepon
                      <SortIcon field="phone" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort("service_plan")}
                  >
                    <div className="flex items-center">
                      Paket
                      <SortIcon field="service_plan" />
                    </div>
                  </TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      Status
                      <SortIcon field="status" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort("is_online")}
                  >
                    <div className="flex items-center">
                      Online
                      <SortIcon field="is_online" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort("monthly_fee")}
                  >
                    <div className="flex items-center">
                      Biaya
                      <SortIcon field="monthly_fee" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[80px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Tidak ada data pelanggan yang ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCustomers.map((customer) => (
                    <TableRow 
                      key={customer.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/pelanggan/${customer.id}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(customer.id)}
                          onCheckedChange={() => toggleSelect(customer.id)}
                          aria-label={`Select ${customer.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{customer.customer_code}</TableCell>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell className="text-sm">{customer.phone}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{customer.service_plan?.name || "-"}</div>
                          <div className="text-muted-foreground text-xs">
                            {customer.service_plan?.speed_download || 0} Mbps
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><ServiceTypeBadge type={customer.service_type} /></TableCell>
                      <TableCell><StatusBadge status={customer.status} /></TableCell>
                      <TableCell>
                        {customer.status === "active" ? (
                          customer.is_online ? (
                            <div className="flex items-center text-green-600">
                              <Wifi className="h-4 w-4 mr-1" />
                              <span className="text-xs">Online</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-gray-400">
                              <WifiOff className="h-4 w-4 mr-1" />
                              <span className="text-xs">Offline</span>
                            </div>
                          )
                        ) : null}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        Rp {(customer.monthly_fee || 0).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/pelanggan/${customer.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(customer)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(customer)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Menampilkan {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredAndSortedCustomers.length)} dari {filteredAndSortedCustomers.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Single Delete Dialog */}
      <AlertDialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pelanggan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data pelanggan {customerToDelete?.name}? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Action Dialog */}
      <AlertDialog open={!!bulkAction} onOpenChange={() => setBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getBulkActionTitle()}</AlertDialogTitle>
            <AlertDialogDescription>{getBulkActionDescription()}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingBulk}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkAction}
              className={bulkAction === "delete" ? "bg-red-600 hover:bg-red-700" : ""}
              disabled={isProcessingBulk}
            >
              {isProcessingBulk ? "Memproses..." : "Ya, Lanjutkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
