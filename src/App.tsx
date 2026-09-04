import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { QueueProvider } from "./context/QueueContext";
import { AuthGuard, ArtistGuard } from "./components/Guards";
import Navbar from "./components/Navbar";
import Player from "./components/Player";
import LoginModal from "./components/LoginModal";
import MessageFab from "./components/MessageFab";
import Footer from "./components/Footer";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

// Route-level code splitting: each page is fetched on demand
const Landing = lazy(() => import("./pages/Landing"));
const Explore = lazy(() => import("./pages/Explore"));
const ArtistProfile = lazy(() => import("./pages/ArtistProfile"));
const Concerts = lazy(() => import("./pages/Concerts"));
const ConcertDetail = lazy(() => import("./pages/ConcertDetail"));
const Radio = lazy(() => import("./pages/Radio"));
const RadioDetail = lazy(() => import("./pages/RadioDetail"));
const Recognize = lazy(() => import("./pages/Recognize"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ListenerDashboard = lazy(() => import("./pages/ListenerDashboard"));
const ArtistDashboard = lazy(() => import("./pages/ArtistDashboard"));
const Messaging = lazy(() => import("./pages/Messaging"));
const Playlists = lazy(() => import("./pages/Playlists"));
const PlaylistDetail = lazy(() => import("./pages/PlaylistDetail"));
const PlayHistoryPage = lazy(() => import("./pages/PlayHistory"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));

function RouteFallback() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)" }}>Chargement…</div>
    </div>
  );
}

const NO_CHROME = ["/login", "/me", "/artist-dashboard", "/forgot-password", "/reset-password"];
const ROUTE_STORAGE_KEY = "ebia_last_route";

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const hideChrome = NO_CHROME.some(p => location.pathname.startsWith(p));

  // Persister la route pour la reprise après mise en fond
  useEffect(() => {
    localStorage.setItem(ROUTE_STORAGE_KEY, location.pathname + location.search);
  }, [location]);

  // Bouton retour Android : revenir en arrière au lieu de quitter
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = CapApp.addListener("backButton", () => {
      if (location.pathname !== "/") {
        navigate(-1);
      } else {
        CapApp.exitApp();
      }
    });

    return () => {
      listener.then(h => h.remove());
    };
  }, [location.pathname, navigate]);

  // Restaurer la dernière route au démarrage (si l'app a été tuée)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const saved = localStorage.getItem(ROUTE_STORAGE_KEY);
    if (saved && saved !== "/" && location.pathname === "/") {
      navigate(saved, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {!hideChrome && <Navbar />}
      <div key={location.pathname} className="page-transition">
        <Suspense fallback={<RouteFallback />}>
          <Routes location={location}>
            <Route path="/" element={<Landing />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/artist/:slug" element={<ArtistProfile />} />
            <Route path="/concerts" element={<Concerts />} />
            <Route path="/concerts/:id" element={<ConcertDetail />} />
            <Route path="/radio" element={<Radio />} />
            <Route path="/radio/:id" element={<RadioDetail />} />
            <Route path="/recognize" element={<Recognize />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/me" element={<AuthGuard><ListenerDashboard /></AuthGuard>} />
            <Route path="/artist-dashboard" element={<ArtistGuard><ArtistDashboard /></ArtistGuard>} />
            <Route path="/messages" element={<ArtistGuard><Messaging /></ArtistGuard>} />
            <Route path="/playlists" element={<AuthGuard><Playlists /></AuthGuard>} />
            <Route path="/playlists/:id" element={<AuthGuard><PlaylistDetail /></AuthGuard>} />
            <Route path="/play-history" element={<AuthGuard><PlayHistoryPage /></AuthGuard>} />
            <Route path="/admin" element={<AuthGuard><AdminDashboard /></AuthGuard>} />
            <Route path="/admin/reports" element={<AuthGuard><Reports /></AuthGuard>} />
            <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
          </Routes>
        </Suspense>
      </div>
      {!hideChrome && <Footer />}
      <Player />
      <MessageFab />
      <LoginModal />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <QueueProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </QueueProvider>
    </AppProvider>
  );
}
