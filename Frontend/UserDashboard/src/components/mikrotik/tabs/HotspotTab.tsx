import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, Wifi, UserPlus, Trash2, UserX, Users as UsersIcon, Edit, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mikrotikService, HotspotActiveUser } from "@/services/mikrotikService";
import { hotspotService, HotspotUser, HotspotProfile } from "@/services/mikrotik/hotspotService";
import { ipBindingService, IPBinding } from "@/services/mikrotik/ipBindingService";
import { MikrotikWebSocketData } from "@/hooks/useMikrotikWebSocket";
import AddHotspotUserDialog from "../dialogs/AddHotspotUserDialog";
import EditHotspotUserDialog from "../dialogs/EditHotspotUserDialog";
import AddHotspotProfileDialog from "../dialogs/AddHotspotProfileDialog";
import AddMACBindingDialog from "../dialogs/AddMACBindingDialog";
import DeleteConfirmDialog from "../dialogs/DeleteConfirmDialog";

interface HotspotTabProps {
  deviceId: string;
  wsData?: MikrotikWebSocketData;
}

const HotspotTab = ({ deviceId, wsData }: HotspotTabProps) => {
  const { toast } = useToast();
  const [activeUsers, setActiveUsers] = useState<HotspotActiveUser[]>([]);
  const [allUsers, setAllUsers] = useState<HotspotUser[]>([]);
  const [profiles, setProfiles] = useState<HotspotProfile[]>([]);
  const [bindings, setBindings] = useState<IPBinding[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddProfileDialog, setShowAddProfileDialog] = useState(false);
  const [showAddBindingDialog, setShowAddBindingDialog] = useState(false);
  const [editUser, setEditUser] = useState<HotspotUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<HotspotUser | null>(null);
  const [deleteProfile, setDeleteProfile] = useState<HotspotProfile | null>(null);
  const [deleteBinding, setDeleteBinding] = useState<IPBinding | null>(null);
  const [disconnectUser, setDisconnectUser] = useState<HotspotActiveUser | null>(null);

  // Initial load on mount
  useEffect(() => {
    if (deviceId) {
      loadData();
    }
  }, [deviceId]);

  // WebSocket or polling updates
  useEffect(() => {
    if (wsData && wsData.connected) {
      setActiveUsers(wsData.hotspotUsers);
      setLastUpdate(wsData.lastUpdate);
    } else if (deviceId) {
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [deviceId, wsData]);

  const loadData = async () => {
    if (!deviceId) return;

    try {
      setLoading(true);
      
      // Load data with individual error handling
      const [active, all, profs, binds] = await Promise.allSettled([
        mikrotikService.getActiveHotspotUsers(),
        hotspotService.getUsers(),
        hotspotService.getProfiles(),
        ipBindingService.getIPBindings(),
      ]);

      // Set data from successful requests
      setActiveUsers(active.status === 'fulfilled' ? active.value : []);
      setAllUsers(all.status === 'fulfilled' ? all.value : []);
      setProfiles(profs.status === 'fulfilled' ? profs.value : []);
      setBindings(binds.status === 'fulfilled' ? binds.value : []);
      
      setLastUpdate(new Date());

      // Show warning if some data failed to load
      const failedRequests = [active, all, profs, binds].filter(r => r.status === 'rejected');
      if (failedRequests.length > 0) {
        console.warn(`${failedRequests.length} request(s) failed to load`);
      }
    } catch (error: any) {
      console.error('Error loading hotspot data:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal memuat data Hotspot",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (user: HotspotUser) => {
    try {
      await hotspotService.addUser(user);
      toast({
        title: "Berhasil",
        description: `User ${user.name} berhasil ditambahkan`,
      });
      setShowAddDialog(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menambahkan user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;

    try {
      await hotspotService.deleteUser(deleteUser.name);
      toast({
        title: "Berhasil",
        description: `User ${deleteUser.name} berhasil dihapus`,
      });
      setDeleteUser(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus user",
        variant: "destructive",
      });
    }
  };

  const handleDisconnectUser = async () => {
    if (!disconnectUser) return;

    try {
      await hotspotService.disconnectUser(disconnectUser.id);
      toast({
        title: "Berhasil",
        description: `User ${disconnectUser.user} berhasil di-disconnect`,
      });
      setDisconnectUser(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal disconnect user",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = async (user: HotspotUser) => {
    try {
      await hotspotService.updateUser(user);
      toast({
        title: "Berhasil",
        description: `User ${user.name} berhasil diupdate`,
      });
      setShowEditDialog(false);
      setEditUser(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal update user",
        variant: "destructive",
      });
    }
  };

  const handleToggleUser = async (user: HotspotUser) => {
    try {
      // Toggle the disabled state: if currently disabled (true), set to false (enable)
      // if currently enabled (false), set to true (disable)
      const newDisabledState = !user.disabled;
      
      await hotspotService.toggleUser(user.name, newDisabledState);
      toast({
        title: "Berhasil",
        description: `User ${user.name} berhasil ${newDisabledState ? 'dinonaktifkan' : 'diaktifkan'}`,
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal toggle user",
        variant: "destructive",
      });
    }
  };

  const handleAddProfile = async (profile: { name: string; rate_limit?: string; session_timeout?: string; comment?: string }) => {
    try {
      await hotspotService.addProfile(profile);
      toast({
        title: "Berhasil",
        description: `Profile ${profile.name} berhasil ditambahkan`,
      });
      setShowAddProfileDialog(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menambahkan profile",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProfile = async () => {
    if (!deleteProfile) return;

    try {
      await hotspotService.deleteProfile(deleteProfile.id);
      toast({
        title: "Berhasil",
        description: `Profile ${deleteProfile.name} berhasil dihapus`,
      });
      setDeleteProfile(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus profile",
        variant: "destructive",
      });
    }
  };

  const handleAddBinding = async (binding: { mac_address: string; address: string; to_address: string; comment?: string }) => {
    try {
      await ipBindingService.addBinding(binding);
      toast({
        title: "Berhasil",
        description: `MAC binding berhasil ditambahkan`,
      });
      setShowAddBindingDialog(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menambahkan binding",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBinding = async () => {
    if (!deleteBinding) return;

    try {
      await ipBindingService.removeBinding(deleteBinding.id);
      toast({
        title: "Berhasil",
        description: `MAC binding berhasil dihapus`,
      });
      setDeleteBinding(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus binding",
        variant: "destructive",
      });
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
    if (!uptime) return "N/A";
    return uptime;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Hotspot Management</h2>
          <p className="text-sm text-muted-foreground">
            {activeUsers.length} active users • Last update: {lastUpdate.toLocaleTimeString("id-ID")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadData} disabled={loading} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Active Users ({activeUsers.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            All Users ({allUsers.length})
          </TabsTrigger>
          <TabsTrigger value="profiles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Profiles ({profiles.length})
          </TabsTrigger>
          <TabsTrigger value="bindings" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            MAC Binding ({bindings.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Users Tab */}
        <TabsContent value="active" className="space-y-4">
          {activeUsers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {activeUsers.map((user) => (
                <Card key={user.id || user.user}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Wifi className="h-5 w-5 text-orange-600" />
                        <div>
                          <CardTitle className="text-lg">{user.user}</CardTitle>
                          <CardDescription>{user.address}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-600">Online</Badge>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDisconnectUser(user)}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">MAC Address</p>
                        <p className="text-sm font-medium font-mono">{user.mac || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Uptime</p>
                        <p className="text-sm font-medium">{formatUptime(user.uptime || "")}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Download</p>
                        <p className="text-sm font-medium">{formatBytes(parseInt(user.bytes_in || "0"))}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Upload</p>
                        <p className="text-sm font-medium">{formatBytes(parseInt(user.bytes_out || "0"))}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Wifi className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Tidak ada user hotspot aktif</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* All Users Tab */}
        <TabsContent value="all" className="space-y-4">
          {allUsers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {allUsers.map((user) => (
                <Card key={user.id || user.name}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <UsersIcon className="h-5 w-5 text-blue-600" />
                          <div>
                            <h4 className="font-medium">{user.name}</h4>
                            <p className="text-sm text-muted-foreground">Profile: {user.profile}</p>
                          </div>
                        </div>
                        {user.comment && (
                          <p className="text-sm text-muted-foreground ml-8">{user.comment}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {user.disabled ? 'Disabled' : 'Enabled'}
                          </span>
                          <Switch
                            checked={!user.disabled}
                            onCheckedChange={() => handleToggleUser(user)}
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditUser(user);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteUser(user)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Belum ada user hotspot</p>
                <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Tambah User Pertama
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Profiles Tab */}
        <TabsContent value="profiles" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowAddProfileDialog(true)} size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Profile
            </Button>
          </div>
          {profiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profiles.map((profile) => (
                <Card key={profile.id || profile.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-purple-600" />
                        <div>
                          <CardTitle className="text-lg">{profile.name}</CardTitle>
                          <CardDescription>Shared Users: {profile.shared_users}</CardDescription>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteProfile(profile)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {profile.rate_limit && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Rate Limit:</span>
                          <span className="font-medium">{profile.rate_limit}</span>
                        </div>
                      )}
                      {profile.session_timeout && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Session Timeout:</span>
                          <span className="font-medium">{profile.session_timeout}</span>
                        </div>
                      )}
                      {profile.idle_timeout && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Idle Timeout:</span>
                          <span className="font-medium">{profile.idle_timeout}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Belum ada profile hotspot</p>
                <Button onClick={() => setShowAddProfileDialog(true)} className="mt-4">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Tambah Profile Pertama
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* MAC Binding Tab */}
        <TabsContent value="bindings" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              MAC Binding memungkinkan device bypass login hotspot
            </p>
            <Button onClick={() => setShowAddBindingDialog(true)} size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add MAC Binding
            </Button>
          </div>
          {bindings.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {bindings.map((binding) => (
                <Card key={binding.id || binding.mac_address}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">MAC Address</p>
                            <p className="text-sm font-medium font-mono">{binding.mac_address}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">IP Address</p>
                            <p className="text-sm font-medium">{binding.address}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Type</p>
                            <Badge variant="secondary">{binding.type || 'bypassed'}</Badge>
                          </div>
                        </div>
                        {binding.comment && (
                          <p className="text-sm text-muted-foreground mt-2">{binding.comment}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteBinding(binding)}
                        className="ml-4"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Belum ada MAC binding</p>
                <Button onClick={() => setShowAddBindingDialog(true)} className="mt-4">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Tambah MAC Binding Pertama
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddHotspotUserDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddUser}
        profiles={profiles}
      />

      <EditHotspotUserDialog
        open={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditUser(null);
        }}
        onEdit={handleEditUser}
        user={editUser}
        profiles={profiles}
      />

      <AddHotspotProfileDialog
        open={showAddProfileDialog}
        onClose={() => setShowAddProfileDialog(false)}
        onAdd={handleAddProfile}
      />

      <AddMACBindingDialog
        open={showAddBindingDialog}
        onClose={() => setShowAddBindingDialog(false)}
        onAdd={handleAddBinding}
      />

      <DeleteConfirmDialog
        open={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDeleteUser}
        title="Hapus User Hotspot"
        description={`Apakah Anda yakin ingin menghapus user "${deleteUser?.name}"? Tindakan ini tidak dapat dibatalkan.`}
      />

      <DeleteConfirmDialog
        open={!!deleteProfile}
        onClose={() => setDeleteProfile(null)}
        onConfirm={handleDeleteProfile}
        title="Hapus Profile Hotspot"
        description={`Apakah Anda yakin ingin menghapus profile "${deleteProfile?.name}"? Tindakan ini tidak dapat dibatalkan.`}
      />

      <DeleteConfirmDialog
        open={!!deleteBinding}
        onClose={() => setDeleteBinding(null)}
        onConfirm={handleDeleteBinding}
        title="Hapus MAC Binding"
        description={`Apakah Anda yakin ingin menghapus MAC binding untuk "${deleteBinding?.mac_address}"? Tindakan ini tidak dapat dibatalkan.`}
      />

      <DeleteConfirmDialog
        open={!!disconnectUser}
        onClose={() => setDisconnectUser(null)}
        onConfirm={handleDisconnectUser}
        title="Disconnect User"
        description={`Apakah Anda yakin ingin disconnect user "${disconnectUser?.user}"?`}
      />
    </div>
  );
};

export default HotspotTab;
