import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AddMACBindingDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (binding: { mac_address: string; address: string; to_address: string; comment?: string }) => void;
}

const AddMACBindingDialog = ({ open, onClose, onAdd }: AddMACBindingDialogProps) => {
  const [formData, setFormData] = useState({
    mac_address: "",
    address: "",
    to_address: "",
    comment: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAdd({
        mac_address: formData.mac_address,
        address: formData.address,
        to_address: formData.to_address || formData.address,
        comment: formData.comment || undefined,
      });
      setFormData({
        mac_address: "",
        address: "",
        to_address: "",
        comment: "",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tambah MAC Binding</DialogTitle>
            <DialogDescription>
              Bypass hotspot login untuk MAC address tertentu
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="mac_address">MAC Address *</Label>
              <Input
                id="mac_address"
                value={formData.mac_address}
                onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })}
                placeholder="00:11:22:33:44:55"
                required
              />
              <p className="text-xs text-muted-foreground">
                Format: XX:XX:XX:XX:XX:XX
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">IP Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="192.168.1.100"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="to_address">To Address</Label>
              <Input
                id="to_address"
                value={formData.to_address}
                onChange={(e) => setFormData({ ...formData, to_address: e.target.value })}
                placeholder="Kosongkan untuk sama dengan IP Address"
              />
              <p className="text-xs text-muted-foreground">
                Opsional - default sama dengan IP Address
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Keterangan (opsional)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menambahkan..." : "Tambah Binding"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMACBindingDialog;
