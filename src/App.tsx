import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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
import ArtistDashboard from "./pages/ArtistDashboard";

const NO_CHROME = ["/login", "/me", "/artist-dashboard"];

function AppContent() {
  const location = useLocation();
  const hideChrome = NO_CHROME.some(p => location.pathname.startsWith(p));
  return (
    <>
      {!hideChrome && <Navbar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/artist/:slug" element={<ArtistProfile />} />
        <Route path="/concerts" element={<Concerts />} />
        <Route path="/login" element={<Login />} />
        <Route path="/me" element={<AuthGuard><ListenerDashboard /></AuthGuard>} />
        <Route path="/artist-dashboard" element={<ArtistGuard><ArtistDashboard /></ArtistGuard>} />
      </Routes>
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
