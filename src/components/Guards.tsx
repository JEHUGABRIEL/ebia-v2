import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, authReady } = useApp();
  if (!authReady) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 uppercase tracking-widest text-xs">Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const ArtistGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, authReady } = useApp();
  if (!authReady) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 uppercase tracking-widest text-xs">Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "artist" && user.role !== "admin") return <Navigate to="/me" replace />;
  return <>{children}</>;
};
