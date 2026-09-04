import { useEffect, useState } from "react";
import {
  getMyAlbums,
  createAlbum,
  deleteAlbum,
  addTrackToAlbum,
  removeTrackFromAlbum,
  type Album,
  type MyTrack,
} from "../lib/api";
import { Disc, Plus, Trash2, Music2, Loader2, X, Check } from "lucide-react";

type Props = {
  tracks: MyTrack[];
};

export default function AlbumSection({ tracks }: Props) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [error, setError] = useState("");

  // Create form
  const [formTitle, setFormTitle] = useState("");
  const [formGenre, setFormGenre] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    try {
      const data = await getMyAlbums();
      setAlbums(data);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formTitle.trim()) return;
    setSaving(true);
    setError("");
    try {
      await createAlbum({ title: formTitle.trim(), genre: formGenre || undefined, description: formDescription || undefined });
      await loadAlbums();
      setShowCreateModal(false);
      setFormTitle("");
      setFormGenre("");
      setFormDescription("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (albumId: string) => {
    if (!window.confirm("Supprimer cet album ?")) return;
    try {
      await deleteAlbum(albumId);
      await loadAlbums();
      if (selectedAlbum?.id === albumId) setSelectedAlbum(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  };

  const handleAddTrack = async (albumId: string, trackId: string) => {
    try {
      await addTrackToAlbum(albumId, trackId);
      await loadAlbums();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  };

  const handleRemoveTrack = async (albumId: string, trackId: string) => {
    try {
      await removeTrackFromAlbum(albumId, trackId);
      await loadAlbums();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  };

  const tracksNotInAlbum = (album: Album) => {
    const albumTrackIds = new Set(album.tracks.map(t => t.trackId));
    return tracks.filter(t => !albumTrackIds.has(t.id));
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
          <h1 className="bebas" style={{ fontSize: "36px", color: "var(--text)", lineHeight: 1 }}>Mes albums</h1>
          <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>{albums.length} album{albums.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 18px", borderRadius: "99px", background: "var(--amber)", border: "none", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
          <Plus size={12} /> Nouvel album
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(220,50,50,0.08)", color: "#f08080", fontSize: "13px", marginBottom: "16px" }}>{error}</div>
      )}

      {albums.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Disc size={48} style={{ color: "var(--muted)", opacity: 0.3, marginBottom: "16px" }} />
          <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "16px" }}>Aucun album encore</p>
          <button onClick={() => setShowCreateModal(true)} style={{ padding: "10px 20px", borderRadius: "99px", background: "var(--amber)", border: "none", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Créer mon premier album</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {albums.map(album => (
            <div key={album.id} style={{ background: "rgba(240,235,227,0.03)", borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden" }}>
              {/* Cover */}
              <div style={{ height: "140px", background: album.coverUrl ? `url(${album.coverUrl}) center/cover` : "linear-gradient(135deg, rgba(232,96,26,0.15), rgba(201,147,10,0.08))", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                {!album.coverUrl && <Disc size={40} style={{ color: "var(--amber)", opacity: 0.4 }} />}
                <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", gap: "6px" }}>
                  <span style={{ padding: "4px 10px", borderRadius: "99px", fontSize: "10px", fontWeight: 700, background: album.isPublished ? "rgba(76,175,130,0.15)" : "rgba(240,235,227,0.1)", color: album.isPublished ? "#4caf82" : "var(--muted)", border: `1px solid ${album.isPublished ? "rgba(76,175,130,0.3)" : "var(--border)"}` }}>
                    {album.isPublished ? "Publié" : "Brouillon"}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>{album.title}</h3>
                <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "12px" }}>
                  {album.genre || "Non spécifié"} · {album.trackCount} morceau{album.trackCount !== 1 ? "x" : ""}
                </p>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setSelectedAlbum(selectedAlbum?.id === album.id ? null : album)} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    <Music2 size={12} /> Morceaux
                  </button>
                  <button onClick={() => handleDelete(album.id)} style={{ padding: "8px 12px", borderRadius: "8px", border: "none", background: "rgba(220,50,50,0.1)", color: "#f08080", cursor: "pointer" }}>
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Expanded track list */}
                {selectedAlbum?.id === album.id && (
                  <div style={{ marginTop: "12px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Dans cet album</p>
                    {album.tracks.length === 0 ? (
                      <p style={{ fontSize: "12px", color: "var(--muted)" }}>Aucun morceau</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {album.tracks.map(t => {
                          const track = tracks.find(tr => tr.id === t.trackId);
                          return (
                            <div key={t.trackId} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 8px", borderRadius: "6px", background: "rgba(240,235,227,0.03)" }}>
                              <span style={{ fontSize: "11px", color: "var(--muted)", width: "20px" }}>{t.position + 1}</span>
                              <span style={{ fontSize: "12px", color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track?.title || "Titre inconnu"}</span>
                              <button onClick={() => handleRemoveTrack(album.id, t.trackId)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "2px" }}>
                                <X size={12} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add track */}
                    {tracksNotInAlbum(album).length > 0 && (
                      <div style={{ marginTop: "8px" }}>
                        <p style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "4px" }}>Ajouter un morceau</p>
                        <select onChange={(e) => { if (e.target.value) { handleAddTrack(album.id, e.target.value); e.target.value = ""; } }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border)", background: "rgba(240,235,227,0.05)", color: "var(--text)", fontSize: "11px" }}>
                          <option value="">Sélectionner...</option>
                          {tracksNotInAlbum(album).map(t => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Album Modal */}
      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "24px" }} onClick={() => setShowCreateModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "440px", border: "1px solid rgba(240,235,227,0.1)" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)", marginBottom: "24px" }}>Nouvel album</h2>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "6px" }}>Titre *</label>
              <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Mon album" style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(240,235,227,0.1)", background: "rgba(240,235,227,0.03)", color: "var(--text)", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "6px" }}>Genre</label>
              <input type="text" value={formGenre} onChange={e => setFormGenre(e.target.value)} placeholder="Afro-Pop, Hip-Hop..." style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(240,235,227,0.1)", background: "rgba(240,235,227,0.03)", color: "var(--text)", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "6px" }}>Description</label>
              <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Description optionnelle..." rows={3} style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(240,235,227,0.1)", background: "rgba(240,235,227,0.03)", color: "var(--text)", fontSize: "14px", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowCreateModal(false)} style={{ padding: "12px 20px", borderRadius: "99px", border: "1px solid rgba(240,235,227,0.1)", background: "none", color: "var(--muted)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
              <button onClick={handleCreate} disabled={!formTitle.trim() || saving} style={{ padding: "12px 24px", borderRadius: "99px", background: formTitle.trim() ? "var(--amber)" : "rgba(240,235,227,0.1)", color: formTitle.trim() ? "#fff" : "var(--muted)", border: "none", fontWeight: 700, fontSize: "13px", cursor: formTitle.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "8px" }}>
                {saving && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                <Check size={14} /> Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
