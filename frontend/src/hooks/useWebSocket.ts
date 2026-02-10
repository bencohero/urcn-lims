import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

interface WebSocketMessage {
  type: string;
  payload: unknown;
}

interface UseWebSocketOptions {
  url: string;
  enabled?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onMessage?: (data: WebSocketMessage) => void;
}

export function useWebSocket({
  url,
  enabled = true,
  reconnectAttempts = 5,
  reconnectInterval = 3000,
  onMessage,
}: UseWebSocketOptions) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);

  const connect = useCallback(() => {
    if (!enabled || !accessToken) return;

    try {
      const wsUrl = `${url}?token=${accessToken}`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setIsConnected(true);
        reconnectCount.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as WebSocketMessage;
          setLastMessage(data);
          onMessage?.(data);
        } catch {
          // Ignore parse errors
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);

        if (reconnectCount.current < reconnectAttempts) {
          reconnectTimer.current = setTimeout(() => {
            reconnectCount.current++;
            connect();
          }, reconnectInterval);
        }
      };

      ws.current.onerror = () => {
        ws.current?.close();
      };
    } catch {
      // Connection failed
    }
  }, [url, accessToken, enabled, reconnectAttempts, reconnectInterval, onMessage]);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    reconnectCount.current = reconnectAttempts; // Prevent reconnect
    ws.current?.close();
  }, [reconnectAttempts]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { isConnected, lastMessage, sendMessage, disconnect };
}
