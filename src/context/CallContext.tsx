import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";
import { useApp } from "./AppContext";
import { useCallSignaling, type CallSignalEvent } from "../hooks/useCallSignaling";
import { reportMissedCall } from "../lib/api";

export type CallType = "audio" | "video";
export type CallStatus = "idle" | "calling" | "ringing" | "connected";

export type CallPeerInfo = {
  userId: string;
  name: string;
  avatar?: string;
};

interface CallCtx {
  status: CallStatus;
  type: CallType | null;
  peer: CallPeerInfo | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  micEnabled: boolean;
  camEnabled: boolean;
  callError: string | null;
  clearCallError: () => void;
  startCall: (peer: CallPeerInfo, conversationId: string, type: CallType) => Promise<void>;
  answerCall: () => Promise<void>;
  rejectCall: () => void;
  hangUp: () => void;
  toggleMic: () => void;
  toggleCam: () => void;
}

/** Message d'erreur lisible pour un échec d'accès micro/caméra. */
function mediaErrorMessage(e: unknown): string {
  if (e instanceof DOMException) {
    if (e.name === "NotAllowedError") return "Accès au micro/caméra refusé. Vérifiez les autorisations de votre navigateur.";
    if (e.name === "NotFoundError") return "Aucun micro ou caméra détecté sur cet appareil.";
    if (e.name === "NotReadableError") return "Le micro ou la caméra est déjà utilisé par une autre application.";
  }
  return "Impossible de démarrer l'appel (micro/caméra indisponible).";
}

const CallContext = createContext<CallCtx | undefined>(undefined);

const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];
const RING_TIMEOUT_MS = 30_000;

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useApp();

  const [status, setStatus] = useState<CallStatus>("idle");
  const [type, setType] = useState<CallType | null>(null);
  const [peer, setPeer] = useState<CallPeerInfo | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [callError, setCallError] = useState<string | null>(null);
  const clearCallError = useCallback(() => setCallError(null), []);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const callIdRef = useRef<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const pendingOfferRef = useRef<CallSignalEvent | null>(null);
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }
    pcRef.current?.close();
    pcRef.current = null;
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setStatus("idle");
    setType(null);
    setPeer(null);
    setMicEnabled(true);
    setCamEnabled(true);
    callIdRef.current = null;
    conversationIdRef.current = null;
    pendingOfferRef.current = null;
  }, [localStream]);

  const createPeerConnection = useCallback((targetUserId: string, send: ReturnType<typeof useCallSignaling>["send"]) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (e) => {
      if (e.candidate && callIdRef.current) {
        send(targetUserId, "ice", { callId: callIdRef.current, candidate: e.candidate.toJSON() });
      }
    };
    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setStatus("connected");
      if (pc.connectionState === "failed" || pc.connectionState === "closed") cleanup();
    };
    pcRef.current = pc;
    return pc;
  }, [cleanup]);

  const handleSignal = useCallback((event: CallSignalEvent) => {
    switch (event.kind) {
      case "offer": {
        // Un seul appel à la fois : on ignore une offre entrante si déjà en appel.
        if (status !== "idle") return;
        callIdRef.current = event.callId;
        conversationIdRef.current = event.conversationId ?? null;
        pendingOfferRef.current = event;
        setType(event.type ?? "audio");
        setPeer({
          userId: event.fromUserId,
          name: (event as unknown as { callerName?: string }).callerName || "Artiste",
          avatar: (event as unknown as { callerAvatar?: string }).callerAvatar,
        });
        setStatus("ringing");
        break;
      }
      case "answer": {
        if (event.callId !== callIdRef.current || !pcRef.current || !event.sdp) return;
        if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }
        void pcRef.current.setRemoteDescription(new RTCSessionDescription(event.sdp));
        break;
      }
      case "ice": {
        if (event.callId !== callIdRef.current || !pcRef.current || !event.candidate) return;
        void pcRef.current.addIceCandidate(new RTCIceCandidate(event.candidate));
        break;
      }
      case "hangup": {
        if (event.callId !== callIdRef.current) return;
        cleanup();
        break;
      }
    }
  }, [status, cleanup]);

  const { send } = useCallSignaling({ onSignal: handleSignal });

  const startCall = useCallback(async (targetPeer: CallPeerInfo, conversationId: string, callType: CallType) => {
    if (status !== "idle" || !user) return;
    const callId = crypto.randomUUID();
    callIdRef.current = callId;
    conversationIdRef.current = conversationId;
    setType(callType);
    setPeer(targetPeer);
    setStatus("calling");
    setCallError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === "video" });
      setLocalStream(stream);

      const pc = createPeerConnection(targetPeer.userId, send);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      send(targetPeer.userId, "offer", {
        callId,
        conversationId,
        type: callType,
        sdp: offer,
        callerName: user.displayName,
        callerAvatar: user.avatarUrl,
      });

      ringTimeoutRef.current = setTimeout(() => {
        send(targetPeer.userId, "hangup", { callId, reason: "no_answer" });
        void reportMissedCall(targetPeer.userId, callType).catch(() => {});
        cleanup();
      }, RING_TIMEOUT_MS);
    } catch (e) {
      setCallError(mediaErrorMessage(e));
      cleanup();
    }
  }, [status, user, createPeerConnection, send, cleanup]);

  const answerCall = useCallback(async () => {
    const offerEvent = pendingOfferRef.current;
    if (!offerEvent || !offerEvent.sdp || !peer) return;
    setCallError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === "video" });
      setLocalStream(stream);

      const pc = createPeerConnection(peer.userId, send);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offerEvent.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      send(peer.userId, "answer", { callId: offerEvent.callId, sdp: answer });
      setStatus("connected");
    } catch (e) {
      setCallError(mediaErrorMessage(e));
      send(peer.userId, "hangup", { callId: offerEvent.callId, reason: "media_error" });
      cleanup();
    }
  }, [peer, type, createPeerConnection, send, cleanup]);

  const rejectCall = useCallback(() => {
    if (peer && callIdRef.current) {
      send(peer.userId, "hangup", { callId: callIdRef.current, reason: "rejected" });
    }
    cleanup();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peer, cleanup]);

  const hangUp = useCallback(() => {
    if (peer && callIdRef.current) {
      send(peer.userId, "hangup", { callId: callIdRef.current, reason: "ended" });
    }
    cleanup();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peer, cleanup]);

  const toggleMic = useCallback(() => {
    setMicEnabled((prev) => {
      const next = !prev;
      localStream?.getAudioTracks().forEach((t) => { t.enabled = next; });
      return next;
    });
  }, [localStream]);

  const toggleCam = useCallback(() => {
    setCamEnabled((prev) => {
      const next = !prev;
      localStream?.getVideoTracks().forEach((t) => { t.enabled = next; });
      return next;
    });
  }, [localStream]);

  // Sécurité : libère micro/caméra si le composant démonte en plein appel.
  useEffect(() => () => { localStream?.getTracks().forEach((t) => t.stop()); pcRef.current?.close(); }, [localStream]);

  return (
    <CallContext.Provider value={{
      status, type, peer, localStream, remoteStream, micEnabled, camEnabled,
      callError, clearCallError,
      startCall, answerCall, rejectCall, hangUp, toggleMic, toggleCam,
    }}>
      {children}
    </CallContext.Provider>
  );
};

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall doit être utilisé dans un CallProvider");
  return ctx;
}
