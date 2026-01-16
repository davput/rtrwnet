import { useState } from 'react';
import { Bell, CheckCheck, Trash2, Info, AlertCircle, CheckCircle, XCircle, CreditCard, Ticket, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '@/hooks/useNotifications';
import { useNotificationSSE } from '@/hooks/useNotificationSSE';
import type { Notification } from '@/api/notifications.api';

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-blue-500" />,
  success: <CheckCircle className="h-4 w-4 text-green-500" />,
  warning: <AlertCircle className="h-4 w-4 text-yellow-500" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
  payment: <CreditCard className="h-4 w-4 text-purple-500" />,
  ticket: <Ticket className="h-4 w-4 text-indigo-500" />,
  system: <Info className="h-4 w-4 text-gray-500" />,
  subscription: <CreditCard className="h-4 w-4 text-orange-500" />,
};

// Helper to get navigation path from notification data
const getNotificationLink = (notification: Notification): string | null => {
  try {
    if (notification.data) {
      const data = JSON.parse(notification.data);
      // Support ticket notifications
      if (data.ticket_id) {
        return `/support-tickets/${data.ticket_id}`;
      }
      // Payment notifications
      if (data.order_id) {
        return `/payment/${data.order_id}`;
      }
    }
    // Fallback based on type
    switch (notification.type) {
      case 'ticket':
        return '/support-tickets';
      case 'payment':
      case 'subscription':
        return '/billing';
      default:
        return null;
    }
  } catch {
    return null;
  }
};

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: notificationsData } = useNotifications({ per_page: 10 });
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();
  useNotificationSSE(); // Enable real-time notifications

  const notifications = notificationsData?.notifications || [];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7) return `${days} hari lalu`;
    return date.toLocaleDateString('id-ID');
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification.mutate(id);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    // Navigate to related page
    const link = getNotificationLink(notification);
    if (link) {
      setOpen(false);
      navigate(link);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifikasi</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-1" />
              Tandai semua
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification: Notification) => {
                const link = getNotificationLink(notification);
                return (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {typeIcons[notification.type] || typeIcons.info}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium truncate ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.is_read && (
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            )}
                            {link && (
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => handleDelete(notification.id, e)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button variant="ghost" className="w-full" size="sm" onClick={() => { setOpen(false); navigate('/notifikasi'); }}>
              Lihat semua notifikasi
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
