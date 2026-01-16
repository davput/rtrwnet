import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HotspotUser } from "@/services/mikrotik/hotspotService";

interface EditHotspotUserDialogProps {
  open: boolean;
  onClose: () => void;
  onEdit: (user: HotspotUser) => void;
  user: HotspotUser | null;
  profiles?: { id: string; name: string }[];
}

const EditHotspotUserDialog = ({ open, onClose, onEdit, user, profiles: propProfiles }: EditHotspotUserDialogProps) => {
  const [formData, setFormData] = useState<HotspotUser>({
    name: "",
    password: "",
    profile: "default",
    comment: "",
  });
  const [loading, setLoading] = useState(false);

  const profiles = propProfiles?.map(p => p.name) || ["default"];

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        password: "",
        profile: user.profile,
        comment: user.comment || "",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onEdit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit User Hotspot</DialogTitle>
            <DialogDescription>
              Update informasi user hotspot
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Username</Label>
              <Input
                id="name"
                value={formData.name}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Username tidak dapat diubah</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password Baru</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Kosongkan jika tidak ingin mengubah"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="profile">Profile</Label>
              <Select
                value={formData.profile}
                onValueChange={(value) => setFormData({ ...formData, profile: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile} value={profile}>
                      {profile}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Keterangan user (opsional)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditHotspotUserDialog;
