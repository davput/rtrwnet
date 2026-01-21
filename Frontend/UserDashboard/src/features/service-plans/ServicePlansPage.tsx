import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useServicePlans } from "./service-plan.store";
import { servicePlanApi } from "./service-plan.api";
import { ServicePlanForm } from "./ServicePlanForm";
import type { ServicePlan } from "./service-plan.types";
import { DataTable, Column } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
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

export function ServicePlansPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { plans, loading, refresh } = useServicePlans();
  const [planToDelete, setPlanToDelete] = useState<ServicePlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);

  const handleDelete = (plan: ServicePlan) => {
    setPlanToDelete(plan);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;
    setIsDeleting(true);
    try {
      await servicePlanApi.delete(planToDelete.id);
      toast({
        title: "Berhasil",
        description: `Paket ${planToDelete.name} berhasil dihapus`,
      });
      refresh();
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus paket",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setPlanToDelete(null);
    }
  };

  const columns: Column<ServicePlan>[] = [
    {
      key: "name",
      header: "Nama Paket",
      cell: (row) => (
        <div>
          <div className="font-medium">{row.name}</div>
          {row.description && (
            <div className="text-sm text-muted-foreground line-clamp-1">{row.description}</div>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: "speed_download",
      header: "Download",
      cell: (row) => <span>{row.speed_download} Mbps</span>,
      sortable: true,
    },
    {
      key: "speed_upload",
      header: "Upload",
      cell: (row) => <span>{row.speed_upload} Mbps</span>,
      sortable: true,
    },
    {
      key: "price",
      header: "Harga/Bulan",
      cell: (row) => <span>Rp {(row.price || 0).toLocaleString("id-ID")}</span>,
      sortable: true,
    },
    {
      key: "is_active",
      header: "Status",
      cell: (row) => (
        <Badge variant={row.is_active ? "default" : "secondary"}>
          {row.is_active ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "actions",
      header: "Aksi",
      className: "w-[80px]",
      cell: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/paket-internet/${row.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Lihat Detail
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/paket-internet/${row.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(row)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Paket Internet</h1>
          <p className="text-sm text-muted-foreground">
            Kelola paket layanan internet untuk pelanggan
          </p>
        </div>
        <Button onClick={() => setShowAddPlan(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Paket
        </Button>
      </div>

      <DataTable
        data={plans}
        columns={columns}
        title="Daftar Paket"
        description={`Total ${plans.length} paket internet`}
        searchable
        searchPlaceholder="Cari nama paket..."
        searchKeys={["name", "description"]}
        filters={[
          {
            key: "is_active",
            label: "Status",
            options: [
              { value: "true", label: "Aktif" },
              { value: "false", label: "Nonaktif" },
            ],
          },
        ]}
        pagination
        pageSize={10}
        loading={loading}
        emptyMessage="Belum ada paket internet"
        onRowClick={(row) => navigate(`/paket-internet/${row.id}`)}
      />

      <Dialog open={showAddPlan} onOpenChange={setShowAddPlan}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Paket Internet</DialogTitle>
            <DialogDescription>Buat paket internet baru untuk pelanggan</DialogDescription>
          </DialogHeader>
          <ServicePlanForm 
            mode="create"
            onSuccess={() => {
              setShowAddPlan(false);
              refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!planToDelete} onOpenChange={() => setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Paket</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus paket "{planToDelete?.name}"? 
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
    </div>
  );
}

export default ServicePlansPage;
