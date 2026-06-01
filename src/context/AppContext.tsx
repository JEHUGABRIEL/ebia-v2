import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import keycloak, { initKeycloak } from "../lib/keycloak";
import {
  saveOfflineTrack, getOfflineTrack, getAllOfflineTracks,
  deleteOfflineTrack, purgeExpiredTracks,
  type OfflineTrack, type OfflineTrackInput,
} from "../lib/offline";

const BASE = "https://api-gateway-production-1c84.up.railway.app";

export type EbiaUser = {
  id: string; email: string; displayName: string;
  avatarUrl?: string; role: "listener" | "artist" | "admin" | null;
};
export interface Track {
  id: string; title: string; artist: string; artistId?: string;
  audioUrl: string; coverUrl?: string; duration?: number;
  playsCount?: number; likesCount?: number;
}

export type RepeatMode = "none" | "all" | "one";
export type NetworkQuality = "high" | "low" | "offline";

/* Type utilisé pour déclencher un téléchargement */
export interface DownloadableTrack {
  id: string; title: string; artist: string;
  genre: string; duration_s: number; coverUrl?: string;
}

interface AppCtx {
  /* Auth */
  user: EbiaUser | null; authReady: boolean;
  login: () => void; logout: () => void;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  register: (role: "listener" | "artist") => void;
  updateUser: (updates: Partial<EbiaUser>) => void;
  /* Player */
  currentTrack: Track | null; isPlaying: boolean; queue: Track[];
  queueIndex: number; isShuffle: boolean; toggleShuffle: () => void;
  repeatMode: RepeatMode; toggleRepeat: () => void;
  playTrack: (track: Track, queue?: Track[]) => void;
  addToQueue: (track: Track) => void;
  togglePlay: () => void; nextTrack: () => void; prevTrack: () => void;
  stopTrack: () => void;
  audioEl: React.RefObject<HTMLAudioElement | null>;
  showLoginModal: boolean; setShowLoginModal: (v: boolean) => void;
  /* Réseau & buffering */
  networkQuality: NetworkQuality;
  isBuffering: boolean;
  isOfflinePlaying: boolean;
  /* Hors-ligne */
  downloadedIds: Set<string>;
  downloadingIds: Set<string>;
  downloadProgress: Record<string, number>;
  downloadTrack: (track: DownloadableTrack) => Promise<void>;
  removeDownload: (trackId: string) => Promise<void>;
  getDownloadedTracks: () => Promise<OfflineTrack[]>;
}

const Ctx = createContext<AppCtx | null>(null);

function parseJwt(token: string): EbiaUser | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const roles: string[] = payload.realm_access?.roles ?? [];
    const role = roles.includes("admin") ? "admin"
               : roles.includes("artist") ? "artist"
               : "listener";
    return {
      id: payload.sub, email: payload.email ?? "",
      displayName: (payload.name ?? payload.preferred_username ?? ""),
      avatarUrl: payload.picture, role,
    };
  } catch { return null; }
}

function getStoredToken(): string | null {
  return localStorage.getItem("ebia_token");
}

