import { useState, useEffect, useCallback } from "react";
import { Heart, ThumbsDown, MessageCircle, X, Send, Trash2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  toggleLike, toggleDislike, getReactionStatus,
  getTrackComments, postTrackComment, deleteTrackComment, type TrackComment,
} from "../lib/api";

/* ── Tiny relative-time helper (no dependency) ── */
function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "à l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days}j`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  const years = Math.floor(months / 12);
  return `il y a ${years} an${years > 1 ? "s" : ""}`;
}

const pillStyle = (active: boolean, activeColor: string): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", gap: "6px",
  padding: "8px 14px", borderRadius: "99px",
  background: active ? `${activeColor}1F` : "rgba(240,235,227,0.06)",
  border: `1px solid ${active ? `${activeColor}4D` : "rgba(240,235,227,0.12)"}`,
  color: active ? activeColor : "var(--muted)",
  fontSize: "12px", fontWeight: 700, cursor: "pointer",
  transition: "all 0.15s",
});

export default function TrackReactions({ trackId }: { trackId: string }) {
  const { user, setShowLoginModal } = useApp();
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState<number | null>(null);
  const [dislikesCount, setDislikesCount] = useState<number | null>(null);
  const [commentsCount, setCommentsCount] = useState<number | null>(null);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getReactionStatus(trackId).then(r => { if (!cancelled) { setLiked(r.liked); setDisliked(r.disliked); } }).catch(() => {});
    getTrackComments(trackId, 0, 1).then(r => { if (!cancelled) setCommentsCount(r.total); }).catch(() => {});
    return () => { cancelled = true; };
  }, [trackId]);

  const requireAuth = () => {
    if (!user) { setShowLoginModal(true); return false; }
    return true;
  };

  const handleLike = async () => {
    if (!requireAuth()) return;
    const prevLiked = liked, prevDisliked = disliked;
    setLiked(!prevLiked);
    if (!prevLiked) setDisliked(false);
    try {
      const res = await toggleLike(trackId);
      setLiked(res.liked); setLikesCount(res.likes_count); setDislikesCount(res.dislikes_count);
    } catch {
      setLiked(prevLiked); setDisliked(prevDisliked);
    }
  };

  const handleDislike = async () => {
    if (!requireAuth()) return;
    const prevLiked = liked, prevDisliked = disliked;
    setDisliked(!prevDisliked);
    if (!prevDisliked) setLiked(false);
    try {
      const res = await toggleDislike(trackId);
      setDisliked(res.disliked); setDislikesCount(res.dislikes_count); setLikesCount(res.likes_count);
    } catch {
      setLiked(prevLiked); setDisliked(prevDisliked);
    }
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button onClick={handleLike} style={pillStyle(liked, "var(--amber)")}>
          <Heart size={13} fill={liked ? "var(--amber)" : "none"} />
          {likesCount ?? ""}
        </button>
        <button onClick={handleDislike} style={pillStyle(disliked, "#f08080")}>
          <ThumbsDown size={13} fill={disliked ? "#f08080" : "none"} />
          {dislikesCount ?? ""}
        </button>
        <button onClick={() => setShowComments(true)} style={pillStyle(false, "var(--muted)")}>
          <MessageCircle size={13} />
          {commentsCount ?? ""}
        </button>
      </div>

      {showComments && (
        <CommentsModal trackId={trackId} onClose={() => setShowComments(false)} onCountChange={setCommentsCount} />
      )}
    </>
  );
}

function CommentsModal({
  trackId, onClose, onCountChange,
}: { trackId: string; onClose: () => void; onCountChange: (n: number) => void }) {
  const { user, setShowLoginModal } = useApp();
  const [comments, setComments] = useState<TrackComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getTrackComments(trackId, 0, 50)
      .then(r => { setComments(r.data); onCountChange(r.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [trackId, onCountChange]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!user) { setShowLoginModal(true); return; }
    const content = text.trim();
    if (!content) return;
    setPosting(true);
    try {
      await postTrackComment(trackId, content);
      setText("");
      load();
    } catch {
      /* le champ garde le texte pour réessayer */
    } finally {
      setPosting(false);
    }
  };

  const remove = async (commentId: string) => {
    try { await deleteTrackComment(trackId, commentId); load(); } catch { /* pas grave, l'utilisateur peut réessayer */ }
  };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 210,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
      }}
    >
      <div style={{
        width: "100%", maxWidth: "480px", maxHeight: "70vh",
        display: "flex", flexDirection: "column",
        borderRadius: "20px 20px 0 0", background: "var(--bg2)",
        border: "1px solid rgba(240,235,227,0.1)", borderBottom: "none",
        overflow: "hidden", animation: "fadeUp 0.2s ease both",
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(240,235,227,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>Commentaires</p>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px" }}>
          {loading ? (
            <p style={{ color: "var(--muted)", fontSize: "13px", padding: "24px 0", textAlign: "center" }}>Chargement...</p>
          ) : comments.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: "13px", padding: "24px 0", textAlign: "center" }}>
              Aucun commentaire pour l'instant. Soyez le premier !
            </p>
          ) : comments.map(c => (
            <div key={c.id} style={{ display: "flex", gap: "10px", padding: "12px 0", borderBottom: "1px solid rgba(240,235,227,0.05)" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0, overflow: "hidden",
                background: "rgba(232,96,26,0.15)", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {c.userAvatar ? (
                  <img src={c.userAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--amber)" }}>{c.userName[0]}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>{c.userName}</span>
                  <span style={{ fontSize: "11px", color: "var(--muted)" }}>{timeAgo(c.createdAt)}</span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "2px", lineHeight: 1.5, wordBreak: "break-word" }}>{c.content}</p>
              </div>
              {user?.id === c.userId && (
                <button onClick={() => remove(c.id)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", flexShrink: 0, padding: "2px" }}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(240,235,227,0.07)", display: "flex", gap: "8px", flexShrink: 0 }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") submit(); }}
            placeholder={user ? "Ajouter un commentaire..." : "Connectez-vous pour commenter"}
            style={{
              flex: 1, padding: "10px 16px", borderRadius: "99px",
              background: "rgba(240,235,227,0.05)", border: "1px solid rgba(240,235,227,0.1)",
              color: "var(--text)", fontSize: "13px", outline: "none",
            }}
          />
          <button
            onClick={submit}
            disabled={posting}
            style={{
              width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
              background: "var(--amber)", border: "none", cursor: posting ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: posting ? 0.6 : 1,
            }}
          >
            <Send size={15} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}
