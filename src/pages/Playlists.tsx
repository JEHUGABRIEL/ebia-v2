import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ListMusic,
  Plus,
  Music2,
  Clock,
  MoreVertical,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  Loader2,
  FolderOpen,
} from "lucide-react";
import {
  getMyPlaylists,
  createPlaylist,
  deletePlaylist,
  updatePlaylist,
  type Playlist,
} from "../lib/api";
import ConfirmModal from "../components/ConfirmModal";

export default function Playlists() {
  const navigate = useNavigate();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editPlaylist, setEditPlaylist] = useState<Playlist | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Playlist | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsPublic, setFormIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      const data = await getMyPlaylists();
      setPlaylists(data);
    } catch (err) {
      console.error("Failed to load playlists:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    try {
      setSaving(true);
      const newPlaylist = await createPlaylist({
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        isPublic: formIsPublic,
      });
      setPlaylists((prev) => [newPlaylist, ...prev]);
      resetForm();
      setShowCreateModal(false);
    } catch (err) {
      console.error("Failed to create playlist:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editPlaylist || !formName.trim()) return;
    try {
      setSaving(true);
      const updated = await updatePlaylist(editPlaylist.id, {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        isPublic: formIsPublic,
      });
      setPlaylists((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      resetForm();
      setEditPlaylist(null);
    } catch (err) {
      console.error("Failed to update playlist:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (playlistId: string) => {
    try {
      setDeleting(true);
      await deletePlaylist(playlistId);
      setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
      setMenuOpen(null);
    } catch (err) {
      console.error("Failed to delete playlist:", err);
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormIsPublic(true);
  };

  const openEdit = (playlist: Playlist) => {
    setFormName(playlist.name);
    setFormDescription(playlist.description || "");
    setFormIsPublic(playlist.isPublic);
    setEditPlaylist(playlist);
    setMenuOpen(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        paddingBottom: "120px",
      }}
    >
      {/* Header */}
      <section
        style={{
          padding: "120px 24px 40px",
          maxWidth: "1360px",
          margin: "0 auto",
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "5px 12px",
              borderRadius: "99px",
              border: "1px solid rgba(232,96,26,0.3)",
              marginBottom: "20px",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--amber)",
            }}
          >
            <ListMusic size={12} />
            Playlists
          </div>

          <h1
            className="bebas"
            style={{
              fontSize: "clamp(48px, 8vw, 96px)",
              color: "var(--text)",
              lineHeight: 0.92,
              marginBottom: "16px",
            }}
          >
            Mes Playlists
          </h1>

          <p
            style={{
              fontSize: "16px",
              color: "var(--muted)",
              maxWidth: "500px",
              lineHeight: 1.7,
              marginBottom: "32px",
            }}
          >
            Organisez vos titres favoris et partagez-les avec la communauté.
          </p>

          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "13px 24px",
              borderRadius: "99px",
              background: "var(--amber)",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: "13px",
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
            <Plus size={14} /> Créer une playlist
          </button>
        </div>
      </section>

      <div
        style={{ maxWidth: "1360px", margin: "0 auto", padding: "0 24px" }}
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 0",
            }}
          >
            <Loader2
              size={32}
              style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }}
            />
          </div>
        ) : playlists.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 0",
              textAlign: "center",
            }}
          >
            <FolderOpen
              size={64}
              style={{ color: "var(--muted)", opacity: 0.3, marginBottom: "24px" }}
            />
            <h3
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: "8px",
              }}
            >
              Aucune playlist
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "var(--muted)",
                marginBottom: "24px",
              }}
            >
              Créez votre première playlist pour organiser vos titres favoris.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                borderRadius: "99px",
                background: "var(--amber)",
                color: "#fff",
                border: "none",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <Plus size={14} /> Créer une playlist
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "16px",
            }}
          >
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                onClick={() => navigate(`/playlists/${playlist.id}`)}
                style={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  background: "rgba(240,235,227,0.03)",
                  border: "1px solid rgba(240,235,227,0.06)",
                  transition: "transform 0.2s, border-color 0.2s",
                  cursor: "pointer",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(-4px)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(232,96,26,0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(0)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(240,235,227,0.06)";
                }}
              >
                {/* Cover */}
                <div
                  style={{
                    height: "140px",
                    background:
                      "linear-gradient(135deg, rgba(232,96,26,0.15), rgba(201,147,10,0.08))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <ListMusic
                    size={40}
                    style={{ color: "var(--amber)", opacity: 0.4 }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    {playlist.isPublic ? (
                      <Eye size={14} style={{ color: "var(--muted)" }} />
                    ) : (
                      <EyeOff size={14} style={{ color: "var(--muted)" }} />
                    )}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(
                          menuOpen === playlist.id ? null : playlist.id
                        );
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <MoreVertical size={14} style={{ color: "var(--muted)" }} />
                    </div>
                  </div>

                  {/* Context Menu */}
                  {menuOpen === playlist.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: "absolute",
                        top: "36px",
                        right: "12px",
                        background: "var(--surface)",
                        border: "1px solid rgba(240,235,227,0.1)",
                        borderRadius: "12px",
                        padding: "8px",
                        minWidth: "140px",
                        zIndex: 10,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                      }}
                    >
                      <button
                        onClick={() => openEdit(playlist)}
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
                        onClick={() => { setConfirmDelete(playlist); setMenuOpen(null); }}
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

                {/* Info */}
                <div style={{ padding: "18px" }}>
                  <p
                    style={{
                      fontSize: "17px",
                      fontWeight: 700,
                      color: "var(--text)",
                      marginBottom: "4px",
                    }}
                  >
                    {playlist.name}
                  </p>
                  {playlist.description && (
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--muted)",
                        marginBottom: "12px",
                        lineHeight: 1.5,
                      }}
                    >
                      {playlist.description}
                    </p>
                  )}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      fontSize: "12px",
                      color: "var(--muted)",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Music2 size={12} /> {playlist.trackCount} titres
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={12} />{" "}
                      {new Date(playlist.updatedAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editPlaylist) && (
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
          onClick={() => {
            setShowCreateModal(false);
            setEditPlaylist(null);
            resetForm();
          }}
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
              {editPlaylist ? "Modifier la playlist" : "Nouvelle playlist"}
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
                onClick={() => {
                  setShowCreateModal(false);
                  setEditPlaylist(null);
                  resetForm();
                }}
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
                onClick={editPlaylist ? handleUpdate : handleCreate}
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
                {editPlaylist ? "Enregistrer" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDelete !== null}
        title="Supprimer la playlist"
        message={confirmDelete ? `« ${confirmDelete.name} » sera définitivement supprimée. Cette action est irréversible.` : ""}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
