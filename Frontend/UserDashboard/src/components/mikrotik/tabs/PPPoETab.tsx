import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Users, Plus, Trash2, Power, User, Shield, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { pppoeService } from "@/services/mikrotik/pppoeService";
import { MikrotikWebSocketData } from "@/hooks/useMikrotikWebSocket";
import type { PPPoESecret, PPPoEActiveSession, PPPoEProfile } from "@/types/mikrotik/pppoe";

interface PPPoETabProps {
  deviceId: string;
  wsData?: MikrotikWebSocketData;
}

const PPPoETab = ({ deviceId, wsData }: PPPoETabProps) => {
  const { toast } = useToast();
  const [secrets, setSecrets] = useState<PPPoESecret[]>([]);
  const [sessions, setSessions] = useState<PPPoEActiveSession[]>([]);
  const [profiles, setProfiles] = useState<PPPoEProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    service: 'pppoe',
    profile: 'default',
    comment: '',
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // WebSocket updates
  useEffect(() => {
    if (wsData?.connected) {
      setSessions(wsData.pppoeSession || []);
      setLastUpdate(wsData.lastUpdate);
    }
  }, [wsData?.pppoeSession, wsData?.connected, wsData?.lastUpdate]);

  // Initial load
  useEffect(() => {
    if (deviceId) {
      loadData();
    }
  }, [deviceId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [secretsData, activeData, profilesData] = await Promise.all([
        pppoeService.getSecrets(),
        pppoeService.getActiveSessions(),
        pppoeService.getProfiles(),
      ]);
      setSecrets(secretsData);
      setSessions(activeData);
      setProfiles(profilesData);
      setLastUpdate(new Date());
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load PPPoE data';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSecret = async () => {
    if (!formData.name || !formData.password) {
      setError('Username dan password harus diisi');
      return;
    }

    try {
      await pppoeService.addSecret(formData);
      setShowAddDialog(false);
      setFormData({ name: '', password: '', service: 'pppoe', profile: 'default', comment: '' });
      toast({
        title: "Berhasil",
        description: "PPPoE user berhasil ditambahkan",
      });
      await loadData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add PPPoE secret';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const handleDeleteSecret = async (name: string) => {
    if (!confirm(`Yakin ingin menghapus PPPoE user "${name}"?`)) return;

    try {
      await pppoeService.deleteSecret(name);
      toast({
        title: "Berhasil",
        description: "PPPoE user berhasil dihapus",
      });
      await loadData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete PPPoE secret';
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async (sessionId: string, username: string) => {
    if (!confirm(`Yakin ingin disconnect session "${username}"?`)) return;

    try {
      await pppoeService.disconnectSession(sessionId);
      toast({
        title: "Berhasil",
        description: "Session berhasil diputus",
      });
      await loadData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to disconnect session';
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  if (loading && secrets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            Last update: {lastUpdate.toLocaleTimeString("id-ID")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Tambah User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{secrets.length}</div>
            <p className="text-xs text-muted-foreground">PPPoE secrets terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-muted-foreground">Sedang terkoneksi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profiles</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles.length}</div>
            <p className="text-xs text-muted-foreground">Profile tersedia</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="secrets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="secrets">PPPoE Secrets ({secrets.length})</TabsTrigger>
          <TabsTrigger value="active">Active Sessions ({sessions.length})</TabsTrigger>
          <TabsTrigger value="profiles">Profiles ({profiles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="secrets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>PPPoE Secrets</CardTitle>
              <CardDescription>Daftar username dan password PPPoE</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Username</th>
                      <th className="text-left p-2">Service</th>
                      <th className="text-left p-2">Profile</th>
                      <th className="text-left p-2">Local Address</th>
                      <th className="text-left p-2">Remote Address</th>
                      <th className="text-left p-2">Comment</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {secrets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-4 text-muted-foreground">
                          Tidak ada PPPoE secrets
                        </td>
                      </tr>
                    ) : (
                      secrets.map((secret, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">{secret.name}</td>
                          <td className="p-2">{secret.service}</td>
                          <td className="p-2">{secret.profile}</td>
                          <td className="p-2">{secret.local_address || '-'}</td>
                          <td className="p-2">{secret.remote_address || '-'}</td>
                          <td className="p-2">{secret.comment || '-'}</td>
                          <td className="p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSecret(secret.name)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Sesi PPPoE yang sedang aktif</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Username</th>
                      <th className="text-left p-2">IP Address</th>
                      <th className="text-left p-2">MAC Address</th>
                      <th className="text-left p-2">Uptime</th>
                      <th className="text-left p-2">Service</th>
                      <th className="text-left p-2">Encoding</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-4 text-muted-foreground">
                          Tidak ada sesi aktif
                        </td>
                      </tr>
                    ) : (
                      sessions.map((session, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">{session.name}</td>
                          <td className="p-2">{session.address}</td>
                          <td className="p-2 font-mono text-sm">{session.caller_id}</td>
                          <td className="p-2">{session.uptime}</td>
                          <td className="p-2">{session.service}</td>
                          <td className="p-2">{session.encoding || '-'}</td>
                          <td className="p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDisconnect(session.session_id, session.name)}
                            >
                              <Power className="h-4 w-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profiles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>PPPoE Profiles</CardTitle>
              <CardDescription>Daftar profile PPPoE yang tersedia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Local Address</th>
                      <th className="text-left p-2">Remote Address</th>
                      <th className="text-left p-2">Rate Limit</th>
                      <th className="text-left p-2">Session Timeout</th>
                      <th className="text-left p-2">Idle Timeout</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-4 text-muted-foreground">
                          Tidak ada profiles
                        </td>
                      </tr>
                    ) : (
                      profiles.map((profile, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">{profile.name}</td>
                          <td className="p-2">{profile.local_address || '-'}</td>
                          <td className="p-2">{profile.remote_address || '-'}</td>
                          <td className="p-2">{profile.rate_limit || '-'}</td>
                          <td className="p-2">{profile.session_timeout || '0'}</td>
                          <td className="p-2">{profile.idle_timeout || '0'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Secret Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah PPPoE User</DialogTitle>
            <DialogDescription>Buat username dan password baru untuk PPPoE</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Username *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="pppoe001"
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div>
              <Label htmlFor="service">Service</Label>
              <Select value={formData.service} onValueChange={(value) => setFormData({ ...formData, service: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pppoe">PPPoE</SelectItem>
                  <SelectItem value="pptp">PPTP</SelectItem>
                  <SelectItem value="l2tp">L2TP</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="profile">Profile</Label>
              <Select value={formData.profile} onValueChange={(value) => setFormData({ ...formData, profile: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {profiles.length > 0 ? (
                    profiles.map((profile) => (
                      <SelectItem key={profile.name} value={profile.name}>
                        {profile.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="default">default</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="comment">Comment</Label>
              <Input
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Pelanggan A"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleAddSecret}>Tambah</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PPPoETab;
