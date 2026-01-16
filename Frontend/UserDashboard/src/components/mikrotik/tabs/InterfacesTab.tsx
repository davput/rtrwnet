import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Network } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mikrotikService, NetworkInterface } from "@/services/mikrotikService";
import { MikrotikWebSocketData } from "@/hooks/useMikrotikWebSocket";

interface InterfacesTabProps {
  deviceId: string;
  wsData?: MikrotikWebSocketData;
}

const InterfacesTab = ({ deviceId, wsData }: InterfacesTabProps) => {
  const { toast } = useToast();
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Initial load on mount
  useEffect(() => {
    if (deviceId) {
      loadInterfaces();
    }
  }, [deviceId]);

  // WebSocket or polling updates
  useEffect(() => {
    if (wsData && wsData.connected) {
      setInterfaces(wsData.interfaces);
      setLastUpdate(wsData.lastUpdate);
    } else if (deviceId) {
      const interval = setInterval(loadInterfaces, 5000);
      return () => clearInterval(interval);
    }
  }, [deviceId, wsData]);

  const loadInterfaces = async () => {
    if (!deviceId) return;
    
    try {
      setLoading(true);
      const data = await mikrotikService.getInterfaces();
      setInterfaces(data);
      setLastUpdate(new Date());
    } catch (error: any) {
      console.error('Error loading interfaces:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal memuat data interface",
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

  const formatRate = (rate: string) => {
    if (!rate || rate === "0") return "0 bps";
    const num = parseInt(rate);
    if (num < 1000) return `${num} bps`;
    if (num < 1000000) return `${(num / 1000).toFixed(1)} Kbps`;
    if (num < 1000000000) return `${(num / 1000000).toFixed(1)} Mbps`;
    return `${(num / 1000000000).toFixed(1)} Gbps`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Network Interfaces</h2>
          <p className="text-sm text-muted-foreground">
            {interfaces.length} interfaces • Last update: {lastUpdate.toLocaleTimeString("id-ID")}
          </p>
        </div>
        <Button onClick={loadInterfaces} disabled={loading} size="sm" variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Interfaces Grid */}
      <div className="grid grid-cols-1 gap-4">
        {interfaces.map((iface) => (
          <Card key={iface.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Network className="h-5 w-5 text-blue-600" />
                  <div>
                    <CardTitle className="text-lg">{iface.name}</CardTitle>
                    <CardDescription>{iface.type}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {iface.running === "true" && (
                    <Badge variant="default" className="bg-green-600">Running</Badge>
                  )}
                  {iface.running !== "true" && (
                    <Badge variant="destructive">Down</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Type</p>
                  <p className="text-sm font-medium">{iface.type || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Running</p>
                  <p className="text-sm font-medium">{iface.running === "true" ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">RX Bytes</p>
                  <p className="text-sm font-medium text-green-600">
                    {formatBytes(parseInt(iface.rx_bytes || "0"))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">TX Bytes</p>
                  <p className="text-sm font-medium text-blue-600">
                    {formatBytes(parseInt(iface.tx_bytes || "0"))}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">RX Packets</p>
                    <p className="text-sm font-medium">
                      {parseInt(iface.rx_packet || "0").toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">TX Packets</p>
                    <p className="text-sm font-medium">
                      {parseInt(iface.tx_packet || "0").toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {interfaces.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Tidak ada interface ditemukan</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InterfacesTab;
