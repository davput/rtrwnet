import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, Column } from "@/components/shared";
import { useTickets } from "@/hooks/useTickets";
import { Plus, Eye, Ticket, AlertCircle, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { TicketStatus, TicketPriority } from "@/types/ticket";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TicketRow {
  id: string;
  ticket_number: string;
  title: string;
  customer_name: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to_name?: string;
  created_at: string;
}

const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
  open: { label: "Baru", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  in_progress: { label: "Diproses", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  resolved: { label: "Selesai", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  closed: { label: "Ditutup", className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
};

const priorityConfig: Record<TicketPriority, { label: string; className: string }> = {
  low: { label: "Rendah", className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
  medium: { label: "Sedang", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  high: { label: "Tinggi", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  urgent: { label: "Urgent", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export function TicketsPage() {
  const navigate = useNavigate();
  const [filters] = useState({ page: 1, per_page: 100 });

  const { data, isLoading, error } = useTickets(filters);

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Gagal memuat data tiket</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tickets: TicketRow[] = data?.data?.tickets || [];

  const columns: Column<TicketRow>[] = [
    {
      key: "ticket_number",
      header: "No. Tiket",
      cell: (row) => <span className="font-mono font-medium">{row.ticket_number}</span>,
      sortable: true,
    },
    {
      key: "title",
      header: "Judul",
      cell: (row) => <span className="max-w-[200px] truncate block">{row.title}</span>,
      sortable: true,
    },
    {
      key: "customer_name",
      header: "Pelanggan",
      cell: (row) => row.customer_name,
      sortable: true,
    },
    {
      key: "priority",
      header: "Prioritas",
      cell: (row) => {
        const config = priorityConfig[row.priority];
        return <Badge className={config.className}>{config.label}</Badge>;
      },
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => {
        const config = statusConfig[row.status];
        return <Badge className={config.className}>{config.label}</Badge>;
      },
      sortable: true,
    },
    {
      key: "assigned_to_name",
      header: "Ditugaskan",
      cell: (row) => row.assigned_to_name || "-",
    },
    {
      key: "created_at",
      header: "Tanggal",
      cell: (row) => format(new Date(row.created_at), "d MMM yyyy", { locale: id }),
      sortable: true,
    },
    {
      key: "actions",
      header: "Aksi",
      className: "w-[80px]",
      cell: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/tiket/${row.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Lihat Detail
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Tiket Support</h1>
        </div>
        <Button onClick={() => navigate("/tiket/tambah")}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Tiket
        </Button>
      </div>

      <DataTable
        data={tickets}
        columns={columns}
        title="Daftar Tiket"
        description={`Total ${tickets.length} tiket`}
        searchable
        searchPlaceholder="Cari tiket..."
        searchKeys={["ticket_number", "title", "customer_name"]}
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "open", label: "Baru" },
              { value: "in_progress", label: "Diproses" },
              { value: "resolved", label: "Selesai" },
              { value: "closed", label: "Ditutup" },
            ],
          },
          {
            key: "priority",
            label: "Prioritas",
            options: [
              { value: "low", label: "Rendah" },
              { value: "medium", label: "Sedang" },
              { value: "high", label: "Tinggi" },
              { value: "urgent", label: "Urgent" },
            ],
          },
        ]}
        pagination
        pageSize={10}
        loading={isLoading}
        emptyMessage="Tidak ada tiket ditemukan"
        onRowClick={(row) => navigate(`/tiket/${row.id}`)}
      />
    </div>
  );
}

export default TicketsPage;
