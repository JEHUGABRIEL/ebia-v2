import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Check, CheckCheck, Image as ImageIcon, LayoutDashboard,
  MessageSquare, Music2, Paperclip, Pencil, Phone, Search, Send, SmilePlus,
  Users, Video as VideoIcon, X,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useCall } from "../context/CallContext";
import {
  getConversations,
  getMessages,
  sendMessage,
  sendGroupMessage,
  searchMessages,
  createGroupConversation,
  getArtistsForMessaging,
  toggleReaction,
  uploadChatMedia,
  type Conversation,
  type ChatMessage,
  type ChatMessageType,
  type Artist,
} from "../lib/api";
import {
  useMessagingWebSocket,
  type TypingEvent,
  type ReadReceiptEvent,
  type ReactionEvent,
} from "../hooks/useMessagingWebSocket";

/* ─────────────────────────── Constantes & helpers ─────────────────────────── */

/* Émojis rapides partagés : barre de saisie + sélecteur de réactions */
const QUICK_EMOJIS = [
  // Visages & sourires
  "😀", "😃", "😄", "😁", "😆", "😂", "🤣", "🥲",
  "😊", "😇", "🙂", "🙃", "😉", "😍", "🥰", "😘",
  "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪",
  "🤨", "🧐", "🤓", "😎", "🥸", "🥳", "😏", "😒",
  "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖",
  "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡",
  "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰",
  "😥", "😓", "🤗", "🤔", "🫡", "🤭", "🫢", "🫣",
  "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯",
  "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪",
  "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒",
  "🤕", "🤑", "🤠", "💀", "👻", "👽", "🤖", "🎃",
  // Mains & gestes
  "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "👊",
  "✊", "🤝", "🙏", "💪", "👏", "🙌", "👐", "👋",
  "🤙", "🫶", "🤲", "🫰", "👆", "👇", "👈", "👉",
  "☝️", "✋", "🖐️", "🖖", "🤜", "🤳", "💅", "🫵",
  // Cœurs & émotions
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
  "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
  "💘", "💝", "💟", "☮️", "✝️", "💯", "💢", "💥",
  // Musique & fête
  "🎵", "🎶", "🎤", "🎧", "🎸", "🎹", "🎷", "🎺",
  "🎻", "🎼", "🥁", "💃", "🕺", "🎉", "🎊", "✨",
  "⭐", "🌟", "🎬", "📷", "🎥", "🎭", "🪩", "🎇",
  // Animaux & nature
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼",
  "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🙈",
  "🙉", "🙊", "🐔", "🐧", "🐦", "🐤", "🦅", "🦉",
  "🐝", "🐛", "🦋", "🐌", "🐢", "🐍", "🐘", "🦒",
  "🕊️", "🌍", "🌞", "🌙", "🌴", "🌈", "🌹", "🌺",
  "🌸", "🌼", "🌻", "🍀", "🍁", "🔥", "⚡", "❄️",
  // Nourriture & boissons
  "☕", "🍵", "🧋", "🍹", "🍾", "🥂", "🍻", "🍺",
  "🍷", "🥃", "🍎", "🍌", "🍉", "🍇", "🍓", "🥭",
  "🍍", "🥑", "🍕", "🍔", "🍟", "🌭", "🌮", "🍗",
  "🍲", "🍜", "🍣", "🍩", "🍪", "🎂", "🍰", "🍫",
  // Activités & voyages
  "🚀", "✈️", "🚗", "🚲", "⚽", "🏀", "🏈", "🎾",
  "🏆", "🎯", "🎳", "🎮", "🎲", "🎫", "🏖️", "🏔️",
  // Objets & symboles
  "📱", "💻", "🕹️", "📸", "🖼️", "🎙️", "🎚️", "🎛️",
  "💿", "📀", "📻", "📺", "💎", "👑", "💰", "💸",
  "📅", "📍", "🔊", "🔁", "💤", "✅", "❌", "⚠️",
  "❗", "❓", "🔔", "🔒", "🔑", "💡", "🎁", "🏅",
];
const MOBILE_BP = 900; // en dessous : une seule colonne (liste OU conversation)

/** Type "texte" si absent (anciens messages). */
const typeOf = (m: { type?: ChatMessageType }): ChatMessageType => m.type || "text";

/** Libellé court d'un message média, utilisé pour la liste/aperçus. */
const MEDIA_LABELS: Record<Exclude<ChatMessageType, "text">, string> = {
  image: "📷 Photo",
  audio: "🎵 Audio",
  video: "🎬 Vidéo",
};

/** Aperçu texte d'un message pour la liste des discussions. */
const previewText = (msg: Pick<ChatMessage, "type" | "content">): string => {
  const t = typeOf(msg);
  if (t === "text") return msg.content || "";
  const label = MEDIA_LABELS[t];
  return msg.content ? `${label} — ${msg.content}` : label;
};

/** Taille max d'un média côté client (cohérent avec le backend). */
const MEDIA_MAX_BYTES: Record<Exclude<ChatMessageType, "text">, number> = {
  image: 10 * 1024 * 1024,
  audio: 25 * 1024 * 1024,
  video: 50 * 1024 * 1024,
};

type PendingConversation = Conversation & { pending?: boolean };

const SOLID_COLORS = ["#E8601A", "#C9930A", "#5b8def", "#4caf82", "#e25c5c", "#b07de0"];
const hashName = (name: string) =>
  Array.from(name || "?").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

const avatarColor = (name: string) => SOLID_COLORS[hashName(name) % SOLID_COLORS.length];

const initials = (name: string) =>
  (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

const sortConvs = (list: Conversation[]): Conversation[] =>
  [...list].sort((a, b) => {
    const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return tb - ta;
  });

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** Heure courte pour un message (HH:MM). */
const bubbleTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

/** Format du timestamp affiché dans la liste des discussions. */
const listTime = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (sameDay(d, now)) return bubbleTime(iso);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return "Hier";
  if (d.getFullYear() === now.getFullYear())
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
};

/** Séparateur de date centré (Aujourd'hui / Hier / date complète). */
const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  if (sameDay(d, now)) return "Aujourd'hui";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return "Hier";
  const s = d.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/* ─────────────────────────── Petits composants UI ─────────────────────────── */

function Avatar({
  name, src, size = 44, group = false,
}: { name: string; src?: string | null; size?: number; group?: boolean }) {
  const style = {
    width: size, height: size, borderRadius: "50%",
    flexShrink: 0, overflow: "hidden",
    background: group ? "rgba(240,235,227,0.06)" : avatarColor(name),
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff",
  } as React.CSSProperties;

  if (src) {
    return <img src={src} alt={name} style={{ ...style, objectFit: "cover" }} />;
  }
  return (
    <div style={style}>
      {group ? (
        <Users size={size * 0.45} />
      ) : (
        <span style={{ fontSize: size * 0.38, fontWeight: 800 }}>{initials(name)}</span>
      )}
    </div>
  );
}

