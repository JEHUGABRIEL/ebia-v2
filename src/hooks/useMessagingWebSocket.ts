import { useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useApp } from "../context/AppContext";

const BASE = import.meta.env.VITE_API_URL || "";

export type TypingEvent = {
  conversationId: string;
  userId: string;
  typing: boolean;
  timestamp: string;
};

export type ReadReceiptEvent = {
  conversationId: string;
  readBy: string;
  readAt: string;
};

export type ReactionEvent = {
  messageId: string;
  userId: string;
  emoji: string;
  added: boolean;
  reactions: { id: string; emoji: string; userId: string }[];
};

type Options = {
  conversationId?: string | null;
  onTyping?: (event: TypingEvent) => void;
  onReadReceipt?: (event: ReadReceiptEvent) => void;
  onNewMessage?: (message: unknown) => void;
  onReaction?: (event: ReactionEvent) => void;
};

/**
 * Hook that manages the STOMP WebSocket connection for a specific conversation.
 * Handles typing indicators, read receipts, new messages, and reactions.
 */
export function useMessagingWebSocket({
  conversationId,
  onTyping,
  onReadReceipt,
  onNewMessage,
  onReaction,
}: Options = {}) {
  const { user } = useApp();
  const clientRef = useRef<Client | null>(null);
  const convSubRef = useRef<string | null>(null);
  const typingSubRef = useRef<string | null>(null);
  const readSubRef = useRef<string | null>(null);
  const reactionSubRef = useRef<string | null>(null);

  // Stable callback refs to avoid reconnecting on every render
  const onTypingRef = useRef(onTyping);
  onTypingRef.current = onTyping;
  const onReadReceiptRef = useRef(onReadReceipt);
  onReadReceiptRef.current = onReadReceipt;
  const onNewMessageRef = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;
  const onReactionRef = useRef(onReaction);
  onReactionRef.current = onReaction;

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
        // Global notification subscription (reuses existing logic)
        client.subscribe(`/topic/notifications/${user.id}`, () => {});
      },
      onStompError: (frame) => {
        console.warn("[MessagingWS] STOMP error:", frame.headers["message"]);
      },
    });

    client.activate();
    clientRef.current = client;
  }, [user?.id]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
  }, []);

  // Connect automatically once the user is authenticated
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Subscribe to conversation-specific topics when conversationId changes
  useEffect(() => {
    const client = clientRef.current;
    if (!client || !conversationId) return;

    // Wait for connection to be ready
    const subscribe = () => {
      // Unsubscribe from previous conversation
      if (convSubRef.current) {
        client.unsubscribe(convSubRef.current);
        convSubRef.current = null;
      }
      if (typingSubRef.current) {
        client.unsubscribe(typingSubRef.current);
        typingSubRef.current = null;
      }
      if (readSubRef.current) {
        client.unsubscribe(readSubRef.current);
        readSubRef.current = null;
      }
      if (reactionSubRef.current) {
        client.unsubscribe(reactionSubRef.current);
        reactionSubRef.current = null;
      }

      // Subscribe to new messages in this conversation
      convSubRef.current = client.subscribe(
        `/topic/messages/${conversationId}`,
        (message) => {
          try {
            const data = JSON.parse(message.body);
            onNewMessageRef.current?.(data);
          } catch (err) {
            console.warn("[MessagingWS] Failed to parse message:", err);
          }
        }
      )?.id || null;

      // Subscribe to typing indicators
      typingSubRef.current = client.subscribe(
        `/topic/messages/${conversationId}/typing`,
        (message) => {
          try {
            const event: TypingEvent = JSON.parse(message.body);
            // Ignore own typing events
            if (event.userId !== user?.id) {
              onTypingRef.current?.(event);
            }
          } catch (err) {
            console.warn("[MessagingWS] Failed to parse typing event:", err);
          }
        }
      )?.id || null;

      // Subscribe to read receipts
      readSubRef.current = client.subscribe(
        `/topic/messages/${conversationId}/read`,
        (message) => {
          try {
            const event: ReadReceiptEvent = JSON.parse(message.body);
            onReadReceiptRef.current?.(event);
          } catch (err) {
            console.warn("[MessagingWS] Failed to parse read receipt:", err);
          }
        }
      )?.id || null;

      // Subscribe to reaction events
      reactionSubRef.current = client.subscribe(
        `/topic/messages/${conversationId}/reactions`,
        (message) => {
          try {
            const event: ReactionEvent = JSON.parse(message.body);
            onReactionRef.current?.(event);
          } catch (err) {
            console.warn("[MessagingWS] Failed to parse reaction event:", err);
          }
        }
      )?.id || null;
    };

    if (client.connected) {
      subscribe();
    } else {
      // Queue the subscription until the connection is established, chaining
      // with (instead of replacing) the connect callback used for global
      // subscriptions.
      const previousOnConnect = client.onConnect;
      client.onConnect = (frame) => {
        previousOnConnect?.(frame);
        subscribe();
      };
      return () => {
        client.onConnect = previousOnConnect;
      };
    }
  }, [conversationId, user?.id]);

  // Send typing event
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      const client = clientRef.current;
      if (!client || !conversationId || !client.connected) return;
      client.publish({
        destination: `/app/conversations/${conversationId}/typing`,
        body: JSON.stringify({ typing: isTyping }),
      });
    },
    [conversationId]
  );

  return { connect, disconnect, reconnect: connect, sendTyping };
}
