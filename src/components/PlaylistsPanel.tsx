import { useState, useEffect } from "react";
import {
  ListMusic,
  Plus,
  Trash2,
  Edit3,
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
import { useApp } from "../context/AppContext";
import ConfirmModal from "./ConfirmModal";

export default function PlaylistsPanel() {
  useApp();

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
    setSaving(true);
    try {
      await createPlaylist({
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        isPublic: formIsPublic,
      });
      await loadPlaylists();
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      console.error("Failed to create playlist:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editPlaylist || !formName.trim()) return;
    setSaving(true);
    try {
      await updatePlaylist(editPlaylist.id, {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        isPublic: formIsPublic,
      });
      await loadPlaylists();
      setEditPlaylist(null);
      resetForm();
    } catch (err) {
      console.error("Failed to update playlist:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      await deletePlaylist(id);
      await loadPlaylists();
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

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
        <Loader2 size={24} style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 className="bebas" style={{ fontSize: "36px", color: "var(--text)", lineHeight: 1 }}>Mes playlists</h1>
          <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>{playlists.length} playlist{playlists.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 18px", borderRadius: "99px", background: "var(--amber)", border: "none", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
          <Plus size={12} /> Nouvelle playlist
        </button>
      </div>

      {playlists.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <FolderOpen size={48} style={{ color: "var(--muted)", opacity: 0.3, marginBottom: "16px" }} />
          <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "16px" }}>Aucune playlist encore</p>
          <button onClick={() => setShowCreateModal(true)} style={{ padding: "10px 20px", borderRadius: "99px", background: "var(--amber)", border: "none", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Créer ma première playlist</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {playlists.map(playlist => (
            <div key={playlist.id} style={{ background: "rgba(240,235,227,0.03)", borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden" }}>
              {/* Cover */}
              <div style={{ height: "120px", background: "linear-gradient(135deg, rgba(232,96,26,0.15), rgba(201,147,10,0.08))", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <ListMusic size={32} style={{ color: "var(--amber)", opacity: 0.4 }} />
                <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", gap: "6px" }}>
                  <span style={{ padding: "4px 10px", borderRadius: "99px", fontSize: "10px", fontWeight: 700, background: playlist.isPublic ? "rgba(76,175,130,0.15)" : "rgba(240,235,227,0.1)", color: playlist.isPublic ? "#4caf82" : "var(--muted)", border: `1px solid ${playlist.isPublic ? "rgba(76,175,130,0.3)" : "var(--border)"}` }}>
                    {playlist.isPublic ? "Publique" : "Privée"}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>{playlist.name}</h3>
                <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "12px" }}>
                  {playlist.trackCount} morceau{playlist.trackCount !== 1 ? "x" : ""}
                </p>

                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <button onClick={() => setMenuOpen(menuOpen === playlist.id ? null : playlist.id)} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                      Actions
                    </button>
                    {menuOpen === playlist.id && (
                      <div style={{ position: "absolute", bottom: "40px", left: 0, right: 0, background: "var(--surface)", border: "1px solid rgba(240,235,227,0.1)", borderRadius: "10px", padding: "6px", zIndex: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
                        <button onClick={() => openEdit(playlist)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "6px", border: "none", background: "none", color: "var(--text)", fontSize: "12px", cursor: "pointer", width: "100%" }}>
                          <Edit3 size={12} /> Modifier
                        </button>
                        <button onClick={() => { setConfirmDelete(playlist); setMenuOpen(null); }} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "6px", border: "none", background: "none", color: "#f08080", fontSize: "12px", cursor: "pointer", width: "100%" }}>
                          <Trash2 size={12} /> Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editPlaylist) && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setShowCreateModal(false); setEditPlaylist(null); resetForm(); } }}
          style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "440px", maxHeight: "90vh", display: "flex", flexDirection: "column", borderRadius: "20px", background: "var(--bg2)", border: "1px solid rgba(240,235,227,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", overflow: "hidden", animation: "fadeUp 0.2s ease both" }}
          >
            <div style={{ height: "3px", background: "linear-gradient(90deg, var(--amber), var(--gold))" }} />
            <div style={{ padding: "24px 28px 28px" }}>
              <h2 className="bebas" style={{ fontSize: "24px", color: "var(--text)", marginBottom: "20px" }}>{editPlaylist ? "Modifier" : "Nouvelle playlist"}</h2>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "6px" }}>Nom *</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ma playlist" style={{ width: "100%", padding: "13px 16px", borderRadius: "10px", border: "1.5px solid rgba(240,235,227,0.1)", background: "rgba(240,235,227,0.05)", color: "var(--text)", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "6px" }}>Description</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Description optionnelle..." rows={3} style={{ width: "100%", padding: "13px 16px", borderRadius: "10px", border: "1.5px solid rgba(240,235,227,0.1)", background: "rgba(240,235,227,0.05)", color: "var(--text)", fontSize: "14px", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", color: "var(--text)" }}>
                  <input type="checkbox" checked={formIsPublic} onChange={e => setFormIsPublic(e.target.checked)} style={{ width: "18px", height: "18px", accentColor: "var(--amber)" }} />
                  Playlist publique
                </label>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button onClick={() => { setShowCreateModal(false); setEditPlaylist(null); resetForm(); }} style={{ padding: "12px 20px", borderRadius: "99px", border: "1px solid rgba(240,235,227,0.1)", background: "none", color: "var(--muted)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
                <button onClick={editPlaylist ? handleUpdate : handleCreate} disabled={!formName.trim() || saving} style={{ padding: "12px 24px", borderRadius: "99px", background: formName.trim() ? "var(--amber)" : "rgba(240,235,227,0.1)", color: formName.trim() ? "#fff" : "var(--muted)", border: "none", fontWeight: 700, fontSize: "13px", cursor: formName.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "8px" }}>
                  {saving && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                  {editPlaylist ? "Modifier" : "Créer"}
                </button>
              </div>
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
