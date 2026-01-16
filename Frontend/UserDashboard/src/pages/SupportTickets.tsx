import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupportTickets, useSupportTicketStats, useCreateSupportTicket } from '@/hooks/useSupportTickets';
import { useToast } from '@/hooks/use-toast';
import type { SupportTicket } from '@/api/support-tickets.api';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: 'Terbuka', color: 'bg-blue-100 text-blue-800', icon: <AlertCircle className="h-4 w-4" /> },
  in_progress: { label: 'Diproses', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-4 w-4" /> },
  resolved: { label: 'Selesai', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> },
  closed: { label: 'Ditutup', color: 'bg-gray-100 text-gray-800', icon: <XCircle className="h-4 w-4" /> },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Rendah', color: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Sedang', color: 'bg-blue-100 text-blue-600' },
  high: { label: 'Tinggi', color: 'bg-orange-100 text-orange-600' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-600' },
};

const categoryOptions = [
  { value: 'general', label: 'Umum' },
  { value: 'billing', label: 'Pembayaran' },
  { value: 'technical', label: 'Teknis' },
  { value: 'feature', label: 'Fitur' },
  { value: 'bug', label: 'Bug/Error' },
];

export default function SupportTickets() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium',
  });

  const statusFilter = activeTab === 'all' ? undefined : activeTab;
  const { data: ticketsData, isLoading } = useSupportTickets({ status: statusFilter });
  const { data: stats } = useSupportTicketStats();
  const createTicket = useCreateSupportTicket();

  const handleCreateTicket = async () => {
    if (!formData.subject.trim() || !formData.description.trim()) {
      toast({
        title: 'Error',
        description: 'Subjek dan deskripsi harus diisi',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createTicket.mutateAsync(formData);
      toast({
        title: 'Berhasil',
        description: 'Tiket support berhasil dibuat',
      });
      setIsCreateOpen(false);
      setFormData({ subject: '', description: '', category: 'general', priority: 'medium' });
    } catch {
      toast({
        title: 'Error',
        description: 'Gagal membuat tiket support',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">Hubungi tim support untuk bantuan</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Buat Tiket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Buat Tiket Support Baru</DialogTitle>
              <DialogDescription>
                Jelaskan masalah atau pertanyaan Anda dengan detail
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="subject">Subjek</Label>
                <Input
                  id="subject"
                  placeholder="Ringkasan masalah..."
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Kategori</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Prioritas</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  placeholder="Jelaskan masalah Anda secara detail..."
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleCreateTicket} disabled={createTicket.isPending}>
                {createTicket.isPending ? 'Mengirim...' : 'Kirim Tiket'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tiket</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terbuka</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.open || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diproses</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.in_progress || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.resolved || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Tiket</CardTitle>
          <CardDescription>Semua tiket support Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="open">Terbuka</TabsTrigger>
              <TabsTrigger value="in_progress">Diproses</TabsTrigger>
              <TabsTrigger value="resolved">Selesai</TabsTrigger>
              <TabsTrigger value="closed">Ditutup</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Memuat...</div>
              ) : !ticketsData?.tickets?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada tiket support
                </div>
              ) : (
                <div className="space-y-4">
                  {ticketsData.tickets.map((ticket: SupportTicket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/support-tickets/${ticket.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{ticket.subject}</h3>
                          <Badge className={priorityConfig[ticket.priority]?.color || ''}>
                            {priorityConfig[ticket.priority]?.label || ticket.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {ticket.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(ticket.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge className={statusConfig[ticket.status]?.color || ''}>
                          <span className="flex items-center gap-1">
                            {statusConfig[ticket.status]?.icon}
                            {statusConfig[ticket.status]?.label || ticket.status}
                          </span>
                        </Badge>
                        {ticket.reply_count && ticket.reply_count > 0 && (
                          <Badge variant="outline">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {ticket.reply_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
