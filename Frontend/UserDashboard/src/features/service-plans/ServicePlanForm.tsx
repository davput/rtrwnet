import { useState } from "react";
import { servicePlanApi } from "./service-plan.api";
import type { CreateServicePlanRequest } from "./service-plan.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ServicePlanFormProps {
  onSuccess?: () => void;
}

export function ServicePlanForm({ onSuccess }: ServicePlanFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [speedDownload, setSpeedDownload] = useState("");
  const [speedUpload, setSpeedUpload] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = async () => {
    if (!name.trim() || !price || !speedDownload || !speedUpload) {
      toast({ title: "Error", description: "Semua field wajib diisi", variant: "destructive" });
      return;
    }

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
      toast({ title: "Berhasil", description: "Paket berhasil ditambahkan" });
      onSuccess?.();
    } catch (error) {
      toast({ title: "Error", description: "Gagal menambahkan paket", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nama Paket *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Paket 10 Mbps" />
      </div>

      <div className="space-y-2">
        <Label>Harga/Bulan (Rp) *</Label>
        <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="300000" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Download (Mbps) *</Label>
          <Input type="number" value={speedDownload} onChange={(e) => setSpeedDownload(e.target.value)} placeholder="10" />
        </div>
        <div className="space-y-2">
          <Label>Upload (Mbps) *</Label>
          <Input type="number" value={speedUpload} onChange={(e) => setSpeedUpload(e.target.value)} placeholder="5" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Deskripsi</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Cocok untuk streaming" rows={2} />
      </div>

      <div className="flex items-center space-x-2">
        <Switch checked={isActive} onCheckedChange={setIsActive} id="active" />
        <Label htmlFor="active">Paket Aktif</Label>
      </div>

      <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Simpan
      </Button>
    </div>
  );
}

export default ServicePlanForm;
