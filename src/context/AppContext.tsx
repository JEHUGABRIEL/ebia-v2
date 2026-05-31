import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import keycloak, { initKeycloak } from "../lib/keycloak";

export type EbiaUser = {
  id: string; email: string; displayName: string;
  avatarUrl?: string; role: "listener" | "artist" | "admin" | null;
};
export interface Track {
  id: string; title: string; artist: string; artistId?: string;
  audioUrl: string; coverUrl?: string; duration?: number;
}

interface AppCtx {
  user: EbiaUser | null; authReady: boolean;
  login: () => void; logout: () => void;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  register: (role: "listener" | "artist") => void;
  currentTrack: Track | null; isPlaying: boolean; queue: Track[];
  queueIndex: number; isShuffle: boolean; toggleShuffle: () => void;
  playTrack: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void; nextTrack: () => void; prevTrack: () => void;
  showLoginModal: boolean; setShowLoginModal: (v: boolean) => void;
}

const Ctx = createContext<AppCtx | null>(null);

/* Parse JWT sans vérification de signature (côté client) */
function parseJwt(token: string): EbiaUser | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const roles: string[] = payload.realm_access?.roles ?? [];
    const role = roles.includes("admin") ? "admin"
               : roles.includes("artist") ? "artist"
               : "listener";
    return {
      id: payload.sub,
      email: payload.email ?? "",
      displayName: (payload.name ?? payload.preferred_username ?? ""),
      avatarUrl: payload.picture,
      role,
    };
  } catch { return null; }
}

function getStoredToken(): string | null {
  return sessionStorage.getItem("ebia_token");
}

export function getAuthHeader(): Record<string, string> {
  const t = getStoredToken() || keycloak.token;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<EbiaUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    /* 1. Token stocké après login via notre formulaire */
    const stored = getStoredToken();
    if (stored) {
      const u = parseJwt(stored);
      if (u) { setUser(u); setAuthReady(true); return; }
    }
    /* 2. Fallback Keycloak check-sso silencieux */
    initKeycloak()
      .then(() => {
        if (keycloak.token) {
          const u = parseJwt(keycloak.token);
          if (u) setUser(u);
        }
        setAuthReady(true);
      })
      .catch(() => setAuthReady(true));

    keycloak.onAuthSuccess = () => {
      if (keycloak.token) {
        const u = parseJwt(keycloak.token);
        if (u) setUser(u);
      }
    };
    keycloak.onAuthLogout = () => { setUser(null); sessionStorage.removeItem("ebia_token"); };
    keycloak.onTokenExpired = () => keycloak.updateToken(60);
  }, []);

  useEffect(() => {
    if (!currentTrack) return;
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    audio.src = currentTrack.audioUrl;
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    audio.onended = () => nextTrackFn(queue, queueIndex, isShuffle);
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.play().catch(() => {}); else audio.pause();
  }, [isPlaying]);

  const nextTrackFn = (q: Track[], idx: number, shuffle: boolean) => {
    if (!q.length) return;
    let next: number;
    if (shuffle) { do { next = Math.floor(Math.random() * q.length); } while (q.length > 1 && next === idx); }
    else next = (idx + 1) % q.length;
    setQueueIndex(next); setCurrentTrack(q[next]);
  };

  /* Login via notre formulaire — pas de redirect Keycloak */
  const loginWithCredentials = async (email: string, password: string) => {
    const res = await fetch("https://api-gateway-production-1c84.up.railway.app/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json() as { access_token?: string; refresh_token?: string; error?: string };
    if (!res.ok) throw new Error(data.error || "Email ou mot de passe incorrect");

    sessionStorage.setItem("ebia_token", data.access_token!);
    if (data.refresh_token) sessionStorage.setItem("ebia_refresh", data.refresh_token);

    const u = parseJwt(data.access_token!);
    if (u) setUser(u);
    else throw new Error("Token invalide");
  };

  const playTrack = (track: Track, q?: Track[]) => {
    if (q) { setQueue(q); setQueueIndex(q.findIndex(t => t.id === track.id)); }
    setCurrentTrack(track);
    fetch(`https://api-gateway-production-1c84.up.railway.app/api/v1/tracks/${track.id}/play`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offline: false }),
    }).catch(() => {});
  };

  const togglePlay = () => setIsPlaying(p => !p);
  const toggleShuffle = () => setIsShuffle(s => !s);
  const nextTrack = () => nextTrackFn(queue, queueIndex, isShuffle);
  const prevTrack = () => {
    if (!queue.length) return;
    const prev = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prev); setCurrentTrack(queue[prev]);
  };

  const login = () => keycloak.login({ locale: "fr" });
  const logout = () => {
    sessionStorage.removeItem("ebia_token");
    sessionStorage.removeItem("ebia_refresh");
    setUser(null);
    window.location.replace("/");
  };
  const register = (role: "listener" | "artist") =>
    keycloak.register({ locale: "fr", redirectUri: window.location.origin + (role === "artist" ? "/artist-dashboard" : "/me") });

  return (
    <Ctx.Provider value={{ user, authReady, login, logout, loginWithCredentials, register, currentTrack, isPlaying, queue, queueIndex, isShuffle, toggleShuffle, playTrack, togglePlay, nextTrack, prevTrack, showLoginModal, setShowLoginModal }}>
      {children}
    </Ctx.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
};
