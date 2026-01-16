import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

// Mock data
const mockLogs = [
  {
    id: "1",
    admin_name: "Super Admin",
    action: "CREATE",
    resource_type: "tenant",
    resource_id: "tenant-123",
    details: "Created new tenant: RT Net Cempaka",
    ip_address: "192.168.1.1",
    created_at: "2024-12-10T14:30:00Z",
  },
  {
    id: "2",
    admin_name: "Super Admin",
    action: "UPDATE",
    resource_type: "plan",
    resource_id: "plan-2",
    details: "Updated plan price: Professional from 500000 to 599000",
    ip_address: "192.168.1.1",
    created_at: "2024-12-10T13:15:00Z",
  },
  {
    id: "3",
    admin_name: "Admin Support",
    action: "SUSPEND",
    resource_type: "tenant",
    resource_id: "tenant-456",
    details: "Suspended tenant: Net Anggrek - Reason: Payment overdue",
    ip_address: "192.168.1.2",
    created_at: "2024-12-09T16:45:00Z",
  },
  {
    id: "4",
    admin_name: "Super Admin",
    action: "DELETE",
    resource_type: "user",
    resource_id: "user-789",
    details: "Deleted admin user: john@example.com",
    ip_address: "192.168.1.1",
    created_at: "2024-12-09T10:20:00Z",
  },
  {
    id: "5",
    admin_name: "Admin Support",
    action: "ACTIVATE",
    resource_type: "tenant",
    resource_id: "tenant-321",
    details: "Activated tenant: RW Net Melati",
    ip_address: "192.168.1.2",
    created_at: "2024-12-08T09:00:00Z",
  },
];

const actionColors: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  SUSPEND: "bg-yellow-100 text-yellow-800",
  ACTIVATE: "bg-emerald-100 text-emerald-800",
};

export function AuditLogs() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">Riwayat aktivitas admin</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Log Aktivitas
              </CardTitle>
              <CardDescription>Semua aktivitas admin tercatat di sini</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Cari log..." className="pl-9 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </TableCell>
                  <TableCell>{log.admin_name}</TableCell>
                  <TableCell>
                    <Badge className={actionColors[log.action]}>{log.action}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{log.resource_type}</span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                  <TableCell className="font-mono text-sm">{log.ip_address}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-2 py-4">
            <p className="text-sm text-muted-foreground">
              Menampilkan 1-{mockLogs.length} dari {mockLogs.length} log
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">Halaman 1 dari 1</span>
              <Button variant="outline" size="sm" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
