import { useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useApp } from "../context/AppContext";

const BASE = import.meta.env.VITE_API_URL || "";

export type CallSignalKind = "offer" | "answer" | "ice" | "hangup";

export type CallSignalEvent = {
  kind: CallSignalKind;
  fromUserId: string;
  callId: string;
  conversationId?: string;
  type?: "audio" | "video";
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  reason?: string;
};

type Options = {
  onSignal?: (event: CallSignalEvent) => void;
};

/**
 * Connexion WebSocket STOMP dédiée au signaling d'appel WebRTC (offre / réponse
 * / ICE / raccroché). Séparée de useMessagingWebSocket (voir plan) pour rester
 * montée globalement — un appel entrant doit pouvoir arriver depuis n'importe
 * quelle page, pas seulement /messages.
 *
 * S'abonne à /topic/calls/{sonPropreUserId} dès que l'utilisateur est connu et
 * publie vers /app/calls/{targetUserId}/{kind}.
 */
export function useCallSignaling({ onSignal }: Options = {}) {
  const { user } = useApp();
  const clientRef = useRef<Client | null>(null);

  const onSignalRef = useRef(onSignal);
  onSignalRef.current = onSignal;

  useEffect(() => {
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
        client.subscribe(`/topic/calls/${user.id}`, (message) => {
          try {
            const event: CallSignalEvent = JSON.parse(message.body);
            onSignalRef.current?.(event);
          } catch (err) {
            console.warn("[CallSignaling] Failed to parse signal:", err);
          }
        });
      },
      onStompError: (frame) => {
        console.warn("[CallSignaling] STOMP error:", frame.headers["message"]);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [user?.id]);

  const send = useCallback((targetUserId: string, kind: CallSignalKind, payload: Record<string, unknown>) => {
    const client = clientRef.current;
    if (!client || !client.connected) {
      console.warn("[CallSignaling] Cannot send, not connected");
      return;
    }
    client.publish({
      destination: `/app/calls/${targetUserId}/${kind}`,
      body: JSON.stringify(payload),
    });
  }, []);

  return { send };
}
