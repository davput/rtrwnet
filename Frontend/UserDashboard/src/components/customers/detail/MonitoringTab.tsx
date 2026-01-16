import { useState, useEffect, useCallback } from "react";
import type { Customer } from "@/features/customers/customer.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  Clock,
  Download,
  Upload,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Loader2
} from "lucide-react";
import { apiClient } from "@/services/api/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MonitoringTabProps {
  customer: Customer;
  onDataChange?: () => void;
}

interface RadiusSession {
  id: string;
  username: string;
  acct_session_id: string;
  nas_ip_address: string;
  framed_ip_address: string;
  acct_start_time: string;
  acct_stop_time?: string;
  acct_session_time: number;
  acct_input_octets: number;
  acct_output_octets: number;
  acct_terminate_cause?: string;
  radius_user?: {
    id: string;
    customer_id?: string;
    username: string;
  };
}

interface ActiveSession {
  username: string;
  session_id: string;
  nas_ip_address: string;
  framed_ip: string;
  start_time: string;
  input_octets: number;
  output_octets: number;
  customer_id: string;
  tenant_id: string;
}

export function CustomerMonitoringTab({ customer }: MonitoringTabProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState<RadiusSession[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const fetchMonitoringData = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch active sessions to check if customer is online
      const activeRes = await apiClient.get('/radius/sessions/active');
      const activeSessions: RadiusSession[] = activeRes.data.data?.sessions || activeRes.data.sessions || [];
      
      // Find active session for this customer by customer_id or username
      const customerSession = activeSessions.find(
        s => s.radius_user?.customer_id === customer.id || s.username === customer.pppoe_username
      );
      
      if (customerSession) {
        setActiveSession({
          username: customerSession.username,
          session_id: customerSession.acct_session_id,
          nas_ip_address: customerSession.nas_ip_address,
          framed_ip: customerSession.framed_ip_address,
          start_time: customerSession.acct_start_time,
          input_octets: customerSession.acct_input_octets,
          output_octets: customerSession.acct_output_octets,
          customer_id: customerSession.radius_user?.customer_id || customer.id,
          tenant_id: '',
        });
      } else {
        setActiveSession(null);
      }

      // Also set sessions from active response if no history yet
      if (activeSessions.length > 0 && sessions.length === 0) {
        const customerSessions = activeSessions.filter(
          s => s.radius_user?.customer_id === customer.id || s.username === customer.pppoe_username
        );
        if (customerSessions.length > 0) {
          setSessions(customerSessions);
        }
      }

      // Fetch session history - try by username if available
      if (customer.pppoe_username) {
        try {
          // Get RADIUS user by username first
          const usersRes = await apiClient.get('/radius/users', {
            params: { username: customer.pppoe_username }
          });
          const users = usersRes.data.users || [];
          const radiusUser = users.find((u: { username: string }) => u.username === customer.pppoe_username);
          
          if (radiusUser?.id) {
            const sessionsRes = await apiClient.get(`/radius/users/${radiusUser.id}/sessions`);
            setSessions(sessionsRes.data.sessions || []);
          }
        } catch {
          // Fallback: sessions might not be available
          console.log('Could not fetch session history');
        }
      }

    } catch (err: unknown) {
      console.error('Failed to fetch monitoring data:', err);
      setError('Gagal memuat data monitoring');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customer.id, customer.pppoe_username]);

  useEffect(() => {
    fetchMonitoringData();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, [fetchMonitoringData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMonitoringData();
  };

  // Calculate session duration for active session
  const getSessionDuration = (): number => {
    if (!activeSession?.start_time) return 0;
    const start = new Date(activeSession.start_time);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / 1000);
  };

  // Prepare bandwidth chart data from sessions
  const getBandwidthChartData = () => {
    return sessions.slice(0, 24).reverse().map((session, index) => ({
      timestamp: new Date(session.acct_start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      download: Math.round(session.acct_input_octets / 1024 / 1024), // MB
      upload: Math.round(session.acct_output_octets / 1024 / 1024), // MB
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isOnline = customer.is_online || !!activeSession;

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Monitoring Koneksi</h3>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Connection Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status Koneksi</p>
                <div className="flex items-center mt-2">
                  {isOnline ? (
                    <>
                      <Wifi className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-2xl font-bold text-green-600">Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-2xl font-bold text-gray-400">Offline</span>
                    </>
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-full ${isOnline ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-900/20'}`}>
                <Activity className={`h-6 w-6 ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                <p className="text-xl font-bold mt-2 font-mono">
                  {activeSession?.framed_ip || customer.ip_address || '-'}
                </p>
                {activeSession?.start_time && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Login: {new Date(activeSession.start_time).toLocaleTimeString('id-ID')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Durasi Sesi</p>
                <p className="text-2xl font-bold mt-2">
                  {isOnline ? formatDuration(getSessionDuration()) : '-'}
                </p>
                {isOnline && (
                  <p className="text-xs text-green-600 mt-1">Aktif</p>
                )}
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Usage for Active Session */}
      {isOnline && activeSession && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                  <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Download (Sesi Ini)</p>
                  <p className="text-xl font-bold">
                    {formatBytes(activeSession.input_octets)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Upload (Sesi Ini)</p>
                  <p className="text-xl font-bold">
                    {formatBytes(activeSession.output_octets)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bandwidth Usage Chart */}
      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Usage per Sesi</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={getBandwidthChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis label={{ value: 'MB', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="download" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.3}
                  name="Download (MB)"
                />
                <Area 
                  type="monotone" 
                  dataKey="upload" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                  name="Upload (MB)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Connection Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Koneksi</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Login</TableHead>
                    <TableHead>Logout</TableHead>
                    <TableHead>Durasi</TableHead>
                    <TableHead>Data Usage</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.slice(0, 20).map((session) => (
                    <TableRow key={session.id || session.acct_session_id}>
                      <TableCell>
                        {new Date(session.acct_start_time).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        {session.acct_stop_time ? (
                          new Date(session.acct_stop_time).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        ) : (
                          <Badge variant="outline" className="text-green-600">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {session.acct_session_time 
                          ? formatDuration(session.acct_session_time)
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="flex items-center text-green-600">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            {formatBytes(session.acct_input_octets)}
                          </span>
                          <span className="text-muted-foreground">/</span>
                          <span className="flex items-center text-blue-600">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {formatBytes(session.acct_output_octets)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {session.framed_ip_address || '-'}
                      </TableCell>
                      <TableCell>
                        {session.acct_stop_time ? (
                          <Badge variant="secondary">
                            {session.acct_terminate_cause || 'Closed'}
                          </Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Belum ada riwayat koneksi</p>
              <p className="text-sm text-muted-foreground mt-1">
                Data akan muncul setelah customer terhubung via RADIUS
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
