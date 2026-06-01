import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { AuthGuard, ArtistGuard } from "./components/Guards";
import Navbar from "./components/Navbar";
import Player from "./components/Player";
import LoginModal from "./components/LoginModal";
import Landing from "./pages/Landing";
import Explore from "./pages/Explore";
import ArtistProfile from "./pages/ArtistProfile";
import Concerts from "./pages/Concerts";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import ListenerDashboard from "./pages/ListenerDashboard";
import Radio from "./pages/Radio";
import Recognize from "./pages/Recognize";
import ArtistDashboard from "./pages/ArtistDashboard";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

const NO_CHROME = ["/login", "/me", "/artist-dashboard"];
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
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/artist/:slug" element={<ArtistProfile />} />
          <Route path="/concerts" element={<Concerts />} />
          <Route path="/radio" element={<Radio />} />
          <Route path="/recognize" element={<Recognize />} />
          <Route path="/login" element={<Login />} />
          <Route path="/me" element={<AuthGuard><ListenerDashboard /></AuthGuard>} />
          <Route path="/artist-dashboard" element={<ArtistGuard><ArtistDashboard /></ArtistGuard>} />
        </Routes>
      </div>
      {!hideChrome && <Footer />}
      <Player />
      <LoginModal />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppProvider>
  );
}
