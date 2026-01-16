import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, User, Shield, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useSupportTicket, useAddSupportTicketReply } from '@/hooks/useSupportTickets';
import { useToast } from '@/hooks/use-toast';

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

export default function SupportTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [replyMessage, setReplyMessage] = useState('');

  const { data: ticket, isLoading } = useSupportTicket(id || '');
  const addReply = useAddSupportTicketReply();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !id) return;
    try {
      await addReply.mutateAsync({ ticketId: id, message: replyMessage });
      toast({ title: 'Berhasil', description: 'Balasan berhasil dikirim' });
      setReplyMessage('');
    } catch {
      toast({ title: 'Error', description: 'Gagal mengirim balasan', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Memuat...</div>;
  }

  if (!ticket) {
    return <div className="flex items-center justify-center h-64">Tiket tidak ditemukan</div>;
  }

  const canReply = ticket.status !== 'closed';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/support-tickets')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{ticket.subject}</h1>
          <p className="text-muted-foreground">Tiket #{ticket.id.slice(0, 8)}</p>
        </div>
        <Badge className={statusConfig[ticket.status]?.color || ''}>
          <span className="flex items-center gap-1">
            {statusConfig[ticket.status]?.icon}
            {statusConfig[ticket.status]?.label || ticket.status}
          </span>
        </Badge>
        <Badge className={priorityConfig[ticket.priority]?.color || ''}>
          {priorityConfig[ticket.priority]?.label || ticket.priority}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Original Message */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm">Anda</CardTitle>
                  <CardDescription>{formatDate(ticket.created_at)}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Replies */}
          {ticket.replies && ticket.replies.length > 0 && (
            <div className="space-y-4">
              <Separator />
              <h3 className="font-medium">Balasan ({ticket.replies.length})</h3>
              {ticket.replies.map((reply) => (
                <Card key={reply.id} className={reply.is_admin ? 'border-primary/20 bg-primary/5' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        reply.is_admin ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        {reply.is_admin ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </div>
                      <div>
                        <CardTitle className="text-sm">
                          {reply.is_admin ? 'Tim Support' : 'Anda'}
                        </CardTitle>
                        <CardDescription>{formatDate(reply.created_at)}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{reply.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Reply Form */}
          {canReply && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Balas Tiket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Tulis balasan Anda..."
                  rows={4}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                />
                <Button onClick={handleSendReply} disabled={!replyMessage.trim() || addReply.isPending}>
                  <Send className="mr-2 h-4 w-4" />
                  {addReply.isPending ? 'Mengirim...' : 'Kirim Balasan'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informasi Tiket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kategori</span>
                <span className="capitalize">{ticket.category || 'Umum'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dibuat</span>
                <span>{formatDate(ticket.created_at)}</span>
              </div>
              {ticket.resolved_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diselesaikan</span>
                  <span>{formatDate(ticket.resolved_at)}</span>
                </div>
              )}
              {ticket.closed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ditutup</span>
                  <span>{formatDate(ticket.closed_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
