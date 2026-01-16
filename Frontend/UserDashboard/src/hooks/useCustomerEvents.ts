import { useEffect, useCallback, useRef } from 'react';

interface CustomerEvent {
  type: 'online' | 'offline' | 'status_change';
  customer_id: string;
  tenant_id: string;
  data: {
    username?: string;
    ip_address?: string;
    is_online?: boolean;
  };
  timestamp: string;
}

interface UseCustomerEventsOptions {
  onCustomerOnline?: (customerId: string, data: CustomerEvent['data']) => void;
  onCustomerOffline?: (customerId: string, data: CustomerEvent['data']) => void;
  onAnyEvent?: (event: CustomerEvent) => void;
  enabled?: boolean;
}

export function useCustomerEvents(options: UseCustomerEventsOptions = {}) {
  const { onCustomerOnline, onCustomerOffline, onAnyEvent, enabled = true } = options;
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;

    const token = localStorage.getItem('access_token');
    const tenantId = localStorage.getItem('tenant_id');
    
    if (!token || !tenantId) return;

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8089/api/v1';
    const url = `${baseUrl}/customers/events/stream`;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create new EventSource with auth headers via fetch
    // Note: EventSource doesn't support custom headers, so we use a workaround
    // For now, we'll use polling as fallback if SSE doesn't work with auth
    
    try {
      // Try to connect via EventSource (works if server handles auth via cookies/query params)
      const eventSource = new EventSource(`${url}?token=${token}&tenant_id=${tenantId}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connected for customer events');
      };

      eventSource.addEventListener('customer_event', (e) => {
        try {
          const event: CustomerEvent = JSON.parse(e.data);
          
          if (event.type === 'online' && onCustomerOnline) {
            onCustomerOnline(event.customer_id, event.data);
          } else if (event.type === 'offline' && onCustomerOffline) {
            onCustomerOffline(event.customer_id, event.data);
          }
          
          if (onAnyEvent) {
            onAnyEvent(event);
          }
        } catch (err) {
          console.error('Failed to parse customer event:', err);
        }
      });

      eventSource.addEventListener('ping', () => {
        // Keep-alive ping received
      });

      eventSource.onerror = (err) => {
        console.error('SSE error:', err);
        eventSource.close();
        
        // Reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };
    } catch (err) {
      console.error('Failed to create EventSource:', err);
    }
  }, [enabled, onCustomerOnline, onCustomerOffline, onAnyEvent]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { connect, disconnect };
}
