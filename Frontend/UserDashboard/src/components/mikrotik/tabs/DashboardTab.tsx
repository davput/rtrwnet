import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Cpu, HardDrive, Users, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mikrotikService, SystemResources, NetworkInterface } from "@/services/mikrotikService";
import { MikrotikWebSocketData } from "@/hooks/useMikrotikWebSocket";

interface DashboardTabProps {
  deviceId: string;
  wsData?: MikrotikWebSocketData;
}

const DashboardTab = ({ deviceId, wsData }: DashboardTabProps) => {
  const { toast } = useToast();
  const [systemResources, setSystemResources] = useState<SystemResources | null>(null);
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [hotspotCount, setHotspotCount] = useState(0);
  const [pppoeCount, setPppoeCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Initial load on mount
  useEffect(() => {
    if (deviceId) {
      loadData();
    }
  }, [deviceId]);

  // Use WebSocket data if available, otherwise fetch manually
  useEffect(() => {
    if (wsData && wsData.connected) {
      // Use real-time data from WebSocket
      setSystemResources(wsData.systemResources);
      setInterfaces(wsData.interfaces);
      setHotspotCount(wsData.hotspotUsers.length);
      setPppoeCount(wsData.pppoeSession.length);
      setLastUpdate(wsData.lastUpdate);
    } else if (deviceId) {
      // Fallback to polling if WebSocket not connected
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [deviceId, wsData]);

  const loadData = async () => {
    if (!deviceId) return;

    try {
      setLoading(true);
      const resources = await mikrotikService.getSystemResources();
      setSystemResources(resources);

      const [ifaces, hotspot, pppoe] = await Promise.all([
        mikrotikService.getInterfaces(),
        mikrotikService.getActiveHotspotUsers(),
        mikrotikService.getActivePPPoESessions(),
      ]);

      setInterfaces(ifaces);
      setHotspotCount(hotspot.length);
      setPppoeCount(pppoe.length);
      setLastUpdate(new Date());
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal memuat data dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatUptime = (uptime: string) => {
    return uptime || "Unknown";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">System Overview</h2>
          <p className="text-sm text-muted-foreground">
            Last update: {lastUpdate.toLocaleTimeString("id-ID")}
          </p>
        </div>
        <Button onClick={loadData} disabled={loading} size="sm" variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CPU Usage</p>
                <p className="text-2xl font-bold">
                  {systemResources?.cpu_load ? `${systemResources.cpu_load}%` : "0%"}
                </p>
              </div>
              <Cpu className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Memory</p>
                <p className="text-2xl font-bold">
                  {systemResources?.free_memory && systemResources?.total_memory
                    ? `${Math.round(((parseInt(systemResources.total_memory) - parseInt(systemResources.free_memory)) / parseInt(systemResources.total_memory)) * 100)}%`
                    : "0%"}
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hotspot Users</p>
                <p className="text-2xl font-bold">{hotspotCount}</p>
              </div>
              <Wifi className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">PPPoE Sessions</p>
                <p className="text-2xl font-bold">{pppoeCount}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      {systemResources && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Board Name</p>
                  <p className="font-medium">{systemResources.board_name || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Version</p>
                  <p className="font-medium">{systemResources.version || "Unknown"}</p>
                </div>

                <div>
                  <p className="text-muted-foreground">Uptime</p>
                  <p className="font-medium">{formatUptime(systemResources.uptime || "")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resource Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Memory Usage</span>
                  {systemResources.total_memory && systemResources.free_memory && (
                    <span className="text-sm text-muted-foreground">
                      {formatBytes(parseInt(systemResources.total_memory) - parseInt(systemResources.free_memory))} / {formatBytes(parseInt(systemResources.total_memory))}
                    </span>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: systemResources.total_memory && systemResources.free_memory
                        ? `${((parseInt(systemResources.total_memory) - parseInt(systemResources.free_memory)) / parseInt(systemResources.total_memory)) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">CPU Load</span>
                  <span className="text-sm text-muted-foreground">{systemResources.cpu_load || "0"}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${systemResources.cpu_load || 0}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Interface Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Interface Summary</CardTitle>
          <CardDescription>
            {interfaces.length} interfaces configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {interfaces.slice(0, 6).map((iface) => (
              <div key={iface.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{iface.name}</h4>
                    <p className="text-sm text-muted-foreground">{iface.type}</p>
                  </div>
                  <Badge variant={iface.running === "true" ? "default" : "secondary"}>
                    {iface.running === "true" ? "Running" : "Down"}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RX:</span>
                    <span>{formatBytes(parseInt(iface.rx_bytes || "0"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TX:</span>
                    <span>{formatBytes(parseInt(iface.tx_bytes || "0"))}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardTab;
