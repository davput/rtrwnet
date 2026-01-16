import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Server, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mikrotikService } from "@/services/mikrotikService";
import { DHCPServer, DHCPLease } from "@/types/mikrotik/dhcp";
import { MikrotikWebSocketData } from "@/hooks/useMikrotikWebSocket";

interface DHCPTabProps {
  deviceId: string;
  wsData?: MikrotikWebSocketData;
}

const DHCPTab = ({ deviceId, wsData }: DHCPTabProps) => {
  const { toast } = useToast();
  const [servers, setServers] = useState<DHCPServer[]>([]);
  const [leases, setLeases] = useState<DHCPLease[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Initial load on mount
  useEffect(() => {
    if (deviceId) {
      loadData();
    }
  }, [deviceId]);

  // WebSocket or polling updates
  useEffect(() => {
    if (wsData && wsData.connected) {
      setServers(wsData.dhcpServers);
      setLeases(wsData.dhcpLeases);
      setLastUpdate(wsData.lastUpdate);
    } else if (deviceId) {
      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }
  }, [deviceId, wsData]);

  const loadData = async () => {
    if (!deviceId) return;
    
    try {
      setLoading(true);
      const [serversData, leasesData] = await Promise.all([
        mikrotikService.getDHCPServers(),
        mikrotikService.getDHCPLeases(),
      ]);
      setServers(serversData);
      setLeases(leasesData);
      setLastUpdate(new Date());
    } catch (error: any) {
      console.error('Error loading DHCP data:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal memuat data DHCP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLeasesByServer = (serverName: string) => {
    return leases.filter(lease => lease.server === serverName);
  };

  const formatDuration = (duration: string) => {
    if (!duration) return "N/A";
    return duration;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">DHCP Servers & Leases</h2>
          <p className="text-sm text-muted-foreground">
            {servers.length} servers • {leases.length} active leases • Last update: {lastUpdate.toLocaleTimeString("id-ID")}
          </p>
        </div>
        <Button onClick={loadData} disabled={loading} size="sm" variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* DHCP Servers */}
      <div className="space-y-4">
        {servers.map((server) => {
          const serverLeases = getLeasesByServer(server.name);
          const boundLeases = serverLeases.filter(l => l.status === "bound");
          
          return (
            <Card key={server.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Server className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{server.name}</CardTitle>
                      <CardDescription>
                        Interface: {server.interface} • Address Pool: {server.address_pool || "N/A"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {server.disabled ? (
                      <Badge variant="secondary">Disabled</Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-600">Active</Badge>
                    )}
                    <Badge variant="outline">
                      <Users className="h-3 w-3 mr-1" />
                      {boundLeases.length} leases
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Server Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Lease Time</p>
                    <p className="text-sm font-medium">{server.lease_time || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Authoritative</p>
                    <p className="text-sm font-medium">{server.authoritative || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Bootp Support</p>
                    <p className="text-sm font-medium">{server.bootp_support || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Disabled</p>
                    <p className="text-sm font-medium">{server.disabled ? "Yes" : "No"}</p>
                  </div>
                </div>

                {/* Active Leases */}
                {serverLeases.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-3">Active Leases</h4>
                    <div className="space-y-2">
                      {serverLeases.map((lease, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium">{lease.address}</p>
                              <Badge variant={lease.status === "bound" ? "default" : "secondary"} className="text-xs">
                                {lease.status}
                              </Badge>
                              {lease.dynamic && (
                                <Badge variant="outline" className="text-xs">Dynamic</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>MAC: {lease.mac_address}</span>
                              {lease.hostname && <span>Host: {lease.hostname}</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Expires in</p>
                            <p className="text-sm font-medium">{formatDuration(lease.expires_after || "")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {serverLeases.length === 0 && (
                  <div className="mt-4 pt-4 border-t text-center py-4">
                    <p className="text-sm text-muted-foreground">Tidak ada lease aktif</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {servers.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Tidak ada DHCP server ditemukan</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DHCPTab;
