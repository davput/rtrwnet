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

interface AddHotspotProfileDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (profile: { name: string; rate_limit?: string; session_timeout?: string; comment?: string }) => void;
}

const AddHotspotProfileDialog = ({ open, onClose, onAdd }: AddHotspotProfileDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    rate_limit: "",
    session_timeout: "",
    comment: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAdd({
        name: formData.name,
        rate_limit: formData.rate_limit || undefined,
        session_timeout: formData.session_timeout || undefined,
        comment: formData.comment || undefined,
      });
      setFormData({
        name: "",
        rate_limit: "",
        session_timeout: "",
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
            <DialogTitle>Tambah Profile Hotspot</DialogTitle>
            <DialogDescription>
              Buat profile baru untuk mengatur bandwidth dan session
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Profile *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="5mbps"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="rate_limit">Rate Limit</Label>
              <Input
                id="rate_limit"
                value={formData.rate_limit}
                onChange={(e) => setFormData({ ...formData, rate_limit: e.target.value })}
                placeholder="5M/5M (download/upload)"
              />
              <p className="text-xs text-muted-foreground">
                Format: download/upload (contoh: 5M/5M, 10M/10M)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="session_timeout">Session Timeout</Label>
              <Input
                id="session_timeout"
                value={formData.session_timeout}
                onChange={(e) => setFormData({ ...formData, session_timeout: e.target.value })}
                placeholder="8h"
              />
              <p className="text-xs text-muted-foreground">
                Format: 0 (unlimited), 1h, 8h, 24h, dll
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Keterangan profile (opsional)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menambahkan..." : "Tambah Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddHotspotProfileDialog;