export function getAuthHeader(): Record<string, string> {
  const t = getStoredToken() || keycloak.token;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  /* ── Auth ── */
  const [user, setUser] = useState<EbiaUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  /* ── Player ── */
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("none");
  const repeatRef = useRef<RepeatMode>("none");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null); // blob URL actif → à révoquer

  /* ── Réseau ── */
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>("high");
  const [isBuffering, setIsBuffering] = useState(false);
  const [isOfflinePlaying, setIsOfflinePlaying] = useState(false);

  /* ── Hors-ligne ── */
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});

  /* ── Auth init ── */
  useEffect(() => {
    const stored = getStoredToken();
    if (stored) {
      const u = parseJwt(stored);
      if (u) { setUser(u); setAuthReady(true); return; }
    }
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
    keycloak.onAuthLogout = () => { setUser(null); localStorage.removeItem("ebia_token"); };
    keycloak.onTokenExpired = () => keycloak.updateToken(60);
  }, []);

  /* ── Qualité réseau ── */
  useEffect(() => {
    const update = () => {
      if (!navigator.onLine) { setNetworkQuality("offline"); return; }
      const conn = (navigator as any).connection;
      if (conn) {
        const t: string = conn.effectiveType ?? "4g";
        setNetworkQuality(t === "4g" ? "high" : "low");
      } else {
        setNetworkQuality("high");
      }
    };
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const conn = (navigator as any).connection;
    if (conn) conn.addEventListener("change", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      if (conn) conn.removeEventListener("change", update);
    };
  }, []);

  /* ── Hors-ligne : purge au démarrage + chargement des IDs ── */
  useEffect(() => {
    purgeExpiredTracks().catch(() => {});
    getAllOfflineTracks()
      .then(tracks => setDownloadedIds(new Set(tracks.map(t => t.id))))
      .catch(() => {});
  }, []);

  /* ── Lecture d'un nouveau morceau ── */
  useEffect(() => {
    if (!currentTrack) return;
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    const trackId = currentTrack.id;
    const fallbackUrl = currentTrack.audioUrl;
    let retrying = false;
    let cancelled = false;

    /* Libère l'ancien blob URL */
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    const loadAndPlay = async (startTime = 0) => {
      /* 1. Vérifier le cache hors-ligne */
      const offline = await getOfflineTrack(trackId).catch(() => null);
      if (cancelled) return;

      if (offline) {
        const blobUrl = URL.createObjectURL(offline.audioBlob);
        blobUrlRef.current = blobUrl;
        audio.src = blobUrl;
        setIsOfflinePlaying(true);
      } else {
        setIsOfflinePlaying(false);
        /* 2. Récupérer l'URL pré-signée depuis le backend */
        try {
          const r = await fetch(`${BASE}/api/v1/tracks/${trackId}/stream`);
          const data = await r.json() as { url?: string };
          if (cancelled) return;
          audio.src = data.url || fallbackUrl;
        } catch {
          if (cancelled) return;
          audio.src = fallbackUrl;
        }
      }

      if (startTime > 0) audio.currentTime = startTime;
      await audio.play();
      if (!cancelled) setIsPlaying(true);
    };

    loadAndPlay().catch(() => { if (!cancelled) setIsPlaying(false); });

    /* ── Événements réseau ── */
    audio.onwaiting  = () => setIsBuffering(true);
    audio.onplaying  = () => { setIsBuffering(false); };
    audio.oncanplay  = () => setIsBuffering(false);

    /* ── Récupération sur coupure réseau ── */
    audio.onerror = () => {
      const err = audio.error;
      if (!retrying && err && err.code === MediaError.MEDIA_ERR_NETWORK) {
        retrying = true;
        const savedTime = audio.currentTime;
        loadAndPlay(savedTime).catch(() => { if (!cancelled) setIsPlaying(false); });
      } else {
        if (!cancelled) setIsPlaying(false);
      }
    };

    audio.onended = () => {
      const mode = repeatRef.current;
      if (mode === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        nextTrackFn(queue, queueIndex, isShuffle, mode === "all");
      }
    };

    return () => {
      cancelled = true;
      audio.onerror  = null;
      audio.onwaiting = null;
      audio.onplaying = null;
      audio.oncanplay = null;
    };
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.play().catch(() => {}); else audio.pause();
  }, [isPlaying]);

  /* ── Logique de navigation dans la file ── */
  const nextTrackFn = (q: Track[], idx: number, shuffle: boolean, wrap = true) => {
    if (!q.length) return;
    if (!wrap && !shuffle && idx >= q.length - 1) { setIsPlaying(false); return; }
    let next: number;
    if (shuffle) { do { next = Math.floor(Math.random() * q.length); } while (q.length > 1 && next === idx); }
    else next = (idx + 1) % q.length;
    setQueueIndex(next); setCurrentTrack(q[next]);
  };

  /* ── Auth ── */
  const loginWithCredentials = async (email: string, password: string) => {
    const res = await fetch(`${BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json() as { access_token?: string; refresh_token?: string; error?: string };
    if (!res.ok) throw new Error(data.error || "Email ou mot de passe incorrect");
    localStorage.setItem("ebia_token", data.access_token!);
    if (data.refresh_token) localStorage.setItem("ebia_refresh", data.refresh_token);
    const u = parseJwt(data.access_token!);
    if (u) setUser(u); else throw new Error("Token invalide");
  };

  const updateUser = (updates: Partial<EbiaUser>) => setUser(u => u ? { ...u, ...updates } : u);

  /* ── Player ── */
  const playTrack = (track: Track, q?: Track[]) => {
    if (q) { setQueue(q); setQueueIndex(q.findIndex(t => t.id === track.id)); }
    setIsPlaying(true);
    setCurrentTrack(track);
    fetch(`${BASE}/api/v1/tracks/${track.id}/play`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offline: false }),
    }).catch(() => {});
  };

  const addToQueue = (track: Track) => {
    setQueue(q => {
      const next = [...q];
      next.splice(queueIndex + 1, 0, track);
      return next;
    });
  };

  const stopTrack = () => {
    audioRef.current?.pause();
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
    setCurrentTrack(null); setIsPlaying(false); setQueue([]); setQueueIndex(0);
    setIsOfflinePlaying(false); setIsBuffering(false);
  };

  const togglePlay    = () => setIsPlaying(p => !p);
  const toggleShuffle = () => setIsShuffle(s => !s);
  const toggleRepeat  = () => setRepeatMode(m => {
    const next: RepeatMode = m === "none" ? "all" : m === "all" ? "one" : "none";
    repeatRef.current = next; return next;
  });
  const nextTrack = () => nextTrackFn(queue, queueIndex, isShuffle, repeatMode === "all");
  const prevTrack = () => {
    if (!queue.length) return;
    const prev = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prev); setCurrentTrack(queue[prev]);
  };

  /* ── Téléchargement hors-ligne ── */
  const downloadTrack = async (track: DownloadableTrack) => {
    if (downloadingIds.has(track.id)) return;
    setDownloadingIds(prev => new Set(prev).add(track.id));
    setDownloadProgress(prev => ({ ...prev, [track.id]: 0 }));

    try {
      /* Récupérer l'URL pré-signée */
      const r = await fetch(`${BASE}/api/v1/tracks/${track.id}/stream`);
      const data = await r.json() as { url?: string };
      if (!data.url) throw new Error("URL de stream introuvable");

      /* Télécharger le fichier audio avec suivi de progression */
      const resp = await fetch(data.url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const contentLength = Number(resp.headers.get("Content-Length") || 0);
      const reader = resp.body!.getReader();
      const chunks: Uint8Array<ArrayBuffer>[] = [];
      let received = 0;
      let lastPct = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (contentLength) {
          const pct = Math.round((received / contentLength) * 100);
          /* Mise à jour tous les 5% pour limiter les re-rendus */
          if (pct - lastPct >= 5) {
            lastPct = pct;
            setDownloadProgress(prev => ({ ...prev, [track.id]: pct }));
          }
        }
      }

      const audioBlob = new Blob(chunks, { type: "audio/mpeg" });
      const input: OfflineTrackInput = {
        id: track.id, title: track.title, artist: track.artist,
        genre: track.genre, duration_s: track.duration_s,
        coverUrl: track.coverUrl, audioBlob,
      };
      await saveOfflineTrack(input);
      setDownloadedIds(prev => new Set(prev).add(track.id));
    } finally {
      setDownloadingIds(prev => { const s = new Set(prev); s.delete(track.id); return s; });
      setDownloadProgress(prev => { const p = { ...prev }; delete p[track.id]; return p; });
    }
  };

  const removeDownload = async (trackId: string) => {
    await deleteOfflineTrack(trackId);
    setDownloadedIds(prev => { const s = new Set(prev); s.delete(trackId); return s; });
  };

  const getDownloadedTracks = () => getAllOfflineTracks();

  /* ── Keycloak helpers (non utilisés directement mais gardés pour compatibilité) ── */
  const login    = () => keycloak.login({ locale: "fr" });
  const logout   = () => {
    localStorage.removeItem("ebia_token");
    localStorage.removeItem("ebia_refresh");
    setUser(null);
    window.location.replace("/");
  };
  const register = (role: "listener" | "artist") =>
    keycloak.register({ locale: "fr", redirectUri: window.location.origin + (role === "artist" ? "/artist-dashboard" : "/me") });

  return (
    <Ctx.Provider value={{
      user, authReady, login, logout, loginWithCredentials, register, updateUser,
      currentTrack, isPlaying, queue, queueIndex, isShuffle, toggleShuffle,
      repeatMode, toggleRepeat,
      playTrack, addToQueue, togglePlay, nextTrack, prevTrack, stopTrack,
      audioEl: audioRef,
      showLoginModal, setShowLoginModal,
      networkQuality, isBuffering, isOfflinePlaying,
      downloadedIds, downloadingIds, downloadProgress,
      downloadTrack, removeDownload, getDownloadedTracks,
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
};
