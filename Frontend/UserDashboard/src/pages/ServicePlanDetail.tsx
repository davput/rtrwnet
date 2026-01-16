import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { servicePlanApi } from "@/features/service-plans/service-plan.api";
import type { ServicePlan } from "@/features/service-plans/service-plan.types";
import {
  ArrowLeft,
  Wifi,
  Download,
  Upload,
  DollarSign,
  Users,
  Edit,
  Save,
  X,
} from "lucide-react";

const ServicePlanDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plan, setPlan] = useState<ServicePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    speed_download: "",
    speed_upload: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    if (id) {
      loadPlanDetail();
    }
  }, [id]);

  const loadPlanDetail = async () => {
    try {
      setLoading(true);
      const data = await servicePlanApi.getById(id!);
      setPlan(data);
      setEditForm({
        name: data.name,
        price: data.price.toString(),
        speed_download: data.speed_download.toString(),
        speed_upload: data.speed_upload.toString(),
        description: data.description || "",
        is_active: data.is_active,
      });
    } catch (error) {
      console.error("Error loading plan:", error);
      toast({
        title: "Error",
        description: "Gagal memuat detail paket",
        variant: "destructive",
      });
      navigate("/paket-internet");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (plan) {
      setEditForm({
        name: plan.name,
        price: plan.price.toString(),
        speed_download: plan.speed_download.toString(),
        speed_upload: plan.speed_upload.toString(),
        description: plan.description || "",
        is_active: plan.is_active,
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editForm.name.trim()) {
      toast({ title: "Error", description: "Nama paket wajib diisi", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await servicePlanApi.update(id!, {
        name: editForm.name.trim(),
        price: parseInt(editForm.price),
        speed_download: parseInt(editForm.speed_download),
        speed_upload: parseInt(editForm.speed_upload),
        description: editForm.description.trim() || undefined,
        is_active: editForm.is_active,
      });

      toast({
        title: "Berhasil",
        description: "Paket berhasil diupdate",
      });

      setIsEditing(false);
      loadPlanDetail();
    } catch (error) {
      console.error("Error updating plan:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengupdate paket",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus paket ini?")) return;

    try {
      await servicePlanApi.delete(id!);
      toast({
        title: "Berhasil",
        description: "Paket berhasil dihapus",
      });
      navigate("/paket-internet");
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menghapus paket",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/paket-internet")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{plan.name}</h1>
            <p className="text-sm text-muted-foreground">Detail paket internet</p>
          </div>
          <Badge variant={plan.is_active ? "default" : "secondary"}>
            {plan.is_active ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Hapus
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                <X className="mr-2 h-4 w-4" />
                Batal
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Menyimpan..." : "Simpan"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Harga per Bulan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {plan.price.toLocaleString("id-ID")}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kecepatan Download</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plan.speed_download} Mbps</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kecepatan Upload</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plan.speed_upload} Mbps</div>
          </CardContent>
        </Card>

        {plan.customer_count !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jumlah Pelanggan</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plan.customer_count}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Form */}
      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Paket</CardTitle>
            <CardDescription>Update informasi paket internet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nama Paket *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-price">Harga per Bulan (Rp) *</Label>
              <Input
                id="edit-price"
                type="number"
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-download">Download (Mbps) *</Label>
                <Input
                  id="edit-download"
                  type="number"
                  value={editForm.speed_download}
                  onChange={(e) => setEditForm({ ...editForm, speed_download: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-upload">Upload (Mbps) *</Label>
                <Input
                  id="edit-upload"
                  type="number"
                  value={editForm.speed_upload}
                  onChange={(e) => setEditForm({ ...editForm, speed_upload: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Deskripsi</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={editForm.is_active}
                onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
                id="edit-active"
              />
              <Label htmlFor="edit-active">Paket Aktif</Label>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Informasi Paket</CardTitle>
            <CardDescription>Detail lengkap paket internet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nama Paket</p>
                <p className="text-lg font-semibold">{plan.name}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Harga per Bulan</p>
                <p className="text-lg font-semibold">Rp {plan.price.toLocaleString("id-ID")}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Kecepatan Download</p>
                <p className="text-lg font-semibold">{plan.speed_download} Mbps</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Kecepatan Upload</p>
                <p className="text-lg font-semibold">{plan.speed_upload} Mbps</p>
              </div>

              {plan.description && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Deskripsi</p>
                  <p className="text-base">{plan.description}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={plan.is_active ? "default" : "secondary"} className="mt-1">
                  {plan.is_active ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>

              {plan.customer_count !== undefined && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Jumlah Pelanggan</p>
                  <p className="text-lg font-semibold">{plan.customer_count} pelanggan</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ServicePlanDetailPage;
