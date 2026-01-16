import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { NetworkNode, NodeType, NodeStatus } from "@/types/networkTopology";
import { getDeviceDefaults } from "@/utils/deviceDefaults";

interface AddNodeDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (node: Partial<NetworkNode>) => void;
  nodes: NetworkNode[];
  initialType?: string;
  initialPosition?: { x: number; y: number };
}

const AddNodeDialog = ({ 
  open, 
  onClose, 
  onAdd, 
  nodes,
  initialType,
  initialPosition 
}: AddNodeDialogProps) => {
  // Get defaults based on initial type
  const getInitialFormData = () => {
    const type = (initialType as NodeType) || "router";
    const defaults = getDeviceDefaults(type, nodes);
    
    return {
      name: defaults.name || "",
      type: type,
      status: "online" as NodeStatus,
      ip_address: defaults.ip_address || "",
      mac_address: defaults.mac_address || "",
      model: defaults.model || "",
      location: defaults.location || "",
      notes: defaults.notes || "",
      parent_id: "",
      level: 0,
      position_x: initialPosition?.x || 400,
      position_y: initialPosition?.y || 300,
      latitude: "",
      longitude: "",
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const nodeData: Partial<NetworkNode> = {
      name: formData.name,
      type: formData.type,
      status: formData.status,
      ip_address: formData.ip_address || undefined,
      mac_address: formData.mac_address || undefined,
      model: formData.model || undefined,
      location: formData.location || undefined,
      notes: formData.notes || undefined,
      parent_id: (formData.parent_id && formData.parent_id !== "none") ? formData.parent_id : undefined,
      level: formData.level,
      position_x: formData.position_x,
      position_y: formData.position_y,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
    };

    onAdd(nodeData);
    handleClose();
  };

  const handleClose = () => {
    setFormData(getInitialFormData());
    onClose();
  };

  // Update form when dialog opens with new initial values
  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData());
    }
  }, [open, initialType, initialPosition]);

  // Handle device type change - auto-fill dengan defaults baru
  const handleTypeChange = (newType: NodeType) => {
    const defaults = getDeviceDefaults(newType, nodes);
    setFormData(prev => ({
      ...prev,
      type: newType,
      name: defaults.name || prev.name,
      ip_address: defaults.ip_address || prev.ip_address,
      mac_address: defaults.mac_address || prev.mac_address,
      model: defaults.model || prev.model,
      location: defaults.location || prev.location,
      notes: defaults.notes || prev.notes,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Device Baru</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Device *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Core Router 1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipe Device *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleTypeChange(value as NodeType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="router">Router</SelectItem>
                  <SelectItem value="switch">Switch</SelectItem>
                  <SelectItem value="olt">OLT</SelectItem>
                  <SelectItem value="ont">ONT</SelectItem>
                  <SelectItem value="ap">Access Point</SelectItem>
                  <SelectItem value="repeater">Repeater</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Detail otomatis ter-isi, edit jika perlu
              </p>
            </div>
          </div>

          {/* Network Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ip_address">IP Address</Label>
              <Input
                id="ip_address"
                value={formData.ip_address}
                onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                placeholder="e.g., 192.168.1.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mac_address">MAC Address</Label>
              <Input
                id="mac_address"
                value={formData.mac_address}
                onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })}
                placeholder="e.g., AA:BB:CC:DD:EE:FF"
              />
            </div>
          </div>

          {/* Status & Model */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as NodeStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="e.g., MikroTik RB4011"
              />
            </div>
          </div>

          {/* Hierarchy */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parent_id">Parent Device (Optional)</Label>
              <Select
                value={formData.parent_id || "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    setFormData({ 
                      ...formData, 
                      parent_id: "",
                      level: 0
                    });
                  } else {
                    const parent = nodes.find(n => n.id === value);
                    setFormData({ 
                      ...formData, 
                      parent_id: value,
                      level: parent ? parent.level + 1 : 0
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih parent (kosongkan jika root)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Root Device)</SelectItem>
                  {nodes.map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.name} (Level {node.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Input
                id="level"
                type="number"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 0 })}
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                Auto-set jika parent dipilih
              </p>
            </div>
          </div>

          {/* Position */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position_x">Position X</Label>
              <Input
                id="position_x"
                type="number"
                value={formData.position_x}
                onChange={(e) => setFormData({ ...formData, position_x: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position_y">Position Y</Label>
              <Input
                id="position_y"
                type="number"
                value={formData.position_y}
                onChange={(e) => setFormData({ ...formData, position_y: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Geographical Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude (Optional)</Label>
              <Input
                id="latitude"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="e.g., -6.2088"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude (Optional)</Label>
              <Input
                id="longitude"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="e.g., 106.8456"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Lokasi Fisik</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Gedung A Lantai 3"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Catatan tambahan tentang device ini..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Batal
            </Button>
            <Button type="submit">
              Tambah Device
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddNodeDialog;
