import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CheckCheck, Heart, UserPlus, Music, Smartphone, AlertTriangle, MessageSquare, X, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from "../lib/api";
import { useApp } from "../context/AppContext";
import { useNotificationWebSocket, type WebSocketNotification } from "../hooks/useNotificationWebSocket";

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  new_follower: UserPlus,
  new_like: Heart,
  new_track: Music,
  new_device: Smartphone,
  new_message: MessageSquare,
  alert: AlertTriangle,
  admin_new_artist: ShieldCheck,
  admin_new_track: ShieldCheck,
  admin_new_profile_change: ShieldCheck,
  account_approved: ShieldCheck,
  account_rejected: ShieldCheck,
  track_approved: Music,
  track_rejected: Music,
  profile_change_approved: ShieldCheck,
  profile_change_rejected: ShieldCheck,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  new_follower: "#10b981",
  new_like: "#f43f5e",
  new_message: "#3b82f6",
  new_track: "#e8601a",
  new_device: "#3b82f6",
  alert: "#f59e0b",
  admin_new_artist: "#8B5CF6",
  admin_new_track: "#8B5CF6",
  admin_new_profile_change: "#8B5CF6",
  account_approved: "#10b981",
  account_rejected: "#f43f5e",
  track_approved: "#10b981",
  track_rejected: "#f43f5e",
  profile_change_approved: "#10b981",
  profile_change_rejected: "#f43f5e",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function NotificationCenter() {
  const { user } = useApp();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Fermer le panneau quand on clique à l'extérieur
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        bellRef.current && !bellRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Charger le compteur de non-lus périodiquement (fallback)
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getUnreadNotificationCount();
      setUnreadCount(res.unread_count);
    } catch {
      // Silencieux
    }
  }, [user]);

  // WebSocket: recevoir les notifications en temps réel
  const handleWsNotification = useCallback((notif: WebSocketNotification) => {
    // Ajouter la notification en haut de la liste
    const mapped: Notification = {
      id: notif.id,
      userId: notif.userId,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      actorName: notif.actorName || undefined,
      actorAvatar: notif.actorAvatar || undefined,
      entityType: notif.entityType || undefined,
      entityId: notif.entityId || undefined,
      entitySlug: notif.entitySlug || undefined,
      read: notif.read,
      createdAt: notif.createdAt,
    };
    setNotifications((prev) => [mapped, ...prev]);
    setUnreadCount((c) => c + 1);
  }, []);

  const handleWsUnreadCount = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  // Connecter le WebSocket pour les notifications temps réel
  useNotificationWebSocket({
    onNotification: handleWsNotification,
    onUnreadCount: handleWsUnreadCount,
  });

  // Fallback: polling toutes les 30s si le WebSocket n'est pas disponible
  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  // Charger les notifications quand le panneau s'ouvre
  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    setPage(0);
    setHasMore(true);
    getNotifications(0, 20)
      .then((res) => {
        setNotifications(res.data);
        setUnreadCount(res.unread_count);
        setHasMore(res.data.length === 20);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, user]);

  const loadMore = async () => {
    const nextPage = page + 1;
    setLoading(true);
    try {
      const res = await getNotifications(nextPage, 20);
      setNotifications((prev) => [...prev, ...res.data]);
      setHasMore(res.data.length === 20);
      setPage(nextPage);
    } catch { /* Silencieux */ }
    setLoading(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* Silencieux */ }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      try {
        await markNotificationAsRead(n.id);
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch { /* Silencieux */ }
    }
    setOpen(false);
    // Naviguer vers l'entité concernée
    if (n.entityType === "admin_validation") {
      navigate(`/admin`);
    } else if (n.entityType === "conversation" && n.entityId) {
      navigate(`/messages`);
    } else if (n.entityType === "track" && n.entityId) {
      navigate(`/explore`);
    } else if (n.entityType === "artist" && n.entitySlug) {
      navigate(`/artist/${n.entitySlug}`);
    }
  };

  if (!user) return null;

  return (
    <div style={{ position: "relative" }}>
      {/* Cloche */}
      <button
        ref={bellRef}
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "relative",
          padding: "6px",
          borderRadius: "8px",
          background: open ? "rgba(232,96,26,0.12)" : "rgba(240,235,227,0.06)",
          border: "1px solid rgba(240,235,227,0.1)",
          color: open ? "var(--amber)" : "var(--muted)",
          cursor: "pointer",
          transition: "all 0.15s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.background = "rgba(240,235,227,0.1)";
            e.currentTarget.style.color = "var(--text)";
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.background = "rgba(240,235,227,0.06)";
            e.currentTarget.style.color = "var(--muted)";
          }
        }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              minWidth: "16px",
              height: "16px",
              borderRadius: "99px",
              background: "#f43f5e",
              color: "#fff",
              fontSize: "9px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              border: "2px solid var(--bg2)",
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panneau déroulant */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: "min(380px, 90vw)",
            maxHeight: "480px",
            borderRadius: "14px",
            overflow: "hidden",
            background: "var(--bg3)",
            border: "1px solid var(--border)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                {t("nav.notifications")}
              </h3>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#fff",
                    background: "#f43f5e",
                    borderRadius: "99px",
                    padding: "2px 6px",
                    lineHeight: 1.3,
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    background: "none",
                    border: "none",
                    color: "var(--amber)",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(232,96,26,0.1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "none")
                  }
                >
                  <CheckCheck size={12} />
                  Tout lire
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{
                  padding: "4px",
                  borderRadius: "6px",
                  background: "none",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--text)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--muted)")
                }
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Liste */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              maxHeight: "380px",
            }}
          >
            {notifications.length === 0 && !loading ? (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                }}
              >
                <Bell
                  size={32}
                  style={{ color: "rgba(240,235,227,0.15)", marginBottom: "10px" }}
                />
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--muted)",
                    margin: 0,
                  }}
                >
                  {t("notifications.empty")}
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = NOTIFICATION_ICONS[n.type] || Bell;
                const color = NOTIFICATION_COLORS[n.type] || "var(--muted)";
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "12px 16px",
                      background: n.read ? "transparent" : "rgba(232,96,26,0.04)",
                      border: "none",
                      borderBottom: "1px solid rgba(240,235,227,0.04)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(240,235,227,0.04)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = n.read
                        ? "transparent"
                        : "rgba(232,96,26,0.04)")
                    }
                  >
                    {/* Icône */}
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: `${color}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} style={{ color }} />
                    </div>

                    {/* Contenu */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "13px",
                            fontWeight: n.read ? 500 : 700,
                            color: "var(--text)",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {n.title}
                        </p>
                        {!n.read && (
                          <div
                            style={{
                              width: "7px",
                              height: "7px",
                              borderRadius: "50%",
                              background: "#f43f5e",
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "var(--muted)",
                          margin: "2px 0 0",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "280px",
                        }}
                      >
                        {n.message}
                      </p>
                      <p
                        style={{
                          fontSize: "10px",
                          color: "rgba(240,235,227,0.3)",
                          margin: "4px 0 0",
                        }}
                      >
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}

            {/* Charger plus */}
            {hasMore && notifications.length > 0 && (
              <button
                onClick={loadMore}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "none",
                  border: "none",
                  color: "var(--amber)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: loading ? "wait" : "pointer",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading ? "Chargement..." : "Charger plus"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
