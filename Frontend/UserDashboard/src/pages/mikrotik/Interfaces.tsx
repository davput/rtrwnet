import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Network, Activity, TrendingUp, TrendingDown, RefreshCw, Power } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mikrotikInterfaceService } from "@/services/mikrotik/interfaceService";
import { MikrotikInterface, InterfaceStats } from "@/types/mikrotik/interface";
import { Skeleton } from "@/components/ui/skeleton";

const formatBytes = (bytes: string | number) => {
  const b = typeof bytes === 'string' ? parseInt(bytes) : bytes;
  if (b === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return Math.round((b / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const MikrotikInterfacesPage = () => {
  const { toast } = useToast();
  const [interfaces, setInterfaces] = useState<MikrotikInterface[]>([]);
  const [stats, setStats] = useState<InterfaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [interfacesData, statsData] = await Promise.all([
        mikrotikInterfaceService.getAll(),
        mikrotikInterfaceService.getStats(),
      ]);
      setInterfaces(interfacesData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading interfaces:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (iface: MikrotikInterface) => {
    setToggling(iface.name);
    try {
      const success = iface.disabled
        ? await mikrotikInterfaceService.enable(iface.name)
        : await mikrotikInterfaceService.disable(iface.name);

      if (success) {
        toast({
          title: "Berhasil",
          description: `Interface ${iface.name} ${iface.disabled ? 'enabled' : 'disabled'}`,
        });
        await loadData();
      } else {
        throw new Error('Failed to toggle interface');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengubah status interface",
        variant: "destructive",
      });
    } finally {
      setToggling(null);
    }
  };

  const handleResetCounters = async (name: string) => {
    try {
      const success = await mikrotikInterfaceService.resetCounters(name);
      if (success) {
        toast({
          title: "Berhasil",
          description: `Counter ${name} direset`,
        });
        await loadData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal reset counter",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Network className="h-6 w-6" />
              Interface Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor dan kelola network interfaces
            </p>
          </div>
          <Button onClick={loadData} disabled={loading} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Interfaces</p>
                    <p className="text-2xl font-bold">{stats.total_interfaces}</p>
                  </div>
                  <Network className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Running</p>
                    <p className="text-2xl font-bold text-green-600">{stats.running_interfaces}</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total RX</p>
                    <p className="text-2xl font-bold">{formatBytes(stats.total_rx_bytes)}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total TX</p>
                    <p className="text-2xl font-bold">{formatBytes(stats.total_tx_bytes)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Interface List */}
        <Card>
          <CardHeader>
            <CardTitle>Network Interfaces</CardTitle>
            <CardDescription>
              {interfaces.length} interfaces ditemukan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Interface</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>RX</TableHead>
                    <TableHead>TX</TableHead>
                    <TableHead>Speed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interfaces.map((iface) => (
                    <TableRow key={iface.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{iface.name}</div>
                          {iface.comment && (
                            <div className="text-sm text-muted-foreground">{iface.comment}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{iface.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {iface.running && !iface.disabled ? (
                            <Badge variant="default" className="gap-1">
                              <Activity className="h-3 w-3" />
                              Running
                            </Badge>
                          ) : iface.disabled ? (
                            <Badge variant="secondary">Disabled</Badge>
                          ) : (
                            <Badge variant="destructive">Down</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatBytes(iface.rx_bytes)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatBytes(iface.tx_bytes)}
                      </TableCell>
                      <TableCell>
                        {iface.link_speed || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={!iface.disabled}
                            onCheckedChange={() => handleToggle(iface)}
                            disabled={toggling === iface.name}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleResetCounters(iface.name)}
                            title="Reset Counters"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MikrotikInterfacesPage;
