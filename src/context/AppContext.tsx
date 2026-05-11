import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import keycloak, { initKeycloak, getCurrentUser } from "../lib/keycloak";

export type EbiaUser = NonNullable<ReturnType<typeof getCurrentUser>>;
export interface Track { id: string; title: string; artist: string; artistId?: string; audioUrl: string; coverUrl?: string; duration?: number; }

interface AppCtx {
  user: EbiaUser | null; authReady: boolean;
  login: () => void; logout: () => void; register: (role: "listener" | "artist") => void;
  currentTrack: Track | null; isPlaying: boolean; queue: Track[];
  queueIndex: number;
  isShuffle: boolean; toggleShuffle: () => void;
  playTrack: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void; nextTrack: () => void; prevTrack: () => void;
  showLoginModal: boolean; setShowLoginModal: (v: boolean) => void;
}

const Ctx = createContext<AppCtx | null>(null);

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
    initKeycloak().then(() => { setUser(getCurrentUser()); setAuthReady(true); }).catch(() => setAuthReady(true));
    keycloak.onAuthSuccess = () => setUser(getCurrentUser());
    keycloak.onAuthLogout = () => setUser(null);
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
    if (shuffle) {
      do { next = Math.floor(Math.random() * q.length); } while (q.length > 1 && next === idx);
    } else {
      next = (idx + 1) % q.length;
    }
    setQueueIndex(next);
    setCurrentTrack(q[next]);
  };

  const playTrack = (track: Track, q?: Track[]) => {
    if (q) { setQueue(q); setQueueIndex(q.findIndex(t => t.id === track.id)); }
    setCurrentTrack(track);
    // Comptabiliser l'écoute en base (fire & forget)
    fetch(`http://localhost/api/v1/tracks/${track.id}/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offline: false }),
    }).catch(() => {});
  };

  const togglePlay = () => setIsPlaying(p => !p);
  const toggleShuffle = () => setIsShuffle(s => !s);

  const nextTrack = () => nextTrackFn(queue, queueIndex, isShuffle);
  const prevTrack = () => {
    if (!queue.length) return;
    const prev = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prev);
    setCurrentTrack(queue[prev]);
  };

  const login = () => keycloak.login({ locale: "fr" });
  const logout = () => keycloak.logout({ redirectUri: window.location.origin });
  const register = (role: "listener" | "artist") =>
    keycloak.register({ locale: "fr", redirectUri: window.location.origin + (role === "artist" ? "/artist-dashboard" : "/me") });

  return (
    <Ctx.Provider value={{ user, authReady, login, logout, register, currentTrack, isPlaying, queue, queueIndex, isShuffle, toggleShuffle, playTrack, togglePlay, nextTrack, prevTrack, showLoginModal, setShowLoginModal }}>
      {children}
    </Ctx.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
};