function ConversationRow({
  conv, active, onOpen,
}: { conv: Conversation; active: boolean; onOpen: (c: Conversation) => void }) {
  const isGroup = conv.type === "group";
  const title = isGroup ? conv.groupName || "Groupe" : conv.otherParticipantName || "Artiste";
  const avatar = isGroup ? null : conv.otherParticipantAvatar;
  const hasPreview = !!conv.lastMessage || !!conv.lastMessageAt;

  return (
    <button
      onClick={() => onOpen(conv)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: "12px",
        padding: "11px 14px", border: "none", cursor: "pointer", textAlign: "left",
        background: active ? "rgba(232,96,26,0.13)" : "transparent",
        transition: "background 0.12s",
        position: "relative",
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.04)"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {/* filet gauche sur la discussion active */}
      {active && (
        <span style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 3, borderRadius: 99, background: "var(--amber)" }} />
      )}

      <div style={{ position: "relative" }}>
        <Avatar name={title} src={avatar} size={48} group={isGroup} />
        {/* pastille présence — non gérée côté serveur : masquée */}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{
            flex: 1, fontSize: 14.5, fontWeight: active ? 700 : 600, color: "var(--text)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0,
          }}>{title}</p>
          {conv.unreadCount > 0 && !active && (
            <span style={{
              minWidth: 18, height: 18, padding: "0 5px", borderRadius: 99,
              background: "var(--amber)", color: "#fff", fontSize: 10.5, fontWeight: 800,
              display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>{conv.unreadCount > 99 ? "99+" : conv.unreadCount}</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <p style={{
            flex: 1, fontSize: 12.5, color: "var(--muted)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0,
          }}>
            {hasPreview ? conv.lastMessage : "Cliquez pour démarrer une discussion"}
          </p>
          <span style={{ fontSize: 10.5, color: "var(--muted)", flexShrink: 0 }}>
            {listTime(conv.lastMessageAt)}
          </span>
        </div>
      </div>
    </button>
  );
}

function DayChip({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "6px 0 10px" }}>
      <span style={{
        fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
        color: "rgba(240,235,227,0.55)", background: "rgba(17,17,17,0.9)",
        border: "1px solid rgba(240,235,227,0.06)", padding: "3px 12px", borderRadius: 99,
      }}>{label}</span>
    </div>
  );
}

/* ─────────────────────────────── Modales ──────────────────────────────────── */

