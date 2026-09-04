import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ListMusic,
  ArrowLeft,
  Play,
  Trash2,
  Clock,
  Music2,
  Loader2,
  MoreVertical,
  Edit3,
  Eye,
  EyeOff,
  Users,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  getPlaylist,
  updatePlaylist,
  deletePlaylist,
  removeTrackFromPlaylist,
  recordPlay,
  type Playlist,
  type PlaylistTrackItem,
} from "../lib/api";
import CollaboratorsPanel from "../components/CollaboratorsPanel";
import ConfirmModal from "../components/ConfirmModal";

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { } = useTranslation();
  const { user, playTrack, currentTrack, isPlaying } = useApp();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [confirmDeletePlaylist, setConfirmDeletePlaylist] = useState(false);
  const [deletingPlaylist, setDeletingPlaylist] = useState(false);
  const [confirmRemoveTrack, setConfirmRemoveTrack] = useState<{ trackId: string; title: string } | null>(null);

  // Edit form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsPublic, setFormIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) loadPlaylist();
  }, [id]);

  const loadPlaylist = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getPlaylist(id);
      setPlaylist(data);
    } catch (err) {
      console.error("Failed to load playlist:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = async (track: PlaylistTrackItem) => {
    try {
      await recordPlay(track.trackId);
    } catch {}
    playTrack({
      id: track.trackId,
      title: track.trackTitle,
      artistName: track.artistName,
    } as any);
  };

  const handleRemoveTrack = async (trackId: string) => {
    if (!id) return;
    try {
      const updated = await removeTrackFromPlaylist(id, trackId);
      setPlaylist(updated);
    } catch (err) {
      console.error("Failed to remove track:", err);
    } finally {
      setConfirmRemoveTrack(null);
    }
  };

  const handleUpdate = async () => {
    if (!id || !formName.trim()) return;
    try {
      setSaving(true);
      const updated = await updatePlaylist(id, {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        isPublic: formIsPublic,
      });
      setPlaylist(updated);
      setShowEditModal(false);
    } catch (err) {
      console.error("Failed to update playlist:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      setDeletingPlaylist(true);
      await deletePlaylist(id);
      navigate("/playlists");
    } catch (err) {
      console.error("Failed to delete playlist:", err);
      setDeletingPlaylist(false);
    }
  };

  const openEdit = () => {
    if (!playlist) return;
    setFormName(playlist.name);
    setFormDescription(playlist.description || "");
    setFormIsPublic(playlist.isPublic);
    setShowEditModal(true);
    setMenuOpen(false);
  };

  const isCurrentTrack = (track: PlaylistTrackItem) =>
    currentTrack?.id === track.trackId;

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2
          size={32}
          style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }}
        />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Music2 size={64} style={{ color: "var(--muted)", opacity: 0.3 }} />
        <p style={{ fontSize: "16px", color: "var(--muted)", marginTop: "16px" }}>
          Playlist non trouvée
        </p>
        <button
          onClick={() => navigate("/playlists")}
          style={{
            marginTop: "16px",
            padding: "10px 20px",
            borderRadius: "99px",
            background: "var(--amber)",
            color: "#fff",
            border: "none",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Retour aux playlists
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "120px" }}>
      {/* Header */}
      <section
        style={{
          padding: "100px 24px 40px",
          maxWidth: "1360px",
          margin: "0 auto",
        }}
      >
        <button
          onClick={() => navigate("/playlists")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: "var(--muted)",
            fontSize: "13px",
            cursor: "pointer",
            marginBottom: "24px",
          }}
        >
          <ArrowLeft size={16} /> Retour
        </button>

        <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
          {/* Cover */}
          <div
            style={{
              width: "200px",
              height: "200px",
              borderRadius: "16px",
              background:
                "linear-gradient(135deg, rgba(232,96,26,0.15), rgba(201,147,10,0.08))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ListMusic size={64} style={{ color: "var(--amber)", opacity: 0.4 }} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "99px",
                  background: "rgba(240,235,227,0.05)",
                  color: "var(--muted)",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Playlist
              </span>
              {playlist.isPublic ? (
                <Eye size={12} style={{ color: "var(--muted)" }} />
              ) : (
                <EyeOff size={12} style={{ color: "var(--muted)" }} />
              )}
            </div>

            <h1
              className="bebas"
              style={{
                fontSize: "clamp(36px, 6vw, 64px)",
                color: "var(--text)",
                lineHeight: 0.95,
                marginBottom: "12px",
              }}
            >
              {playlist.name}
            </h1>

            {playlist.description && (
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--muted)",
                  marginBottom: "16px",
                  lineHeight: 1.6,
                }}
              >
                {playlist.description}
              </p>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                fontSize: "13px",
                color: "var(--muted)",
              }}
            >
              <span>{playlist.trackCount} titres</span>
              <span>•</span>
              <span>Créée le {new Date(playlist.createdAt).toLocaleDateString("fr-FR")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div
        style={{
          maxWidth: "1360px",
          margin: "0 auto",
          padding: "0 24px 24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        {playlist.tracks && playlist.tracks.length > 0 && (
          <button
            onClick={() => handlePlayTrack(playlist.tracks[0])}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "13px 28px",
              borderRadius: "99px",
              background: "var(--amber)",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              transition: "box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 8px 24px rgba(232,96,26,0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            <Play size={16} fill="currentColor" /> Tout lire
          </button>
        )}

        {playlist.ownerId === user?.id && (
          <button
            onClick={() => { setShowCollaborators(true); setMenuOpen(false); }}
            style={{
              padding: "13px",
              borderRadius: "50%",
              background: "rgba(240,235,227,0.05)",
              border: "1px solid rgba(240,235,227,0.1)",
              color: "var(--muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Gérer les collaborateurs"
          >
            <Users size={18} />
          </button>
        )}

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              padding: "13px",
              borderRadius: "50%",
              background: "rgba(240,235,227,0.05)",
              border: "1px solid rgba(240,235,227,0.1)",
              color: "var(--muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MoreVertical size={18} />
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "48px",
                right: 0,
                background: "var(--surface)",
                border: "1px solid rgba(240,235,227,0.1)",
                borderRadius: "12px",
                padding: "8px",
                minWidth: "160px",
                zIndex: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              }}
            >
              <button
                onClick={openEdit}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: "none",
                  color: "var(--text)",
                  fontSize: "13px",
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <Edit3 size={14} /> Modifier
              </button>
              <button
                onClick={() => setConfirmDeletePlaylist(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: "none",
                  color: "#EF4444",
                  fontSize: "13px",
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <Trash2 size={14} /> Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Track List */}
      <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "0 24px" }}>
        {!playlist.tracks || playlist.tracks.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
            }}
          >
            <Music2
              size={48}
              style={{ color: "var(--muted)", opacity: 0.3, marginBottom: "16px" }}
            />
            <p style={{ fontSize: "14px", color: "var(--muted)" }}>
              Aucun titre dans cette playlist
            </p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr 1fr 100px 50px",
                gap: "16px",
                padding: "12px 16px",
                borderBottom: "1px solid rgba(240,235,227,0.06)",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <span>#</span>
              <span>Titre</span>
              <span>Artiste</span>
              <span style={{ textAlign: "right" }}>
                <Clock size={12} />
              </span>
              <span />
            </div>

            {/* Tracks */}
            {playlist.tracks
              .sort((a, b) => a.position - b.position)
              .map((track, index) => (
                <div
                  key={track.id}
                  onClick={() => handlePlayTrack(track)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "40px 1fr 1fr 100px 50px",
                    gap: "16px",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "background 0.15s",
                    background: isCurrentTrack(track)
                      ? "rgba(232,96,26,0.1)"
                      : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrentTrack(track))
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(240,235,227,0.03)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrentTrack(track))
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      color: isCurrentTrack(track) ? "var(--amber)" : "var(--muted)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {isCurrentTrack(track) && isPlaying ? (
                      <Music2 size={14} style={{ color: "var(--amber)" }} />
                    ) : (
                      index + 1
                    )}
                  </span>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "6px",
                        background: "rgba(240,235,227,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Music2 size={16} style={{ color: "var(--muted)" }} />
                    </div>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: isCurrentTrack(track) ? "var(--amber)" : "var(--text)",
                      }}
                    >
                      {track.trackTitle}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: "13px",
                      color: "var(--muted)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {track.artistName}
                  </span>

                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--muted)",
                      textAlign: "right",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                    }}
                  >
                    {new Date(track.addedAt).toLocaleDateString("fr-FR")}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmRemoveTrack({ trackId: track.trackId, title: track.trackTitle });
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--muted)",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "#EF4444";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "var(--muted)";
                    }}
                    title="Retirer de la playlist"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Collaborators Panel */}
      {showCollaborators && (
        <CollaboratorsPanel
          playlistId={playlist.id}
          isOwner={playlist.ownerId === user?.id}
          onClose={() => setShowCollaborators(false)}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "24px",
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              borderRadius: "20px",
              padding: "32px",
              width: "100%",
              maxWidth: "440px",
              border: "1px solid rgba(240,235,227,0.1)",
            }}
          >
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 800,
                color: "var(--text)",
                marginBottom: "24px",
              }}
            >
              Modifier la playlist
            </h2>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--muted)",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Nom *
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ma playlist"
                maxLength={100}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(240,235,227,0.1)",
                  background: "rgba(240,235,227,0.03)",
                  color: "var(--text)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--muted)",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Description
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Description optionnelle..."
                maxLength={500}
                rows={3}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(240,235,227,0.1)",
                  background: "rgba(240,235,227,0.03)",
                  color: "var(--text)",
                  fontSize: "14px",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "var(--text)",
                }}
              >
                <input
                  type="checkbox"
                  checked={formIsPublic}
                  onChange={(e) => setFormIsPublic(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "var(--amber)" }}
                />
                Playlist publique
              </label>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  padding: "12px 20px",
                  borderRadius: "99px",
                  border: "1px solid rgba(240,235,227,0.1)",
                  background: "none",
                  color: "var(--muted)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleUpdate}
                disabled={!formName.trim() || saving}
                style={{
                  padding: "12px 24px",
                  borderRadius: "99px",
                  background: formName.trim() ? "var(--amber)" : "rgba(240,235,227,0.1)",
                  color: formName.trim() ? "#fff" : "var(--muted)",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: formName.trim() ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {saving && (
                  <Loader2
                    size={14}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                )}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDeletePlaylist}
        title="Supprimer la playlist"
        message={playlist ? `« ${playlist.name} » sera définitivement supprimée. Cette action est irréversible.` : ""}
        confirmLabel="Supprimer"
        loading={deletingPlaylist}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeletePlaylist(false)}
      />
      <ConfirmModal
        open={confirmRemoveTrack !== null}
        title="Retirer le titre"
        message={confirmRemoveTrack ? `« ${confirmRemoveTrack.title} » sera retiré de cette playlist.` : ""}
        confirmLabel="Retirer"
        onConfirm={() => confirmRemoveTrack && handleRemoveTrack(confirmRemoveTrack.trackId)}
        onCancel={() => setConfirmRemoveTrack(null)}
      />
    </div>
  );
}
