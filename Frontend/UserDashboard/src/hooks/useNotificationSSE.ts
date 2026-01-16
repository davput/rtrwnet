import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/auth.store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

interface SSEMessage {
  event: string;
  data: string;
}

export function useNotificationSSE() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const [isConnected, setIsConnected] = useState(false);

  const parseSSE = (text: string): SSEMessage[] => {
    const messages: SSEMessage[] = [];
    const lines = text.split('\n');
    let currentEvent = 'message';
    let currentData = '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        currentData = line.slice(5).trim();
      } else if (line === '' && currentData) {
        messages.push({ event: currentEvent, data: currentData });
        currentEvent = 'message';
        currentData = '';
      }
    }
    return messages;
  };

  const connect = useCallback(async () => {
    if (!token) {
      console.log('SSE: No token, skipping connection');
      return;
    }

    // Close existing connection
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    console.log('SSE: Connecting to notifications stream...');

    try {
      const response = await fetch(`${API_URL}/notifications/stream`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      setIsConnected(true);
      reconnectAttempts.current = 0;
      console.log('SSE: Connected to notifications stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const messages = parseSSE(buffer);
        
        // Keep incomplete message in buffer
        const lastNewline = buffer.lastIndexOf('\n\n');
        if (lastNewline !== -1) {
          buffer = buffer.slice(lastNewline + 2);
        }

        for (const msg of messages) {
          if (msg.event === 'connected') {
            console.log('SSE: Connection confirmed', msg.data);
          } else if (msg.event === 'notification') {
            console.log('SSE: Received notification', msg.data);
            try {
              const notification = JSON.parse(msg.data);
              // Invalidate queries to refresh notification list and count
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
              
              // Show browser notification
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(notification.title || 'Notifikasi Baru', {
                  body: notification.message,
                  icon: '/favicon.ico',
                });
              }
            } catch (err) {
              console.error('SSE: Failed to parse notification', err);
            }
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('SSE: Connection aborted');
        return;
      }

      console.error('SSE: Connection error', error);
      setIsConnected(false);

      // Reconnect with exponential backoff
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        console.log(`SSE: Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      } else {
        console.log('SSE: Max reconnect attempts reached, falling back to polling');
      }
    }
  }, [token, queryClient]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { connect, disconnect, isConnected };
}
