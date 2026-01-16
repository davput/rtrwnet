import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/features/auth/auth.store';
import { toast } from 'sonner';
import * as chatApi from '@/api/chat.api';
import type { ChatRoom, ChatMessage } from '@/api/chat.api';

interface WebSocketMessage {
  type: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  sender_type: 'user' | 'admin';
  message?: string;
  data?: any;
  timestamp: number;
}

// Notification sound using Web Audio API
const playNotificationSound = (enabled: boolean) => {
  if (!enabled) return;
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 600;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.2;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (e) {
    console.log('Audio not supported');
  }
};

// Typing indicator component
const TypingIndicator = () => (
  <div className="flex items-center gap-2 px-3 py-2">
    <div className="flex gap-1">
      <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
    <span className="text-xs text-muted-foreground">Admin sedang mengetik...</span>
  </div>
);

// Avatar color combinations for better contrast
const getAvatarColors = (type: 'user' | 'admin') => {
  if (type === 'admin') {
    return 'bg-emerald-600 text-white font-semibold';
  }
  return 'bg-blue-600 text-white font-semibold';
};

export function LiveChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check for existing chat on mount
  useEffect(() => {
    const checkExistingChat = async () => {
      try {
        const response = await chatApi.getActiveChat();
        if (response?.data) {
          setRoom(response.data);
        }
      } catch {
        // No active chat
      }
    };
    checkExistingChat();
  }, []);

  // Connect to WebSocket when room is active
  useEffect(() => {
    if (!room || room.status === 'closed' || !isOpen) return;

    const connectWebSocket = () => {
      const wsUrl = chatApi.getChatWebSocketUrl(room.id, user?.name || 'User');
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        const data: WebSocketMessage = JSON.parse(event.data);
        
        if (data.type === 'chat' && data.message) {
          const newMsg: ChatMessage = {
            id: `${data.timestamp}-${data.sender_id}`,
            room_id: data.room_id,
            sender_id: data.sender_id,
            sender_name: data.sender_name,
            sender_type: data.sender_type,
            message: data.message,
            is_read: false,
            created_at: new Date(data.timestamp * 1000).toISOString(),
          };
          // Avoid duplicate messages
          setMessages(prev => {
            const exists = prev.some(m => m.id === newMsg.id);
            if (exists) return prev;
            return [...prev, newMsg];
          });

          // Clear typing indicator when message received
          if (data.sender_type === 'admin') {
            setIsAdminTyping(false);
          }

          // Show notification for incoming admin messages
          if (data.sender_type === 'admin') {
            playNotificationSound(soundEnabled);
            // Increment unread count if minimized
            if (isMinimized) {
              setUnreadCount(prev => prev + 1);
              toast.info(`${data.sender_name}: ${data.message.substring(0, 50)}${data.message.length > 50 ? '...' : ''}`, {
                duration: 4000,
              });
            }
          }
        } else if (data.type === 'typing' && data.sender_type === 'admin') {
          // Handle typing indicator
          setIsAdminTyping(true);
          // Clear previous timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          // Auto-hide typing indicator after 3 seconds
          typingTimeoutRef.current = setTimeout(() => {
            setIsAdminTyping(false);
          }, 3000);
        } else if (data.type === 'join') {
          // Admin joined
          setRoom(prev => prev ? { ...prev, status: 'active', admin_name: data.sender_name } : null);
          playNotificationSound(soundEnabled);
          toast.success(`${data.sender_name} bergabung dalam chat`);
        } else if (data.type === 'room_update' && data.data?.status === 'closed') {
          setRoom(prev => prev ? { ...prev, status: 'closed' } : null);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      wsRef.current?.close();
    };
  }, [room?.id, room?.status, isOpen, user?.name, isMinimized, soundEnabled]);

  // Clear unread count when chat is expanded
  useEffect(() => {
    if (!isMinimized && isOpen) {
      setUnreadCount(0);
    }
  }, [isMinimized, isOpen]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Load messages when room opens
  useEffect(() => {
    if (room && isOpen) {
      loadMessages();
    }
  }, [room?.id, isOpen]);

  const loadMessages = async () => {
    if (!room) return;
    try {
      const response = await chatApi.getChatMessages(room.id);
      if (response?.data) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const startNewChat = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await chatApi.startChat({
        subject: 'Bantuan',
        user_name: user.name,
        email: user.email,
      });
      if (response?.data) {
        setRoom(response.data);
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const msg: WebSocketMessage = {
      type: 'chat',
      room_id: room?.id || '',
      sender_id: user?.id || '',
      sender_name: user?.name || 'User',
      sender_type: 'user',
      message: newMessage.trim(),
      timestamp: Date.now() / 1000,
    };

    wsRef.current.send(JSON.stringify(msg));
    setNewMessage('');
  }, [newMessage, room?.id, user]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const closeChat = async () => {
    if (room) {
      await chatApi.closeChat(room.id);
      setRoom(null);
      setMessages([]);
    }
    setIsOpen(false);
  };

  // Floating bubble when chat is closed (always visible)
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-[9999]">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setIsOpen(true)}
                className="h-14 w-14 rounded-full shadow-lg relative bg-primary hover:bg-primary/90"
                size="icon"
              >
                <MessageCircle className="h-6 w-6" />
                {/* Floating bubble indicator for active chat */}
                {room && room.status !== 'closed' && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                )}
                {/* Unread count badge */}
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{room ? 'Lanjutkan chat' : 'Butuh bantuan?'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-[9999] bg-background border rounded-lg shadow-xl transition-all ${
      isMinimized ? 'w-72 h-14' : 'w-80 sm:w-96 h-[500px]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium">Live Chat</span>
          {room?.status === 'waiting' && (
            <Badge variant="secondary" className="text-xs">Menunggu</Badge>
          )}
          {isConnected && room?.status === 'active' && (
            <Badge variant="secondary" className="text-xs bg-green-500 text-white">Online</Badge>
          )}
          {/* Unread badge in header when minimized */}
          {isMinimized && unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">{unreadCount}</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Sound toggle button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{soundEnabled ? 'Matikan suara' : 'Nyalakan suara'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat Content */}
          <div className="flex-1 overflow-y-auto p-3 h-[380px]">
            {!room ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Butuh Bantuan?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Tim support kami siap membantu Anda
                </p>
                <Button onClick={startNewChat} disabled={isLoading}>
                  {isLoading ? 'Memulai...' : 'Mulai Chat'}
                </Button>
              </div>
            ) : room.status === 'waiting' ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="animate-pulse">
                  <MessageCircle className="h-12 w-12 text-primary mb-4" />
                </div>
                <h3 className="font-medium mb-2">Menunggu Admin</h3>
                <p className="text-sm text-muted-foreground">
                  Admin akan segera merespon chat Anda
                </p>
              </div>
            ) : room.status === 'closed' ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <h3 className="font-medium mb-2">Chat Ditutup</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Terima kasih telah menghubungi kami
                </p>
                <Button onClick={() => { setRoom(null); setMessages([]); }}>
                  Chat Baru
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {room.admin_name && (
                  <div className="text-center text-xs text-muted-foreground py-2">
                    {room.admin_name} bergabung dalam chat
                  </div>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[80%] ${
                      msg.sender_type === 'user' ? 'flex-row-reverse' : ''
                    }`}>
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className={getAvatarColors(msg.sender_type)}>
                          {msg.sender_name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`rounded-2xl px-4 py-2.5 ${
                        msg.sender_type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                        <p className={`text-[10px] mt-1.5 ${
                          msg.sender_type === 'user' ? 'text-blue-100' : 'text-muted-foreground/60'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Typing indicator */}
                {isAdminTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-end gap-2 max-w-[80%]">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className={getAvatarColors('admin')}>
                          {room.admin_name?.[0]?.toUpperCase() || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-2xl">
                        <TypingIndicator />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input - Seamless design */}
          {room && room.status === 'active' && (
            <div className="p-3 border-t">
              <div className="flex items-center gap-0 bg-muted rounded-full overflow-hidden pr-1">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ketik pesan..."
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full"
                />
                <Button 
                  size="icon" 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim()}
                  className="h-9 w-9 rounded-full flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
