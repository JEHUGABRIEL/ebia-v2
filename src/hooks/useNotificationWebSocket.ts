import { useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useApp } from "../context/AppContext";

export type WebSocketNotification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  actorName: string;
  actorAvatar: string;
  entityType: string;
  entityId: string;
  entitySlug: string;
  read: boolean;
  createdAt: string;
};

type Options = {
  onNotification?: (notification: WebSocketNotification) => void;
  onUnreadCount?: (count: number) => void;
};

const BASE = import.meta.env.VITE_API_URL || "";

/**
 * Hook that connects to the STOMP WebSocket and subscribes
 * to real-time notifications for the current user.
 *
 * Falls back to no-op if the user is not authenticated.
 */
export function useNotificationWebSocket({ onNotification, onUnreadCount }: Options = {}) {
  const { user } = useApp();
  const clientRef = useRef<Client | null>(null);

  const connect = useCallback(() => {
    if (!user?.id) return;

    const token = localStorage.getItem("ebia_token");
    const wsUrl = `${BASE}/ws`;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        // Subscribe to user-specific notification topic
        client.subscribe(`/topic/notifications/${user.id}`, (message) => {
          try {
            const notification: WebSocketNotification = JSON.parse(message.body);
            onNotification?.(notification);
          } catch (err) {
            console.warn("[WS] Failed to parse notification:", err);
          }
        });

        // Subscribe to unread count updates
        client.subscribe(`/topic/notifications/${user.id}/unread-count`, (message) => {
          try {
            const data = JSON.parse(message.body);
            onUnreadCount?.(data.unread_count);
          } catch (err) {
            console.warn("[WS] Failed to parse unread count:", err);
          }
        });
      },
      onStompError: (frame) => {
        console.warn("[WS] STOMP error:", frame.headers["message"]);
      },
      onDisconnect: () => {
        console.info("[WS] Disconnected");
      },
    });

    client.activate();
    clientRef.current = client;
  }, [user?.id, onNotification, onUnreadCount]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { disconnect, reconnect: connect };
}
