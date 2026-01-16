import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network, RefreshCw, Plus, Trash2, Link, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mikrotikDHCPService } from "@/services/mikrotik/dhcpService";
import { DHCPLease, ARPEntry, DHCPStats, StaticLease } from "@/types/mikrotik/dhcp";
import { Skeleton } from "@/components/ui/skeleton";

const MikrotikDHCPPage = () => {
  const { toast } = useToast();
  const [leases, setLeases] = useState<DHCPLease[]>([]);
  const [arpTable, setArpTable] = useState<ARPEntry[]>([]);
  const [stats, setStats] = useState<DHCPStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [addStaticDialogOpen, setAddStaticDialogOpen] = useState(false);
  const [staticLeaseForm, setStaticLeaseForm] = useState({
    address: "",
    mac_address: "",
    server: "dhcp1",
    comment: "",
  });

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [leasesData, arpData, statsData] = await Promise.all([
        mikrotikDHCPService.getLeases(),
        mikrotikDHCPService.getARPTable(),
        mikrotikDHCPService.getStats(),
      ]);
      setLeases(leasesData);
      setArpTable(arpData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading DHCP data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMakeStatic = async (lease: DHCPLease) => {
    try {
      const success = await mikrotikDHCPService.makeStatic(lease.id);
      if (success) {
        toast({
          title: "Berhasil",
          description: `Lease ${lease.address} dijadikan static`,
        });
        await loadData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal membuat static lease",
        variant: "destructive",
      });
    }
  };

  const handleReleaseLease = async (lease: DHCPLease) => {
    if (!confirm(`Release lease ${lease.address}?`)) return;
    
    try {
      const success = await mikrotikDHCPService.releaseLease(lease.id);
      if (success) {
        toast({
          title: "Berhasil",
          description: `Lease ${lease.address} di-release`,
        });
        await loadData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal release lease",
        variant: "destructive",
      });
    }
  };

  const handleAddStaticLease = async () => {
    if (!staticLeaseForm.address || !staticLeaseForm.mac_address) {
      toast({
        title: "Error",
        description: "IP Address dan MAC Address wajib diisi",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await mikrotikDHCPService.addStaticLease(staticLeaseForm);
      if (success) {
        toast({
          title: "Berhasil",
          description: "Static lease berhasil ditambahkan",
        });
        setAddStaticDialogOpen(false);
        setStaticLeaseForm({
          address: "",
          mac_address: "",
          server: "dhcp1",
          comment: "",
        });
        await loadData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menambahkan static lease",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      bound: "default",
      waiting: "secondary",
      offered: "outline",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {status}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Network className="h-6 w-6" />
              DHCP Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Kelola DHCP leases dan static bindings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={loadData} disabled={loading} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => setAddStaticDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Static Lease
            </Button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Leases</p>
                    <p className="text-2xl font-bold">{stats.total_leases}</p>
                  </div>
                  <Network className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active_leases}</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Static</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.static_leases}</p>
                  </div>
                  <Link className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Expired</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.expired_leases}</p>
                  </div>
                  <Network className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Available IPs</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.available_ips}</p>
                  </div>
                  <Network className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="leases" className="space-y-4">
          <TabsList>
            <TabsTrigger value="leases">DHCP Leases</TabsTrigger>
            <TabsTrigger value="arp">ARP Table</TabsTrigger>
          </TabsList>

          {/* DHCP Leases Tab */}
          <TabsContent value="leases" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>DHCP Leases</CardTitle>
                <CardDescription>
                  {leases.length} leases ditemukan
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
                        <TableHead>IP Address</TableHead>
                        <TableHead>MAC Address</TableHead>
                        <TableHead>Hostname</TableHead>
                        <TableHead>Server</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leases.map((lease) => (
                        <TableRow key={lease.id}>
                          <TableCell className="font-mono">{lease.address}</TableCell>
                          <TableCell className="font-mono text-sm">{lease.mac_address}</TableCell>
                          <TableCell>{lease.hostname || "-"}</TableCell>
                          <TableCell>{lease.server}</TableCell>
                          <TableCell>{getStatusBadge(lease.status)}</TableCell>
                          <TableCell className="text-sm">
                            {lease.expires_after || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {!lease.dynamic && (
                                <Badge variant="outline" className="text-xs">
                                  Static
                                </Badge>
                              )}
                              {lease.dynamic && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMakeStatic(lease)}
                                    title="Make Static"
                                  >
                                    <Link className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleReleaseLease(lease)}
                                    title="Release"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ARP Table Tab */}
          <TabsContent value="arp" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>ARP Table</CardTitle>
                <CardDescription>
                  {arpTable.length} entries ditemukan
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
                        <TableHead>IP Address</TableHead>
                        <TableHead>MAC Address</TableHead>
                        <TableHead>Interface</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Comment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {arpTable.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-mono">{entry.address}</TableCell>
                          <TableCell className="font-mono text-sm">{entry.mac_address}</TableCell>
                          <TableCell>{entry.interface}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {entry.complete && <Badge variant="default" className="text-xs">Complete</Badge>}
                              {entry.dynamic && <Badge variant="outline" className="text-xs">Dynamic</Badge>}
                              {entry.dhcp && <Badge variant="secondary" className="text-xs">DHCP</Badge>}
                              {entry.invalid && <Badge variant="destructive" className="text-xs">Invalid</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{entry.comment || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Static Lease Dialog */}
        <Dialog open={addStaticDialogOpen} onOpenChange={setAddStaticDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Static Lease</DialogTitle>
              <DialogDescription>
                Bind IP address ke MAC address secara permanen
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="address">IP Address *</Label>
                <Input
                  id="address"
                  placeholder="192.168.1.100"
                  value={staticLeaseForm.address}
                  onChange={(e) =>
                    setStaticLeaseForm({ ...staticLeaseForm, address: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mac_address">MAC Address *</Label>
                <Input
                  id="mac_address"
                  placeholder="00:11:22:33:44:55"
                  value={staticLeaseForm.mac_address}
                  onChange={(e) =>
                    setStaticLeaseForm({ ...staticLeaseForm, mac_address: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="server">DHCP Server</Label>
                <Input
                  id="server"
                  placeholder="dhcp1"
                  value={staticLeaseForm.server}
                  onChange={(e) =>
                    setStaticLeaseForm({ ...staticLeaseForm, server: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="comment">Comment</Label>
                <Input
                  id="comment"
                  placeholder="Server / Printer / etc"
                  value={staticLeaseForm.comment}
                  onChange={(e) =>
                    setStaticLeaseForm({ ...staticLeaseForm, comment: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddStaticDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddStaticLease}>
                Add Static Lease
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default MikrotikDHCPPage;
