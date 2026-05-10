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

function AppContent() {
  const location = useLocation();
  const hideNav = location.pathname === "/login";
  return (
    <>
      {!hideNav && <Navbar />}
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/artist/:slug" element={<ArtistProfile />} />
          <Route path="/concerts" element={<Concerts />} />
          <Route path="/login" element={<Login />} />
          <Route path="/me" element={<AuthGuard><ListenerDashboard /></AuthGuard>} />
          <Route path="/artist-dashboard" element={<ArtistGuard><ArtistDashboard /></ArtistGuard>} />
        </Routes>
      {!hideNav && <Footer />}
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
