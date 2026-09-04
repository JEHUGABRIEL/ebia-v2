import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { getMyArtistProfile } from "../lib/api";
import { useTranslation } from "react-i18next";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, authReady } = useApp();
  const { t } = useTranslation();
  if (!authReady) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 uppercase tracking-widest text-xs">{t("guards.loading")}</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const ArtistGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, authReady } = useApp();
  const { t } = useTranslation();
  // Whether the JWT role already proves artist/admin access. Deriving this
  // synchronously from `user` avoids the redirect race that used to bounce
  // hard-refreshes of /artist-dashboard and /messages to /me: previously the
  // profile flag was only set by an effect that ran *after* the render where
  // `user` flipped from null -> artist, so <Navigate to="/me"> fired first.
  const isArtistRole = !!user && (user.role === "artist" || user.role === "admin");

  // For non-artist roles, an artist profile must exist to access these pages.
  const [profileVerified, setProfileVerified] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(() => !!user && !isArtistRole);

  useEffect(() => {
    if (!user) { setProfileVerified(false); setCheckingProfile(false); return; }
    if (user.role === "artist" || user.role === "admin") {
      setProfileVerified(true);
      setCheckingProfile(false);
      return;
    }
    let alive = true;
    setProfileVerified(false);
    setCheckingProfile(true);
    getMyArtistProfile()
      .then(() => { if (alive) setProfileVerified(true); })
      .catch(() => { if (alive) setProfileVerified(false); })
      .finally(() => { if (alive) setCheckingProfile(false); });
    return () => { alive = false; };
  }, [user, isArtistRole]);

  const allowed = isArtistRole || profileVerified;

  if (!authReady || checkingProfile) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 uppercase tracking-widest text-xs">{t("guards.loading")}</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowed) return <Navigate to="/me" replace />;
  return <>{children}</>;
};

export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, authReady } = useApp();
  const { t } = useTranslation();
  if (!authReady) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 uppercase tracking-widest text-xs">{t("guards.loading")}</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/me" replace />;
  return <>{children}</>;
};