function ModalShell({
  onClose, title, subtitle, children,
}: { onClose: () => void; title: string; subtitle?: string; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 220, background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)", display: "flex", alignItems: "center",
        justifyContent: "center", padding: "20px",
      }}
    >
      <div style={{
        width: "100%", maxWidth: 460, maxHeight: "84vh", display: "flex", flexDirection: "column",
        background: "var(--bg2)", border: "1px solid rgba(240,235,227,0.09)",
        borderRadius: 18, boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        overflow: "hidden", animation: "fadeUp 0.18s ease both",
      }}>
        <div style={{ padding: "18px 20px 12px", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="bebas" style={{ fontSize: 22, color: "var(--text)", margin: 0 }}>{title}</h2>
            {subtitle && <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "var(--muted)", cursor: "pointer",
            padding: 4, borderRadius: 8, display: "flex",
          }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DirectChatModal({
  artists, loading, onPick, onClose,
}: {
  artists: Artist[]; loading: boolean; onPick: (a: Artist) => void; onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const list = artists.filter((a) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (a.name || "").toLowerCase().includes(s);
  });

  return (
    <ModalShell onClose={onClose} title="Nouvelle discussion" subtitle="Discutez avec un autre artiste">
      <div style={{ padding: "4px 20px 14px" }}>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un artiste…"
            style={{
              width: "100%", padding: "10px 12px 10px 34px", borderRadius: 10,
              border: "1px solid rgba(240,235,227,0.1)", background: "rgba(240,235,227,0.05)",
              color: "var(--text)", fontSize: 13, outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 12px" }}>
        {loading ? (
          <p style={{ padding: "28px", textAlign: "center", fontSize: 12, color: "var(--muted)" }}>Chargement…</p>
        ) : list.length === 0 ? (
          <p style={{ padding: "28px", textAlign: "center", fontSize: 12, color: "var(--muted)" }}>
            {q.trim() ? "Aucun artiste trouvé" : "Aucun artiste disponible"}
          </p>
        ) : list.map((a) => (
          <button
            key={a.id}
            onClick={() => onPick(a)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "9px 10px",
              borderRadius: 10, background: "transparent", border: "none", cursor: "pointer",
              textAlign: "left", transition: "background 0.12s",
            }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.05)"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
          >
            <Avatar name={a.name || "A"} src={a.avatar_url} size={40} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                {a.name}
              </p>
              {a.city && <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>{a.city}</p>}
            </div>
          </button>
        ))}
      </div>
    </ModalShell>
  );
}

function GroupChatModal({
  artists, loading, onPick, onClose,
}: {
  artists: Artist[]; loading: boolean; onPick: (name: string, memberIds: string[]) => void; onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [members, setMembers] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const create = () => {
    if (!name.trim() || members.size < 1) return;
    onPick(name.trim(), Array.from(members));
  };

  return (
    <ModalShell onClose={onClose} title="Nouveau groupe" subtitle="Créez une discussion de groupe">
      <div style={{ padding: "4px 20px 10px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 5 }}>
            Nom du groupe
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Équipe E-Bia"
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 10,
              border: "1px solid rgba(240,235,227,0.1)", background: "rgba(240,235,227,0.05)",
              color: "var(--text)", fontSize: 13, outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 5 }}>
            Membres ({members.size})
          </p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 12px" }}>
        {loading ? (
          <p style={{ padding: "24px", textAlign: "center", fontSize: 12, color: "var(--muted)" }}>Chargement…</p>
        ) : artists.map((a) => {
          // La messagerie cible les comptes utilisateurs (user_id), pas la fiche artiste.
          const uid = a.user_id;
          if (!uid) return null;
          const on = members.has(uid);
          return (
            <button
              key={uid}
              onClick={() => toggle(uid)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "8px 10px",
                borderRadius: 10, border: on ? "1px solid rgba(232,96,26,0.4)" : "1px solid transparent",
                background: on ? "rgba(232,96,26,0.1)" : "transparent", cursor: "pointer",
                textAlign: "left", transition: "all 0.12s",
              }}
            >
              <Avatar name={a.name || "A"} src={a.avatar_url} size={38} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {a.name}
              </span>
              {on && (
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--amber)", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "12px 20px 18px", borderTop: "1px solid rgba(240,235,227,0.06)" }}>
        <button
          onClick={create}
          disabled={!name.trim() || members.size === 0}
          style={{
            width: "100%", padding: "12px", borderRadius: 12, border: "none",
            background: name.trim() && members.size > 0 ? "var(--amber)" : "rgba(232,96,26,0.3)",
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: name.trim() && members.size > 0 ? "pointer" : "not-allowed",
          }}
        >
          Créer le groupe
        </button>
      </div>
    </ModalShell>
  );
}

/* ─────────────────────────────── Page ─────────────────────────────────────── */

export default function Messaging() {
  const { user, currentTrack } = useApp();
  const { startCall } = useCall();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<PendingConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [searching, setSearching] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<string | null>(null);
  const [showDirectModal, setShowDirectModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [availableArtists, setAvailableArtists] = useState<Artist[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [uploading, setUploading] = useState<{ type: Exclude<ChatMessageType, "text">; progress: number } | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: ChatMessageType } | null>(null);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(`(min-width: ${MOBILE_BP}px)`).matches : true
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const handledToRef = useRef<string | null>(null);
  const reactionPickerRef = useRef<HTMLDivElement>(null);
  const attachRef = useRef<HTMLDivElement>(null);
  const fileImageRef = useRef<HTMLInputElement>(null);
  const fileAudioRef = useRef<HTMLInputElement>(null);
  const fileVideoRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  /* Breakpoint réactif (liste toujours visible sur desktop) */
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${MOBILE_BP}px)`);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  /* Fermer le picker de réactions au clic extérieur */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(e.target as Node)) {
        setReactionPickerMsgId(null);
      }
    };
    if (reactionPickerMsgId) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [reactionPickerMsgId]);

  /* Fermer le menu pièce jointe au clic extérieur / touche Échap */
  useEffect(() => {
    if (!attachOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (attachRef.current && !attachRef.current.contains(e.target as Node)) setAttachOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setAttachOpen(false); };
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [attachOpen]);

  /* Fermer l'aperçu média (plein écran) avec Échap */
  useEffect(() => {
    if (!mediaPreview) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMediaPreview(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mediaPreview]);

  /* Retour vers l'espace (dashboard) — façon application */
  const goBackHome = useCallback(() => {
    navigate(user?.role === "admin" ? "/admin" : user?.role === "artist" ? "/artist-dashboard" : "/me");
  }, [navigate, user?.role]);

  /* Charger les conversations (triées : plus récente en haut) */
  const loadConversations = useCallback(async (): Promise<Conversation[]> => {
    try {
      const convs = await getConversations();
      const list = sortConvs(Array.isArray(convs) ? convs : []);
      setConversations(list);
      return list;
    } catch {
      setConversations([]);
      return [];
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { void loadConversations(); }, 0);
    return () => clearTimeout(t);
  }, [loadConversations]);

  /* Charger les messages de la conversation active */
  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    try {
      const res = await getMessages(convId);
      setMessages(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  /* Ouvrir une conversation */
  const openConversation = useCallback((conv: Conversation) => {
    setActiveConv(conv);
    setReactionPickerMsgId(null);
    setShowEmojiPicker(false);
    setAttachOpen(false);
    // badge lu localement
    setConversations((prev) => prev.map((c) => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
  }, []);

  /* Revenir à la liste (mobile) */
  const closeConversation = useCallback(() => {
    setActiveConv(null);
    setMessages([]);
    setTypingUsers(new Set());
    setReactionPickerMsgId(null);
    setShowEmojiPicker(false);
    setAttachOpen(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (activeConv && !activeConv.pending && activeConv.id) {
        void loadMessages(activeConv.id);
      }
      setTypingUsers(new Set());
      setReactionPickerMsgId(null);
      setShowEmojiPicker(false);
    }, 0);
    return () => clearTimeout(t);
  }, [activeConv, loadMessages]);

  /* Ouverture directe depuis un profil artiste (?to=user_id) — ex: bouton Message */
  useEffect(() => {
    const toUid = searchParams.get("to");
    if (!toUid || !user) return;
    if (user.role !== "artist" && user.role !== "admin") return;
    if (loadingConvs) return; // attendre que la liste des discussions soit chargée
    if (handledToRef.current === toUid) return;
    let cancelled = false;
    (async () => {
      let artist = availableArtists.find((a) => a.user_id === toUid);
      if (!artist) {
        try {
          const r = await getArtistsForMessaging();
          artist = (r.data || []).find((a) => a.user_id === toUid);
        } catch { /* nom par défaut */ }
      }
      if (cancelled) return;
      const existing = conversations.find(
        (c) => c.type === "direct" && c.otherParticipantId === toUid
      );
      if (existing) {
        openConversation(existing);
      } else {
        const draft: PendingConversation = {
          id: "",
          type: "direct",
          otherParticipantId: toUid,
          otherParticipantName: artist?.name || "Artiste",
          otherParticipantAvatar: artist?.avatar_url || null,
          groupName: null,
          members: [],
          lastMessage: null,
          lastMessageAt: null,
          unreadCount: 0,
          pending: true,
        };
        setActiveConv(draft);
      }
      handledToRef.current = toUid;
      setSearchParams({}, { replace: true });
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, loadingConvs, conversations, availableArtists, user?.id]);

  /* Scroll en bas à chaque nouveau message */
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, activeConv?.id]);

  /* Charger les artistes pour les modales */
  useEffect(() => {
    if (!showDirectModal && !showGroupModal) return;
    if (availableArtists.length > 0) return;
    const t = setTimeout(() => {
      setLoadingArtists(true);
      getArtistsForMessaging()
        .then((r) => {
          // Seuls les artistes rattachés à un compte utilisateur sont joignables :
          // la messagerie cible les user_id (le backend vérifie le rôle du destinataire).
          const list = (r.data || []).filter((a) => a.user_id && a.user_id !== user?.id);
          setAvailableArtists(list);
        })
        .catch(() => setAvailableArtists([]))
        .finally(() => setLoadingArtists(false));
    }, 0);
    return () => clearTimeout(t);
  }, [showDirectModal, showGroupModal, availableArtists.length, user?.id]);

  /* Recherche de messages */
  useEffect(() => {
    if (searchQuery.trim().length < 2) return;
    let alive = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchMessages(searchQuery);
        if (alive) setSearchResults(Array.isArray(res?.data) ? res.data : []);
      } catch {
        if (alive) setSearchResults([]);
      } finally {
        if (alive) setSearching(false);
      }
    }, 300);
    return () => { alive = false; clearTimeout(timer); };
  }, [searchQuery]);

  /* ── WebSocket ── */
  const handleTyping = useCallback((event: TypingEvent) => {
    setTypingUsers((prev) => {
      const next = new Set(prev);
      if (event.typing) next.add(event.userId); else next.delete(event.userId);
      return next;
    });
  }, []);

  const handleReadReceipt = useCallback(
    (event: ReadReceiptEvent) => {
      if (event.readBy === user?.id) return;
      setMessages((prev) => prev.map((msg) => msg.senderId === user?.id ? { ...msg, read: true } : msg));
    },
    [user?.id]
  );

  const handleNewMessage = useCallback(
    (data: unknown) => {
      const msg = data as ChatMessage;
      if (msg.senderId === user?.id) return;
      const isActive = activeConv && msg.conversationId === activeConv.id && !activeConv.pending;
      if (isActive) {
        setMessages((prev) => [...prev, msg]);
      }
      setConversations((prev) =>
        sortConvs(prev.map((c) =>
          c.id === msg.conversationId
            ? {
                ...c,
                lastMessage: previewText(msg),
                lastMessageAt: msg.createdAt,
                unreadCount: isActive ? 0 : (c.unreadCount || 0) + 1,
              }
            : c
        ))
      );
    },
    [user?.id, activeConv]
  );

  const handleReaction = useCallback((event: ReactionEvent) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== event.messageId) return msg;
        const grouped: Record<string, { id: string; userId: string; emoji: string }[]> = {};
        for (const r of event.reactions) {
          if (!grouped[r.emoji]) grouped[r.emoji] = [];
          grouped[r.emoji].push({ id: r.id, userId: r.userId, emoji: r.emoji });
        }
        return { ...msg, reactions: grouped };
      })
    );
  }, []);

  const wsConversationId =
    activeConv && !activeConv.pending && activeConv.id ? activeConv.id : null;

  const { sendTyping } = useMessagingWebSocket({
    conversationId: wsConversationId,
    onTyping: handleTyping,
    onReadReceipt: handleReadReceipt,
    onNewMessage: handleNewMessage,
    onReaction: handleReaction,
  });

  /* Indicateur de frappe (debounce) */
  const handleTypingInput = useCallback(
    (typing: boolean) => {
      if (typing && !isTypingRef.current) {
        isTypingRef.current = true;
        sendTyping(true);
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        sendTyping(false);
      }, 2000);
    },
    [sendTyping]
  );

  useEffect(() => () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, []);

  const stopTyping = useCallback(() => {
    isTypingRef.current = false;
    sendTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, [sendTyping]);

  /* Réactions */
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    setReactionPickerMsgId(null);
    try {
      const result = await toggleReaction(messageId, emoji);
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg;
          const grouped: Record<string, { id: string; userId: string; emoji: string }[]> = {};
          for (const r of result.reactions) {
            if (!grouped[r.emoji]) grouped[r.emoji] = [];
            grouped[r.emoji].push({ id: r.id, userId: r.userId, emoji: r.emoji });
          }
          return { ...msg, reactions: grouped };
        })
      );
    } catch { /* silencieux */ }
  };

  /* Démarrer une discussion directe (depuis le sélecteur) */
  const startDirectChat = (artist: Artist) => {
    setShowDirectModal(false);
    // Cible du message = compte utilisateur de l'artiste (user_id), jamais l'id de la fiche.
    if (!artist.user_id) return;
    const existing = conversations.find(
      (c) => c.type === "direct" && c.otherParticipantId === artist.user_id
    );
    if (existing) {
      openConversation(existing);
      return;
    }
    const draft: PendingConversation = {
      id: "",
      type: "direct",
      otherParticipantId: artist.user_id,
      otherParticipantName: artist.name || "Artiste",
      otherParticipantAvatar: artist.avatar_url,
      groupName: null,
      members: [],
      lastMessage: null,
      lastMessageAt: null,
      unreadCount: 0,
      pending: true,
    };
    setActiveConv(draft);
  };

  const createGroup = async (name: string, memberIds: string[]) => {
    setShowGroupModal(false);
    try {
      await createGroupConversation(name, memberIds);
      const list = await loadConversations();
      const created = list.find((c) => c.type === "group" && c.groupName === name);
      if (created) openConversation(created);
    } catch { /* silencieux */ }
  };

  /* Envoi (texte ou média). media.mediaUrl défini ⇒ message média (légende = newMessage). */
  const handleSend = useCallback(async (media?: { type: Exclude<ChatMessageType, "text">; mediaUrl: string }) => {
    const isMedia = !!media?.mediaUrl;
    if (!activeConv || sending) return;
    if (!isMedia && !newMessage.trim()) return;
    const content = isMedia ? newMessage.trim() : newMessage.trim();
    const type: ChatMessageType = isMedia ? media!.type : "text";
    const mediaUrl = isMedia ? media!.mediaUrl : null;
    const preview = previewText({ type, content });

    stopTyping();
    setSending(true);
    try {
      let result: { id: string; conversationId: string; content: string; type?: ChatMessageType; mediaUrl?: string | null; createdAt: string };
      if (activeConv.type === "group" && !activeConv.pending) {
        result = await sendGroupMessage(activeConv.id, content, isMedia ? { type: media!.type, mediaUrl: media!.mediaUrl } : undefined);
      } else if (activeConv.otherParticipantId) {
        result = await sendMessage(activeConv.otherParticipantId, content, isMedia ? { type: media!.type, mediaUrl: media!.mediaUrl } : undefined);
      } else {
        return;
      }

      const optimistic: ChatMessage = {
        id: result.id,
        conversationId: result.conversationId,
        senderId: user?.id || "",
        senderName: user?.displayName || "",
        senderAvatar: user?.avatarUrl || "",
        content,
        type: result.type || type,
        mediaUrl: result.mediaUrl ?? mediaUrl,
        read: false,
        createdAt: result.createdAt,
      };
      setMessages((prev) => [...prev, optimistic]);
      if (!isMedia) setNewMessage("");

      // Si c'était une discussion "en attente", on bascule vers la vraie conversation
      if (activeConv.pending) {
        const conv: Conversation = {
          id: result.conversationId,
          type: "direct",
          otherParticipantId: activeConv.otherParticipantId,
          otherParticipantName: activeConv.otherParticipantName,
          otherParticipantAvatar: activeConv.otherParticipantAvatar,
          groupName: null,
          members: [],
          lastMessage: preview,
          lastMessageAt: result.createdAt,
          unreadCount: 0,
        };
        setActiveConv(conv);
        loadConversations();
      } else {
        setConversations((prev) =>
          sortConvs(prev.map((c) =>
            c.id === activeConv.id ? { ...c, lastMessage: preview, lastMessageAt: result.createdAt } : c
          ))
        );
      }
    } catch { /* silencieux */ }
    finally {
      setSending(false);
    }
  }, [activeConv, sending, newMessage, stopTyping, loadConversations, user]);

  /* Envoyer un média : upload (avec progression) puis envoi du message */
  const pickAndSendMedia = useCallback(async (type: Exclude<ChatMessageType, "text">, file: File) => {
    const max = MEDIA_MAX_BYTES[type];
    if (file.size > max) {
      const mb = Math.round(max / (1024 * 1024));
      const label = type === "image" ? "une image" : type === "audio" ? "un audio" : "une vidéo";
      alert(`Fichier trop volumineux (max ${mb} Mo pour ${label}).`);
      return;
    }
    setAttachOpen(false);
    setUploading({ type, progress: 0 });
    try {
      const { url } = await uploadChatMedia(file, (p) => setUploading({ type, progress: p }));
      await handleSend({ type, mediaUrl: url });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Échec de l'envoi du fichier.");
    } finally {
      setUploading(null);
    }
  }, [handleSend]);

  const canSend = !!activeConv && !!newMessage.trim() && !uploading && !sending;
  const canAttach = !!activeConv && !uploading && !sending;

  /* Nom / sous-titre de la conversation active */
  const convTitle = activeConv
    ? activeConv.type === "group"
      ? activeConv.groupName || "Groupe"
      : activeConv.pending
        ? activeConv.otherParticipantName || "Nouvelle discussion"
        : activeConv.otherParticipantName || "Discussion"
    : "";

  const typingNames = (): string[] => {
    if (!activeConv) return [];
    const name = (id: string) => {
      if (activeConv.type === "group") {
        const m = activeConv.members.find((x) => x.userId === id);
        return m?.displayName || null;
      }
      return activeConv.otherParticipantName || null;
    };
    return Array.from(typingUsers).map((id) => name(id)).filter((n): n is string => !!n);
  };
  const whoTypes = typingNames();

  /* ── Garde d'accès ── */
  if (!user) return null;
  if (user.role !== "artist" && user.role !== "admin") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <MessageSquare size={48} style={{ color: "var(--muted)", margin: "0 auto 16px" }} />
          <h2 className="bebas" style={{ fontSize: 28, color: "var(--text)", marginBottom: 8 }}>Réservé aux artistes</h2>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
            La messagerie est disponible uniquement pour les artistes.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 22, flexWrap: "wrap" }}>
            <button
              onClick={goBackHome}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "11px 22px", borderRadius: 99, border: "none", cursor: "pointer",
                background: "var(--amber)", color: "#fff", fontSize: 13, fontWeight: 700,
                transition: "box-shadow 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(232,96,26,0.35)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              <LayoutDashboard size={15} /> Aller à mon espace
            </button>
            <button
              onClick={() => navigate("/")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "11px 22px", borderRadius: 99, cursor: "pointer",
                border: "1px solid rgba(240,235,227,0.15)", background: "transparent",
                color: "var(--muted)", fontSize: 13, fontWeight: 600,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.3)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.15)"; }}
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showList = !activeConv || isDesktop;
  const showChat = !!activeConv || isDesktop;

  /* Construction du fil : séparateurs de jour + regroupement par expéditeur */
  const buildThread = () => {
    const nodes: Array<{ type: "day"; key: string; label: string } | { type: "msg"; key: string; msg: ChatMessage; groupStart: boolean; groupEnd: boolean }> = [];
    messages.forEach((msg, i) => {
      const prev = i > 0 ? messages[i - 1] : null;
      const newDay = !prev || !sameDay(new Date(prev.createdAt), new Date(msg.createdAt));
      if (newDay) {
        nodes.push({ type: "day", key: `d-${msg.id}`, label: dayLabel(msg.createdAt) });
      }
      const groupStart = !prev || prev.senderId !== msg.senderId || newDay;
      const next = i < messages.length - 1 ? messages[i + 1] : null;
      const groupEnd =
        !next ||
        next.senderId !== msg.senderId ||
        !sameDay(new Date(msg.createdAt), new Date(next.createdAt)) ||
        new Date(next.createdAt).getTime() - new Date(msg.createdAt).getTime() > 5 * 60 * 1000;
      nodes.push({ type: "msg", key: msg.id, msg, groupStart, groupEnd });
    });
    return nodes;
  };

  const thread = buildThread();

  return (
    <div style={{
      height: "100vh", paddingTop: 60, background: "#000", display: "flex",
      flexDirection: "column", overflow: "hidden",
    }}>
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>

        {/* ═══════════ COLONNE LISTE DES DISCUSSIONS ═══════════ */}
        {showList && (
          <aside
            style={{
              width: showChat && isDesktop ? "min(400px, 30vw)" : "100%",
              minWidth: showChat && isDesktop ? 320 : 0,
              flexShrink: 0, background: "#101010",
              borderRight: isDesktop ? "1px solid rgba(240,235,227,0.07)" : "none",
              display: "flex", flexDirection: "column", minHeight: 0,
            }}
          >
            {/* En-tête : actions + recherche */}
            <div style={{ padding: "12px 12px 8px", borderBottom: "1px solid rgba(240,235,227,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Retour vers l'espace (dashboard) */}
                <button
                  title="Retour à mon espace"
                  onClick={goBackHome}
                  style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0, cursor: "pointer",
                    background: "rgba(240,235,227,0.06)", border: "1px solid rgba(240,235,227,0.08)",
                    color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--amber)"; (e.currentTarget as HTMLElement).style.background = "rgba(232,96,26,0.15)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted)"; (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.06)"; }}
                >
                  <LayoutDashboard size={15} />
                </button>
                <div style={{ flex: 1, position: "relative" }}>
                  <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                  <input
                    value={searchQuery}
                    onChange={(e) => {
                      const q = e.target.value;
                      setSearchQuery(q);
                      if (q.trim().length < 2) { setSearchResults([]); setSearching(false); }
                    }}
                    placeholder="Rechercher un message…"
                    style={{
                      width: "100%", padding: "9px 12px 9px 34px", borderRadius: 10,
                      border: "none", background: "rgba(240,235,227,0.06)",
                      color: "var(--text)", fontSize: 12.5, outline: "none", boxSizing: "border-box",
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(""); setSearchResults([]); setSearching(false); }}
                      style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted)", cursor: "pointer", display: "flex", padding: 2 }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                <button
                  title="Nouvelle discussion"
                  onClick={() => setShowDirectModal(true)}
                  style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0, cursor: "pointer",
                    background: "rgba(240,235,227,0.06)", border: "1px solid rgba(240,235,227,0.08)",
                    color: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(232,96,26,0.15)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.06)"; }}
                >
                  <Pencil size={15} />
                </button>
                <button
                  title="Nouveau groupe"
                  onClick={() => setShowGroupModal(true)}
                  style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0, cursor: "pointer",
                    background: "rgba(240,235,227,0.06)", border: "1px solid rgba(240,235,227,0.08)",
                    color: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(232,96,26,0.15)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.06)"; }}
                >
                  <Users size={15} />
                </button>
              </div>

              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", margin: "10px 2px 2px" }}>
                Discussions
              </p>
            </div>

            {/* Liste / résultats de recherche */}
            <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
              {searchQuery.trim().length >= 2 ? (
                searching ? (
                  <div style={{ padding: 36, textAlign: "center", fontSize: 12, color: "var(--muted)" }}>Recherche…</div>
                ) : searchResults.length === 0 ? (
                  <div style={{ padding: 36, textAlign: "center" }}>
                    <Search size={24} style={{ color: "rgba(240,235,227,0.12)", margin: "0 auto 8px" }} />
                    <p style={{ fontSize: 12.5, color: "var(--muted)" }}>Aucun résultat pour « {searchQuery} »</p>
                  </div>
                ) : (
                  searchResults.map((msg) => {
                    const conv = conversations.find((c) => c.id === msg.conversationId);
                    return (
                      <button
                        key={msg.id}
                        onClick={() => { if (conv) { openConversation(conv); setSearchQuery(""); } }}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 12,
                          padding: "11px 14px", background: "transparent", border: "none",
                          cursor: "pointer", textAlign: "left", transition: "background 0.12s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.04)"}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                      >
                        <Avatar name={msg.senderName || "?"} src={msg.senderAvatar} size={40} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>
                              {conv ? (conv.type === "group" ? conv.groupName : conv.otherParticipantName) : msg.senderName}
                            </p>
                            <span style={{ fontSize: 10.5, color: "var(--muted)", flexShrink: 0 }}>{listTime(msg.createdAt)}</span>
                          </div>
                          <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {previewText(msg)}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )
              ) : loadingConvs ? (
                <div style={{ padding: "10px 14px" }}>
                  {[...Array(7)].map((_, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(240,235,227,0.05)", animation: "ebiaPulse 1.4s infinite" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 11, width: "45%", borderRadius: 6, background: "rgba(240,235,227,0.05)", animation: "ebiaPulse 1.4s infinite" }} />
                        <div style={{ height: 10, width: "70%", borderRadius: 6, background: "rgba(240,235,227,0.04)", marginTop: 8, animation: "ebiaPulse 1.4s infinite" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: "44px 24px", textAlign: "center" }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: "50%", margin: "0 auto 14px",
                    background: "rgba(232,96,26,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <MessageSquare size={30} style={{ color: "var(--amber)" }} />
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Aucune discussion</p>
                  <p style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>
                    Lancez une conversation avec un autre artiste.
                  </p>
                  <button
                    onClick={() => setShowDirectModal(true)}
                    style={{
                      padding: "9px 16px", borderRadius: 99, border: "none", cursor: "pointer",
                      background: "var(--amber)", color: "#fff", fontSize: 12, fontWeight: 700,
                    }}
                  >
                    Nouvelle discussion
                  </button>
                </div>
              ) : (
                conversations.map((conv) => (
                  <ConversationRow
                    key={conv.id}
                    conv={conv}
                    active={activeConv?.id === conv.id && !!activeConv && !activeConv.pending}
                    onOpen={openConversation}
                  />
                ))
              )}
            </div>
          </aside>
        )}

        {/* ═══════════ ZONE DE DISCUSSION ═══════════ */}
        {showChat && (
          <section style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", background: "#0a0a0a" }}>
            {activeConv ? (
              <>
                {/* En-tête de conversation */}
                <header style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", background: "#151515",
                  borderBottom: "1px solid rgba(240,235,227,0.06)", flexShrink: 0,
                }}>
                  {!isDesktop && (
                    <button
                      onClick={closeConversation}
                      style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", display: "flex", padding: 4 }}
                    >
                      <ArrowLeft size={22} />
                    </button>
                  )}
                  <Avatar
                    name={convTitle}
                    src={activeConv.type === "group" ? null : (activeConv.otherParticipantAvatar || null)}
                    size={40}
                    group={activeConv.type === "group"}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {convTitle}
                    </p>
                    <p style={{
                      fontSize: 11.5, margin: "1px 0 0",
                      color: whoTypes.length > 0 ? "var(--amber)" : "var(--muted)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {whoTypes.length > 0
                        ? (whoTypes.length === 1 ? `${whoTypes[0]} écrit…` : "Plusieurs personnes écrivent…")
                        : activeConv.type === "group"
                          ? `${activeConv.members.length} membre${activeConv.members.length > 1 ? "s" : ""}`
                          : activeConv.pending
                            ? "Envoyez le premier message pour démarrer"
                            : "Artiste"}
                    </p>
                  </div>
                  {activeConv.pending && !isDesktop && (
                    <button onClick={closeConversation} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", display: "flex", padding: 4 }}>
                      <X size={18} />
                    </button>
                  )}
                  {/* Appel audio/vidéo — conversations directes uniquement (pas de groupe) */}
                  {activeConv.type !== "group" && !activeConv.pending && activeConv.otherParticipantId && (
                    <>
                      <button
                        onClick={() => void startCall(
                          { userId: activeConv.otherParticipantId!, name: convTitle, avatar: activeConv.otherParticipantAvatar || undefined },
                          activeConv.id, "audio",
                        )}
                        title="Appel audio"
                        style={{
                          width: 34, height: 34, borderRadius: 10, flexShrink: 0, cursor: "pointer",
                          background: "rgba(240,235,227,0.06)", border: "1px solid rgba(240,235,227,0.08)",
                          color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--amber)"; (e.currentTarget as HTMLElement).style.background = "rgba(232,96,26,0.15)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted)"; (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.06)"; }}
                      >
                        <Phone size={15} />
                      </button>
                      <button
                        onClick={() => void startCall(
                          { userId: activeConv.otherParticipantId!, name: convTitle, avatar: activeConv.otherParticipantAvatar || undefined },
                          activeConv.id, "video",
                        )}
                        title="Appel vidéo"
                        style={{
                          width: 34, height: 34, borderRadius: 10, flexShrink: 0, cursor: "pointer",
                          background: "rgba(240,235,227,0.06)", border: "1px solid rgba(240,235,227,0.08)",
                          color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--amber)"; (e.currentTarget as HTMLElement).style.background = "rgba(232,96,26,0.15)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted)"; (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.06)"; }}
                      >
                        <VideoIcon size={15} />
                      </button>
                    </>
                  )}
                  {/* Séparateur visuel : distingue "retour à mon espace" (navigation hors
                      messagerie) des boutons d'appel juste avant (action dans la conversation) */}
                  <div style={{ width: 1, height: 22, background: "rgba(240,235,227,0.1)", flexShrink: 0, margin: "0 2px" }} />
                  <button
                    onClick={goBackHome}
                    title="Retour à mon espace"
                    style={{
                      height: 34, padding: isDesktop ? "0 14px 0 10px" : "0 9px", borderRadius: 99, flexShrink: 0, cursor: "pointer",
                      background: "rgba(232,96,26,0.1)", border: "1px solid rgba(232,96,26,0.2)",
                      color: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(232,96,26,0.2)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(232,96,26,0.1)"; }}
                  >
                    <LayoutDashboard size={15} />
                    {isDesktop && "Mon espace"}
                  </button>
                </header>

                {/* Fil de messages */}
                <div
                  ref={threadRef}
                  className="e-thread"
                  style={{
                    flex: 1, overflowY: "auto", padding: "14px 4%",
                    backgroundImage: "radial-gradient(rgba(240,235,227,0.022) 1px, transparent 1.4px)",
                    backgroundSize: "24px 24px",
                  }}
                >
                  {loadingMessages ? (
                    <div style={{ flex: 1, minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--muted)" }}>
                      Chargement des messages…
                    </div>
                  ) : messages.length === 0 && !activeConv.pending ? (
                    <div style={{ minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <Music2 size={30} style={{ color: "rgba(240,235,227,0.14)", margin: "0 auto 10px" }} />
                        <p style={{ fontSize: 13, color: "var(--muted)" }}>
                          Dites bonjour 👋 — le premier message démarre la conversation.
                        </p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <Music2 size={30} style={{ color: "rgba(240,235,227,0.14)", margin: "0 auto 10px" }} />
                        <p style={{ fontSize: 13, color: "var(--muted)" }}>Nouvelle discussion — envoyez un message.</p>
                      </div>
                    </div>
                  ) : (
                    thread.map((node) =>
                      node.type === "day" ? (
                        <DayChip key={node.key} label={node.label} />
                      ) : (
                        <Bubble
                          key={node.key}
                          msg={node.msg}
                          isMe={node.msg.senderId === user.id}
                          isGroup={activeConv.type === "group"}
                          groupStart={node.groupStart}
                          groupEnd={node.groupEnd}
                          user={user}
                          reactionPickerMsgId={reactionPickerMsgId}
                          reactionPickerRef={reactionPickerRef}
                          onOpenReactions={(id) => setReactionPickerMsgId((cur) => cur === id ? null : id)}
                          onToggleReaction={handleToggleReaction}
                          onPreviewMedia={(url, t) => setMediaPreview({ url, type: t })}
                        />
                      )
                    )
                  )}

                  {/* Indicateur de frappe */}
                  {whoTypes.length > 0 && (
                    <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 4 }}>
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "11px 16px", borderRadius: 14, borderBottomLeftRadius: 4,
                        background: "#202020",
                      }}>
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            style={{
                              width: 6, height: 6, borderRadius: "50%", background: "var(--muted)",
                              animation: `typingBounce 1.4s ${i * 0.2}s infinite`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Barre de saisie */}
                <div style={{
                  background: "#151515", borderTop: "1px solid rgba(240,235,227,0.06)",
                  padding: "10px 14px", flexShrink: 0, position: "relative",
                }}>
                  {showEmojiPicker && (
                    <div style={{
                      position: "absolute", bottom: "calc(100% + 8px)", left: 14,
                      background: "var(--bg3)", border: "1px solid rgba(240,235,227,0.1)",
                      borderRadius: 16, padding: "8px 10px",
                      width: 308, maxHeight: 240, overflowY: "auto",
                      display: "flex", flexWrap: "wrap", gap: 2,
                      boxShadow: "0 12px 40px rgba(0,0,0,0.5)", zIndex: 5,
                    }}>
                      {QUICK_EMOJIS.map((e) => (
                        <button
                          key={e}
                          onClick={() => setNewMessage((m) => m + e)}
                          style={{
                            width: 30, height: 30, fontSize: 17, background: "transparent",
                            border: "none", borderRadius: 8, cursor: "pointer",
                            transition: "background 0.12s, transform 0.12s",
                          }}
                          onMouseEnter={(ev) => { ev.currentTarget.style.background = "rgba(240,235,227,0.1)"; ev.currentTarget.style.transform = "scale(1.18)"; }}
                          onMouseLeave={(ev) => { ev.currentTarget.style.background = "transparent"; ev.currentTarget.style.transform = "scale(1)"; }}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Menu pièce jointe */}
                  {attachOpen && (
                    <div
                      ref={attachRef}
                      style={{
                        position: "absolute", bottom: "calc(100% + 8px)", left: 14,
                        background: "var(--bg3)", border: "1px solid rgba(240,235,227,0.1)",
                        borderRadius: 16, padding: "6px", minWidth: 230,
                        boxShadow: "0 12px 40px rgba(0,0,0,0.5)", zIndex: 5,
                      }}
                    >
                      <button
                        onClick={() => fileImageRef.current?.click()}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "9px 10px", borderRadius: 10, border: "none", background: "transparent", color: "var(--text)", fontSize: 13, cursor: "pointer", textAlign: "left", transition: "background 0.12s" }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.05)"}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                      >
                        <span style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(232,96,26,0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><ImageIcon size={15} style={{ color: "var(--amber)" }} /></span>
                        Image
                      </button>
                      <button
                        onClick={() => fileVideoRef.current?.click()}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "9px 10px", borderRadius: 10, border: "none", background: "transparent", color: "var(--text)", fontSize: 13, cursor: "pointer", textAlign: "left", transition: "background 0.12s" }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.05)"}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                      >
                        <span style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(201,147,10,0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><VideoIcon size={15} style={{ color: "var(--gold)" }} /></span>
                        Vidéo
                      </button>
                      <button
                        onClick={() => fileAudioRef.current?.click()}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "9px 10px", borderRadius: 10, border: "none", background: "transparent", color: "var(--text)", fontSize: 13, cursor: "pointer", textAlign: "left", transition: "background 0.12s" }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.05)"}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                      >
                        <span style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(76,175,130,0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Music2 size={15} style={{ color: "#4caf82" }} /></span>
                        Audio
                      </button>
                    </div>
                  )}

                  {/* Inputs cachés pour les pièces jointes */}
                  <input ref={fileImageRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void pickAndSendMedia("image", f); e.target.value = ""; }} />
                  <input ref={fileVideoRef} type="file" accept="video/*" style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void pickAndSendMedia("video", f); e.target.value = ""; }} />
                  <input ref={fileAudioRef} type="file" accept="audio/*" style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void pickAndSendMedia("audio", f); e.target.value = ""; }} />

                  {uploading ? (
                    /* Progression de l'upload */
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: "rgba(232,96,26,0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--amber)" }}>
                        {uploading.type === "image" ? <ImageIcon size={19} /> : uploading.type === "video" ? <VideoIcon size={19} /> : <Music2 size={19} />}
                      </span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>
                          Envoi {MEDIA_LABELS[uploading.type]}… {uploading.progress}%
                        </p>
                        <div style={{ height: 5, borderRadius: 99, background: "rgba(240,235,227,0.08)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${uploading.progress}%`, borderRadius: 99, background: "var(--amber)", transition: "width 0.15s" }} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        title="Émojis"
                        onClick={() => { setShowEmojiPicker((v) => !v); setAttachOpen(false); }}
                        style={{
                          width: 38, height: 38, borderRadius: "50%", flexShrink: 0, cursor: "pointer",
                          background: "transparent", border: "none", color: showEmojiPicker ? "var(--amber)" : "var(--muted)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <SmilePlus size={21} />
                      </button>

                      <button
                        title="Joindre un fichier"
                        disabled={!canAttach}
                        onClick={() => { setAttachOpen((v) => !v); setShowEmojiPicker(false); }}
                        style={{
                          width: 38, height: 38, borderRadius: "50%", flexShrink: 0, cursor: canAttach ? "pointer" : "not-allowed",
                          background: "transparent", border: "none", color: attachOpen ? "var(--amber)" : canAttach ? "var(--muted)" : "rgba(240,235,227,0.2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <Paperclip size={20} />
                      </button>

                      <input
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          handleTypingInput(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(); }
                        }}
                        placeholder="Écrire un message…"
                        style={{
                          flex: 1, padding: "11px 16px", borderRadius: 12,
                          background: "rgba(240,235,227,0.06)", border: "none",
                          color: "var(--text)", fontSize: 13.5, outline: "none",
                          boxSizing: "border-box",
                        }}
                      />

                      <button
                        onClick={() => void handleSend()}
                        disabled={!canSend}
                        title="Envoyer"
                        style={{
                          width: 42, height: 42, borderRadius: "50%", flexShrink: 0, border: "none",
                          background: canSend ? "var(--amber)" : "rgba(240,235,227,0.08)",
                          color: canSend ? "#fff" : "var(--muted)",
                          cursor: canSend ? "pointer" : "default",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "background 0.15s, box-shadow 0.15s",
                        }}
                        onMouseEnter={(e) => { if (canSend) (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 18px rgba(232,96,26,0.4)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                      >
                        <Send size={17} />
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* État vide — aucune discussion sélectionnée */
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <div style={{ textAlign: "center", maxWidth: 380 }}>
                  <div style={{
                    width: 96, height: 96, borderRadius: "50%", margin: "0 auto 20px",
                    background: "linear-gradient(135deg, rgba(232,96,26,0.18), rgba(201,147,10,0.08))",
                    border: "1px solid rgba(232,96,26,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 60px rgba(232,96,26,0.12)",
                  }}>
                    <MessageSquare size={40} style={{ color: "var(--amber)" }} />
                  </div>
                  <h1 className="bebas" style={{ fontSize: 30, color: "var(--text)", letterSpacing: "0.06em", marginBottom: 8 }}>
                    MESSAGERIE E-BIA
                  </h1>
                  <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.7 }}>
                    Discutez en privé ou en groupe avec les artistes de la plateforme.
                    Sélectionnez une discussion à gauche pour commencer.
                  </p>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {/* ── Aperçu média plein écran ── */}
      {mediaPreview && (
        <div
          onClick={() => setMediaPreview(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 320,
            background: "rgba(0,0,0,0.94)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px", cursor: "zoom-out",
          }}
        >
          <button
            onClick={() => setMediaPreview(null)}
            style={{ position: "absolute", top: 18, right: 18, width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(240,235,227,0.1)", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={18} />
          </button>
          {mediaPreview.type === "image" ? (
            <img src={mediaPreview.url} alt="" style={{ maxWidth: "92vw", maxHeight: "88vh", borderRadius: 10, objectFit: "contain" }} />
          ) : (
            <video src={mediaPreview.url} controls autoPlay style={{ maxWidth: "92vw", maxHeight: "88vh", borderRadius: 10 }} />
          )}
        </div>
      )}

      {/* ── Modales ── */}
      {showDirectModal && (
        <DirectChatModal
          artists={availableArtists}
          loading={loadingArtists}
          onPick={startDirectChat}
          onClose={() => setShowDirectModal(false)}
        />
      )}
      {showGroupModal && (
        <GroupChatModal
          artists={availableArtists}
          loading={loadingArtists}
          onPick={createGroup}
          onClose={() => setShowGroupModal(false)}
        />
      )}

      {/* Espace pour le mini-player quand une musique joue */}
      {currentTrack && <div style={{ height: 64, flexShrink: 0 }} />}

      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: .4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes ebiaPulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.7; } }
        .msg-row:hover .react-orb { opacity: .85 !important; }
        .react-orb:hover { opacity: 1 !important; }
        .e-thread { scrollbar-width: thin; scrollbar-color: rgba(240,235,227,0.12) transparent; }
        .e-thread::-webkit-scrollbar { width: 5px; }
        .e-thread::-webkit-scrollbar-thumb { background: rgba(240,235,227,0.12); border-radius: 99px; }
      `}</style>
    </div>
  );
}

/* ─────────────────────────── Bulle de message ─────────────────────────────── */

function Bubble({
  msg, isMe, isGroup, groupStart, groupEnd, user, reactionPickerMsgId, reactionPickerRef, onOpenReactions, onToggleReaction, onPreviewMedia,
}: {
  msg: ChatMessage;
  isMe: boolean;
  isGroup: boolean;
  groupStart: boolean;
  groupEnd: boolean;
  user: NonNullable<ReturnType<typeof useApp>["user"]>;
  reactionPickerMsgId: string | null;
  reactionPickerRef: React.RefObject<HTMLDivElement | null>;
  onOpenReactions: (id: string) => void;
  onToggleReaction: (id: string, emoji: string) => void;
  onPreviewMedia: (url: string, type: Exclude<ChatMessageType, "text">) => void;
}) {
  const reactions = msg.reactions || {};
  const reactionKeys = Object.keys(reactions);
  const showName = !isMe && isGroup && groupStart;
  const senderColor = avatarColor(msg.senderName || "?");
  const mtype = typeOf(msg);
  const isMedia = mtype !== "text";
  const hasMedia = isMedia && !!msg.mediaUrl;

  return (
    <div className="msg-row" style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginTop: groupStart && !showName && !isMe ? 8 : 0 }}>
      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", position: "relative" }}>
        {showName && (
          <p style={{ fontSize: 11, fontWeight: 700, color: senderColor, margin: "0 0 2px 4px" }}>
            {msg.senderName}
          </p>
        )}

        <div
          style={{
            padding: hasMedia && !msg.content ? "4px 5px 2px" : "7px 12px 6px",
            borderRadius: 12,
            background: isMe ? "linear-gradient(135deg, #E8601A, #d25412)" : "#202020",
            color: isMe ? "#fff" : "var(--text)",
            borderBottomRightRadius: isMe ? (groupEnd ? 4 : 12) : 12,
            borderBottomLeftRadius: isMe ? 12 : (groupEnd ? 4 : 12),
            boxShadow: "0 1px 2px rgba(0,0,0,0.35)",
            wordBreak: "break-word",
          }}
        >
          {/* Média joint (image / vidéo / audio) */}
          {hasMedia && mtype === "image" && (
            <img
              src={msg.mediaUrl || ""}
              alt={msg.content || "Photo"}
              onClick={(e) => { e.stopPropagation(); onPreviewMedia(msg.mediaUrl || "", "image"); }}
              style={{ display: "block", maxWidth: "min(280px, 58vw)", maxHeight: 320, borderRadius: 9, objectFit: "cover", cursor: "zoom-in", marginBottom: msg.content ? 4 : 0 }}
            />
          )}
          {hasMedia && mtype === "video" && (
            <video
              src={msg.mediaUrl || ""}
              controls
              preload="metadata"
              style={{ display: "block", width: "min(300px, 62vw)", maxHeight: 260, borderRadius: 9, marginBottom: msg.content ? 4 : 0 }}
            />
          )}
          {hasMedia && mtype === "audio" && (
            <audio
              src={msg.mediaUrl || ""}
              controls
              preload="metadata"
              style={{ display: "block", width: "min(250px, 60vw)", marginBottom: msg.content ? 4 : 0 }}
            />
          )}

          {/* Légende (message texte OU légende d'un média) */}
          {(msg.content || !isMedia) && (
            <p style={{ fontSize: 13.5, lineHeight: 1.45, margin: 0, whiteSpace: "pre-wrap" }}>
              {msg.content}
            </p>
          )}

          {/* méta : heure + accusé de lecture */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 3, minHeight: 13 }}>
            <span style={{ fontSize: 10, color: isMe ? "rgba(255,255,255,0.72)" : "rgba(240,235,227,0.4)" }}>
              {bubbleTime(msg.createdAt)}
            </span>
            {isMe &&
              (msg.read
                ? <CheckCheck size={13} style={{ color: isMe ? "rgba(255,255,255,0.9)" : "rgba(240,235,227,0.5)" }} />
                : <Check size={13} style={{ color: isMe ? "rgba(255,255,255,0.6)" : "rgba(240,235,227,0.4)" }} />)}
          </div>

          {/* bouton réaction au survol */}
          <button
            onClick={(e) => { e.stopPropagation(); onOpenReactions(msg.id); }}
            title="Réagir"
            className="react-orb"
            style={{
              position: "absolute", top: -10,
              [isMe ? "right" : "left"]: -8,
              width: 24, height: 24, borderRadius: "50%",
              border: "1px solid rgba(240,235,227,0.12)", background: "var(--bg3)",
              color: "var(--muted)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: 0, transition: "opacity 0.12s, transform 0.12s",
              zIndex: 3,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--amber)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; }}
          >
            <SmilePlus size={12} />
          </button>

          {/* sélecteur d'émojis */}
          {reactionPickerMsgId === msg.id && (
            <div
              ref={reactionPickerRef}
              style={{
                position: "absolute",
                [isMe ? "right" : "left"]: 0,
                top: -48,
                width: 260, maxHeight: 160, overflowY: "auto",
                background: "var(--bg3)",
                border: "1px solid rgba(240,235,227,0.12)",
                borderRadius: 16, padding: "6px 8px",
                display: "flex", flexWrap: "wrap", gap: 2, zIndex: 10,
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              }}
            >
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={(e) => { e.stopPropagation(); onToggleReaction(msg.id, emoji); }}
                  style={{
                    width: 30, height: 30, borderRadius: "50%", fontSize: 17,
                    border: "none", background: "transparent", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.12s, transform 0.12s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(240,235,227,0.1)"; e.currentTarget.style.transform = "scale(1.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "scale(1)"; }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* pastilles de réactions sous la bulle */}
        {reactionKeys.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4, justifyContent: isMe ? "flex-end" : "flex-start" }}>
            {reactionKeys.map((emoji) => {
              const users = reactions[emoji] || [];
              const mine = users.some((u) => u.userId === user.id);
              return (
                <button
                  key={emoji}
                  onClick={() => onToggleReaction(msg.id, emoji)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "1px 8px", borderRadius: 99,
                    background: mine ? "rgba(232,96,26,0.18)" : "#1a1a1a",
                    border: mine ? "1px solid rgba(232,96,26,0.45)" : "1px solid rgba(240,235,227,0.1)",
                    color: "var(--text)", fontSize: 12.5, cursor: "pointer",
                  }}
                >
                  <span>{emoji}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.6 }}>{users.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
