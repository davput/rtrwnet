import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { servicePlanApi } from "./service-plan.api";
import type { CreateServicePlanRequest } from "./service-plan.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Save } from "lucide-react";

interface ServicePlanFormProps {
  planId?: string;
  mode?: 'create' | 'edit';
}

export function ServicePlanForm({ planId, mode = 'create' }: ServicePlanFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [speedDownload, setSpeedDownload] = useState("");
  const [speedUpload, setSpeedUpload] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const validateForm = () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Nama paket wajib diisi", variant: "destructive" });
      return false;
    }
    if (!price || parseInt(price) <= 0) {
      toast({ title: "Error", description: "Harga harus lebih dari 0", variant: "destructive" });
      return false;
    }
    if (!speedDownload || parseInt(speedDownload) <= 0) {
      toast({ title: "Error", description: "Kecepatan download wajib diisi", variant: "destructive" });
      return false;
    }
    if (!speedUpload || parseInt(speedUpload) <= 0) {
      toast({ title: "Error", description: "Kecepatan upload wajib diisi", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const planData: CreateServicePlanRequest = {
        name: name.trim(),
        speed_download: parseInt(speedDownload),
        speed_upload: parseInt(speedUpload),
        price: parseInt(price),
        description: description.trim() || undefined,
        is_active: isActive,
      };

      await servicePlanApi.create(planData);

      toast({
        title: "Berhasil",
        description: "Paket internet berhasil ditambahkan",
      });

      navigate("/paket-internet");
    } catch (error) {
      console.error("Error creating plan:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menambahkan paket internet",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/paket-internet")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === 'create' ? 'Tambah Paket Internet' : 'Edit Paket Internet'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === 'create' ? 'Buat paket internet baru' : 'Update paket internet'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/paket-internet")} disabled={isSubmitting}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Simpan Paket
          </Button>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Paket</CardTitle>
            <CardDescription>Data paket internet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Paket *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Paket 10 Mbps"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Harga per Bulan (Rp) *</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="300000"
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Kecepatan Internet</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="download">Download (Mbps) *</Label>
                  <Input
                    id="download"
                    type="number"
                    value={speedDownload}
                    onChange={(e) => setSpeedDownload(e.target.value)}
                    placeholder="10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upload">Upload (Mbps) *</Label>
                  <Input
                    id="upload"
                    type="number"
                    value={speedUpload}
                    onChange={(e) => setSpeedUpload(e.target.value)}
                    placeholder="5"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi Paket</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Cocok untuk streaming dan browsing"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} id="active" />
              <Label htmlFor="active">Paket Aktif</Label>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                ℹ️ Paket yang dibuat akan langsung tersedia untuk dipilih saat menambah customer baru.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ServicePlanForm;
