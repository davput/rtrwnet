import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, User, Shield, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupportTicket, useAddTicketReply, useUpdateTicketStatus, useResolveTicket, useCloseTicket } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  open: "Open", in_progress: "In Progress", resolved: "Resolved", closed: "Closed",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-600", medium: "bg-blue-100 text-blue-600",
  high: "bg-orange-100 text-orange-600", urgent: "bg-red-100 text-red-600",
};

export function SupportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [replyMessage, setReplyMessage] = useState("");

  const { data: ticket, isLoading } = useSupportTicket(id || "");
  const addReply = useAddTicketReply();
  const updateStatus = useUpdateTicketStatus();
  const resolveTicket = useResolveTicket();
  const closeTicket = useCloseTicket();

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !id) return;
    try {
      await addReply.mutateAsync({ id, message: replyMessage });
      toast({ title: "Berhasil", description: "Balasan berhasil dikirim" });
      setReplyMessage("");
    } catch {
      toast({ title: "Error", description: "Gagal mengirim balasan", variant: "destructive" });
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!id) return;
    try {
      await updateStatus.mutateAsync({ id, status });
      toast({ title: "Berhasil", description: "Status tiket diperbarui" });
    } catch {
      toast({ title: "Error", description: "Gagal memperbarui status", variant: "destructive" });
    }
  };

  const handleResolve = async () => {
    if (!id) return;
    try {
      await resolveTicket.mutateAsync(id);
      toast({ title: "Berhasil", description: "Tiket ditandai selesai" });
    } catch {
      toast({ title: "Error", description: "Gagal menyelesaikan tiket", variant: "destructive" });
    }
  };

  const handleClose = async () => {
    if (!id) return;
    try {
      await closeTicket.mutateAsync(id);
      toast({ title: "Berhasil", description: "Tiket ditutup" });
    } catch {
      toast({ title: "Error", description: "Gagal menutup tiket", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64">Memuat...</div>;
  if (!ticket?.data) return <div className="flex items-center justify-center h-64">Tiket tidak ditemukan</div>;

  const ticketData = ticket.data;
  const canReply = ticketData.status !== "closed";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/support")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{ticketData.subject}</h1>
          <p className="text-muted-foreground">
            Dari: {ticketData.tenant_name || "Unknown"} • #{ticketData.id.slice(0, 8)}
          </p>
        </div>
        <Badge className={statusColors[ticketData.status]}>{statusLabels[ticketData.status]}</Badge>
        <Badge className={priorityColors[ticketData.priority]}>{ticketData.priority.toUpperCase()}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Original Message */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm">{ticketData.tenant_name || "Tenant"}</CardTitle>
                  <CardDescription>{formatDate(ticketData.created_at)}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{ticketData.description}</p>
            </CardContent>
          </Card>

          {/* Replies */}
          {ticketData.replies && ticketData.replies.length > 0 && (
            <div className="space-y-4">
              <Separator />
              <h3 className="font-medium">Balasan ({ticketData.replies.length})</h3>
              {ticketData.replies.map((reply: { id: string; message: string; is_admin: boolean; created_at: string }) => (
                <Card key={reply.id} className={reply.is_admin ? "border-primary/20 bg-primary/5" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${reply.is_admin ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        {reply.is_admin ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </div>
                      <div>
                        <CardTitle className="text-sm">{reply.is_admin ? "Admin" : "Tenant"}</CardTitle>
                        <CardDescription>{formatDate(reply.created_at)}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent><p className="whitespace-pre-wrap">{reply.message}</p></CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Reply Form */}
          {canReply && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Balas Tiket</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Textarea placeholder="Tulis balasan..." rows={4} value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} />
                <Button onClick={handleSendReply} disabled={!replyMessage.trim() || addReply.isPending}>
                  <Send className="mr-2 h-4 w-4" />{addReply.isPending ? "Mengirim..." : "Kirim Balasan"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Aksi</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">Status</label>
                <Select value={ticketData.status} onValueChange={handleStatusChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleResolve} disabled={ticketData.status === "resolved" || ticketData.status === "closed"}>
                  <CheckCircle className="mr-1 h-4 w-4" />Selesai
                </Button>
                <Button variant="outline" size="sm" onClick={handleClose} disabled={ticketData.status === "closed"}>
                  <XCircle className="mr-1 h-4 w-4" />Tutup
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Info Tiket</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Kategori</span><span className="capitalize">{ticketData.category || "Umum"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Dibuat</span><span>{formatDate(ticketData.created_at)}</span></div>
              {ticketData.resolved_at && <div className="flex justify-between"><span className="text-muted-foreground">Diselesaikan</span><span>{formatDate(ticketData.resolved_at)}</span></div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
