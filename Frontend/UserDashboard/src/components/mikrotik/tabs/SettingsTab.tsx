import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Save, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsTabProps {
  deviceId: string;
}

const SettingsTab = ({ deviceId }: SettingsTabProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  // Settings state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [enableWebSocket, setEnableWebSocket] = useState(true);
  const [showNotifications, setShowNotifications] = useState(true);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save settings to localStorage
      const settings = {
        autoRefresh,
        refreshInterval,
        enableWebSocket,
        showNotifications,
      };
      
      localStorage.setItem(`mikrotik_settings_${deviceId}`, JSON.stringify(settings));
      
      toast({
        title: "Berhasil",
        description: "Pengaturan berhasil disimpan",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan pengaturan",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setAutoRefresh(true);
    setRefreshInterval(5);
    setEnableWebSocket(true);
    setShowNotifications(true);
    
    toast({
      title: "Reset",
      description: "Pengaturan dikembalikan ke default",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Konfigurasi pengaturan monitoring MikroTik
          </p>
        </div>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Pengaturan umum untuk monitoring router
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto Refresh */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-refresh">Auto Refresh</Label>
              <p className="text-sm text-muted-foreground">
                Otomatis refresh data secara berkala
              </p>
            </div>
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
          </div>

          {/* Refresh Interval */}
          {autoRefresh && (
            <div className="space-y-2">
              <Label htmlFor="refresh-interval">Refresh Interval (detik)</Label>
              <Input
                id="refresh-interval"
                type="number"
                min="1"
                max="60"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 5)}
                className="max-w-xs"
              />
              <p className="text-sm text-muted-foreground">
                Interval waktu untuk refresh data (1-60 detik)
              </p>
            </div>
          )}

          {/* WebSocket */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-websocket">Enable WebSocket</Label>
              <p className="text-sm text-muted-foreground">
                Gunakan WebSocket untuk real-time updates
              </p>
            </div>
            <Switch
              id="enable-websocket"
              checked={enableWebSocket}
              onCheckedChange={setEnableWebSocket}
            />
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-notifications">Show Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Tampilkan notifikasi untuk event penting
              </p>
            </div>
            <Switch
              id="show-notifications"
              checked={showNotifications}
              onCheckedChange={setShowNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Connection Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Settings</CardTitle>
          <CardDescription>
            Pengaturan koneksi ke router MikroTik
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Device ID</Label>
            <Input value={deviceId} disabled className="max-w-md" />
          </div>
          
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Untuk mengubah kredensial router, silakan edit di halaman Device Management.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
        <Button onClick={handleReset} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset ke Default
        </Button>
      </div>
    </div>
  );
};

export default SettingsTab;
