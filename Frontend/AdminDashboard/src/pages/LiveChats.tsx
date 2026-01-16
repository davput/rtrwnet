import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageCircle, Send, Clock, CheckCircle, XCircle, Volume2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import * as chatApi from "@/api/chat.api";
import type { ChatRoom, ChatMessage } from "@/api/chat.api";

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
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.15);
  } catch (e) {
    console.log('Audio not supported');
  }
};

// Request browser notification permission
const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

// Show browser notification
const showBrowserNotification = (title: string, body: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
};

export function LiveChats() {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get admin name from localStorage
  const adminData = JSON.parse(localStorage.getItem("admin_user") || "{}");
  const adminName = adminData.name || "Admin";

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const { data: waitingChats, refetch: refetchWaiting } = useQuery({
    queryKey: ["chats", "waiting"],
    queryFn: async () => {
      const res = await chatApi.getWaitingChats();
      return res.data?.data || [];
    },
    refetchInterval: 5000,
  });

  const { data: activeChats, refetch: refetchActive } = useQuery({
    queryKey: ["chats", "active"],
    queryFn: async () => {
      const res = await chatApi.getAllActiveChats();
      return res.data?.data || [];
    },
    refetchInterval: 5000,
  });

  const joinMutation = useMutation({
    mutationFn: (roomId: string) => chatApi.joinChat(roomId),
    onSuccess: (res) => {
      const room = res.data?.data;
      if (room) {
        setSelectedRoom(room);
        toast.success("Berhasil bergabung ke chat");
        refetchWaiting();
        refetchActive();
      }
    },
    onError: () => {
      toast.error("Gagal bergabung ke chat");
    },
  });

  const closeMutation = useMutation({
    mutationFn: (roomId: string) => chatApi.closeChat(roomId),
    onSuccess: () => {
      setSelectedRoom(null);
      setMessages([]);
      toast.success("Chat ditutup");
      refetchActive();
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages when room selected
  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.id);
    }
  }, [selectedRoom?.id]);

  // WebSocket connection
  useEffect(() => {
    if (!selectedRoom || selectedRoom.status === "closed") return;

    const wsUrl = chatApi.getChatWebSocketUrl(selectedRoom.id, adminName);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (event) => {
      const data: WebSocketMessage = JSON.parse(event.data);
      
      if (data.type === "chat" && data.message) {
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

        // Show notification for incoming user messages
        if (data.sender_type === "user") {
          if (soundEnabled) {
            playNotificationSound();
          }
          toast.info(`${data.sender_name}: ${data.message.substring(0, 50)}${data.message.length > 50 ? '...' : ''}`, {
            duration: 4000,
          });
          // Browser notification if tab not focused
          if (document.hidden) {
            showBrowserNotification(`Pesan dari ${data.sender_name}`, data.message);
          }
        }
      } else if (data.type === "room_update" && data.data?.status === "closed") {
        setSelectedRoom(prev => prev ? { ...prev, status: "closed" } : null);
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [selectedRoom?.id, selectedRoom?.status, adminName]);

  const loadMessages = async (roomId: string) => {
    try {
      const res = await chatApi.getChatMessages(roomId);
      setMessages(res.data?.data || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const timestamp = Date.now() / 1000;
    const msg: WebSocketMessage = {
      type: "chat",
      room_id: selectedRoom?.id || "",
      sender_id: adminData.id || "",
      sender_name: adminName,
      sender_type: "admin",
      message: newMessage.trim(),
      timestamp: timestamp,
    };

    wsRef.current.send(JSON.stringify(msg));
    setNewMessage("");
  }, [newMessage, selectedRoom?.id, adminData.id, adminName]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Menunggu</Badge>;
      case "active":
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Aktif</Badge>;
      case "closed":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><XCircle className="h-3 w-3 mr-1" />Ditutup</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Chat</h1>
          <p className="text-muted-foreground">Kelola chat dengan pengguna</p>
        </div>
        <Button
          variant={soundEnabled ? "default" : "outline"}
          size="sm"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="gap-2"
        >
          <Volume2 className="h-4 w-4" />
          {soundEnabled ? "Suara Aktif" : "Suara Mati"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Chat List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Daftar Chat</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[calc(100vh-320px)] overflow-y-auto">
              {/* Waiting Chats */}
              {waitingChats && waitingChats.length > 0 && (
                <div className="px-4 py-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2">MENUNGGU ({waitingChats.length})</p>
                  {waitingChats.map((room) => (
                    <div
                      key={room.id}
                      className="p-3 rounded-lg border mb-2 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => joinMutation.mutate(room.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-yellow-100 text-yellow-800">
                            {room.user_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{room.user_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{room.user_email}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        {getStatusBadge(room.status)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(room.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Active Chats */}
              {activeChats && activeChats.length > 0 && (
                <div className="px-4 py-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2">AKTIF ({activeChats.length})</p>
                  {activeChats.map((room) => (
                    <div
                      key={room.id}
                      className={`p-3 rounded-lg border mb-2 cursor-pointer transition-colors ${
                        selectedRoom?.id === room.id ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedRoom(room)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-green-100 text-green-800">
                            {room.user_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{room.user_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {room.last_message || room.user_email}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        {getStatusBadge(room.status)}
                        <span className="text-xs text-muted-foreground">
                          {room.admin_name && `Ditangani: ${room.admin_name}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(!waitingChats || waitingChats.length === 0) && (!activeChats || activeChats.length === 0) && (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <MessageCircle className="h-10 w-10 mb-2" />
                  <p>Tidak ada chat</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{selectedRoom.user_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selectedRoom.user_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{selectedRoom.user_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isConnected && <Badge variant="outline" className="bg-green-50">Online</Badge>}
                    {selectedRoom.status !== "closed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => closeMutation.mutate(selectedRoom.id)}
                      >
                        Tutup Chat
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-hidden p-0">
                <div className="h-[calc(100vh-420px)] overflow-y-auto p-4">
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex items-end gap-2 max-w-[70%] ${
                          msg.sender_type === "admin" ? "flex-row-reverse" : ""
                        }`}>
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className={msg.sender_type === "admin" ? "bg-primary text-primary-foreground" : ""}>
                              {msg.sender_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`rounded-lg px-3 py-2 ${
                            msg.sender_type === "admin"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}>
                            <p className="text-sm">{msg.message}</p>
                            <p className="text-[10px] opacity-70 mt-1">
                              {new Date(msg.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </CardContent>

              {/* Input */}
              {selectedRoom.status === "active" && (
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ketik pesan..."
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageCircle className="h-16 w-16 mb-4" />
              <p className="text-lg font-medium">Pilih chat untuk memulai</p>
              <p className="text-sm">Klik pada chat di daftar sebelah kiri</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
