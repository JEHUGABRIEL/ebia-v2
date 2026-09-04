import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { getConversations } from "../lib/api";

/**
 * Floating action button (FAB) giving artists quick access to the messaging
 * page. Replaces the "Messages" link that used to live in the navbar.
 * Shows a badge with the number of conversations containing unread messages.
 */
export default function MessageFab() {
  const { user, currentTrack } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const isMessagingUser = !!user && user.role === "artist";

  // Refresh the unread badge on mount, whenever the route changes (so leaving
  // /messages updates it) and when the window regains focus.
  useEffect(() => {
    if (!isMessagingUser) return;
    let cancelled = false;

    const refresh = async () => {
      try {
        const convs = await getConversations();
        if (cancelled) return;
        setUnreadCount(
          Array.isArray(convs) ? convs.filter(c => c.unreadCount > 0).length : 0
        );
      } catch {
        if (!cancelled) setUnreadCount(0);
      }
    };

    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refresh);
    };
  }, [isMessagingUser, location.pathname]);

  // Only artists and admins can access the messaging page
  if (!isMessagingUser) return null;
  // No point showing the button while already on the messaging page
  if (location.pathname.startsWith("/messages")) return null;

  return (
    <button
      onClick={() => navigate("/messages")}
      aria-label="Messages"
      title="Messages"
      style={{
        position: "fixed",
        right: "16px",
        bottom: currentTrack ? "80px" : "24px",
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        background: "var(--amber)",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 28px rgba(232,96,26,0.45)",
        zIndex: 60,
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "scale(1.08)";
        e.currentTarget.style.boxShadow = "0 10px 32px rgba(232,96,26,0.6)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 8px 28px rgba(232,96,26,0.45)";
      }}
    >
      <MessageSquare size={24} />
      {unreadCount > 0 && (
        <span
          style={{
            position: "absolute",
            top: "-2px",
            right: "-2px",
            minWidth: "20px",
            height: "20px",
            borderRadius: "99px",
            background: "#f43f5e",
            color: "#fff",
            fontSize: "10px",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 5px",
            border: "2px solid var(--bg2)",
            lineHeight: 1,
          }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}