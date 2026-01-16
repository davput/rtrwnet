import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTicket, useResolveTicket, useCloseTicket } from '@/hooks/useTickets';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { TicketStatus, TicketPriority } from '@/types/ticket';

const statusColors: Record<TicketStatus, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<TicketStatus, string> = {
  open: 'Baru',
  in_progress: 'Diproses',
  resolved: 'Selesai',
  closed: 'Ditutup',
};

const priorityColors: Record<TicketPriority, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const priorityLabels: Record<TicketPriority, string> = {
  low: 'Rendah',
  medium: 'Sedang',
  high: 'Tinggi',
  urgent: 'Urgent',
};

export function TicketDetailPage() {
  const { id: ticketId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);

  const { data, isLoading, error } = useTicket(ticketId || '');
  const resolveTicket = useResolveTicket();
  const closeTicket = useCloseTicket();

  const ticket = data?.data;

  const handleResolve = async () => {
    if (!ticketId || !resolutionNotes.trim()) {
      toast.error('Catatan resolusi wajib diisi');
      return;
    }

    try {
      await resolveTicket.mutateAsync({
        id: ticketId,
        data: { resolution_notes: resolutionNotes },
      });
      toast.success('Tiket berhasil diselesaikan');
      setResolveDialogOpen(false);
    } catch {
      toast.error('Gagal menyelesaikan tiket');
    }
  };

  const handleClose = async () => {
    if (!ticketId) return;

    try {
      await closeTicket.mutateAsync(ticketId);
      toast.success('Tiket berhasil ditutup');
    } catch {
      toast.error('Gagal menutup tiket');
    }
  };

  if (isLoading) {
    return <TicketDetailSkeleton />;
  }

  if (error || !ticket) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Gagal memuat detail tiket</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tiket')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{ticket.ticket_number}</h1>
          <p className="text-muted-foreground">{ticket.title}</p>
        </div>
        <div className="flex gap-2">
          {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
            <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Selesaikan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Selesaikan Tiket</DialogTitle>
                  <DialogDescription>
                    Masukkan catatan resolusi untuk tiket ini
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  placeholder="Catatan resolusi..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={4}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleResolve} disabled={resolveTicket.isPending}>
                    {resolveTicket.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Selesaikan
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {ticket.status === 'resolved' && (
            <Button variant="outline" onClick={handleClose} disabled={closeTicket.isPending}>
              {closeTicket.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Tutup Tiket
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deskripsi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {ticket.resolution_notes && (
            <Card>
              <CardHeader>
                <CardTitle>Resolusi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{ticket.resolution_notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Aktivitas</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.activities && ticket.activities.length > 0 ? (
                <div className="space-y-4">
                  {ticket.activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{activity.user_name}</span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(activity.created_at), 'd MMM yyyy HH:mm', {
                              locale: id,
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Belum ada aktivitas</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={statusColors[ticket.status]}>
                  {statusLabels[ticket.status]}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Prioritas</span>
                <Badge className={priorityColors[ticket.priority]}>
                  {priorityLabels[ticket.priority]}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pelanggan</span>
                <span className="text-sm font-medium">{ticket.customer_name}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ditugaskan</span>
                <span className="text-sm font-medium">{ticket.assigned_to_name || '-'}</span>
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Dibuat: {format(new Date(ticket.created_at), 'd MMM yyyy HH:mm', { locale: id })}
                </span>
              </div>
              {ticket.resolved_at && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">
                    Selesai:{' '}
                    {format(new Date(ticket.resolved_at), 'd MMM yyyy HH:mm', { locale: id })}
                  </span>
                </div>
              )}
              {ticket.closed_at && (
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">
                    Ditutup:{' '}
                    {format(new Date(ticket.closed_at), 'd MMM yyyy HH:mm', { locale: id })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TicketDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TicketDetailPage;
