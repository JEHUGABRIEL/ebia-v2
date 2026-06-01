import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { getMyArtistProfile } from "../lib/api";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, authReady } = useApp();
  if (!authReady) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 uppercase tracking-widest text-xs">Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const ArtistGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, authReady } = useApp();
  const [checking, setChecking] = useState(true);
  const [hasArtistProfile, setHasArtistProfile] = useState(false);

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    if (user.role === "artist" || user.role === "admin") { setChecking(false); setHasArtistProfile(true); return; }
    getMyArtistProfile()
      .then(() => setHasArtistProfile(true))
      .catch(() => setHasArtistProfile(false))
      .finally(() => setChecking(false));
  }, [user]);

  if (!authReady || checking) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 uppercase tracking-widest text-xs">Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!hasArtistProfile) return <Navigate to="/me" replace />;
  return <>{children}</>;
};
