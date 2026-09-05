import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Radio as RadioIcon, X } from "lucide-react";
import {
  getAdminRadios, createAdminRadio, updateAdminRadio, deleteAdminRadio,
  type RadioStationApi, type RadioStationInput,
} from "../../lib/api";
import { ICON_MAP, ICON_KEYS } from "../../data/radios";

const CATEGORIES = [
  { value: "info", label: "Info / Débats" },
  { value: "music", label: "Musique" },
  { value: "gospel", label: "Gospel / Spiritualité" },
  { value: "community", label: "Communauté" },
];

const EMPTY_FORM: RadioStationInput = {
  name: "", freq: "", description: "", longDescription: "", lang: "",
  color: "#E8601A", iconKey: "radio", homepage: "", streamUrl: "",
  category: "music", listeners: undefined, active: true, sortOrder: 0,
};

export default function AdminRadios() {
  const [stations, setStations] = useState<RadioStationApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RadioStationInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<RadioStationApi | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setLoadError(false);
    try { setStations(await getAdminRadios()); }
    catch { setLoadError(true); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setFormError(""); setModalOpen(true); };
  const openEdit = (s: RadioStationApi) => {
    setEditingId(s.id);
    setForm({
      name: s.name, freq: s.freq ?? "", description: s.description ?? "",
      longDescription: s.longDescription ?? "", lang: s.lang ?? "",
      color: s.color, iconKey: s.iconKey, homepage: s.homepage ?? "",
      streamUrl: s.streamUrl ?? "", category: s.category,
      listeners: s.listeners ?? undefined, active: s.active, sortOrder: s.sortOrder,
    });
    setFormError("");
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.name.trim()) { setFormError("Le nom est requis"); return; }
    setSaving(true); setFormError("");
    try {
      if (editingId) await updateAdminRadio(editingId, form);
      else await createAdminRadio(form);
      setModalOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: RadioStationApi) => {
    setBusyId(s.id);
    try { await updateAdminRadio(s.id, { active: !s.active }); await load(); }
    catch (e) { alert(e instanceof Error ? e.message : "Erreur"); }
    finally { setBusyId(null); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try { await deleteAdminRadio(deleteTarget.id); setDeleteTarget(null); await load(); }
    catch (e) { alert(e instanceof Error ? e.message : "Erreur"); }
    finally { setBusyId(null); }
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "11px 14px", borderRadius: "10px",
    border: "1.5px solid rgba(240,235,227,0.1)", background: "rgba(240,235,227,0.05)",
    color: "var(--text)", fontSize: "13px", outline: "none", boxSizing: "border-box",
  };
  const label: React.CSSProperties = {
    fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
    color: "var(--muted)", display: "block", marginBottom: "5px",
  };

  return (
    <div style={{ maxWidth: "1000px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 className="bebas" style={{ fontSize: "32px", color: "var(--text)", lineHeight: 1 }}>Radios</h1>
          <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>
            {stations.length} station{stations.length !== 1 ? "s" : ""} · {stations.filter(s => s.active).length} active{stations.filter(s => s.active).length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 18px", borderRadius: "99px", background: "var(--amber)", border: "none", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
          <Plus size={12} /> Nouvelle radio
        </button>
      </div>

      <div style={{ borderRadius: "16px", background: "rgba(240,235,227,0.02)", border: "1px solid var(--border)", minHeight: "160px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
            <Loader2 size={24} style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }} />
          </div>
        ) : loadError ? (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "14px" }}>Impossible de charger les radios.</p>
            <button onClick={load} style={{ padding: "8px 18px", borderRadius: "99px", border: "1px solid rgba(232,96,26,0.3)", background: "none", color: "var(--amber)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Réessayer</button>
          </div>
        ) : stations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <RadioIcon size={32} style={{ color: "var(--muted)", opacity: 0.4, marginBottom: "12px" }} />
            <p style={{ color: "var(--muted)", fontSize: "13px" }}>Aucune radio pour l'instant</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {stations.map((s, idx) => {
              const Icon = ICON_MAP[s.iconKey] ?? RadioIcon;
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", borderBottom: idx < stations.length - 1 ? "1px solid rgba(240,235,227,0.04)" : "none", opacity: s.active ? 1 : 0.5 }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={18} style={{ color: s.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{s.name}</p>
                    <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                      {s.freq || "—"} · {CATEGORIES.find(c => c.value === s.category)?.label ?? s.category}
                      {!s.streamUrl && <span style={{ color: "#f08080" }}> · pas d'URL de flux</span>}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    <button onClick={() => toggleActive(s)} disabled={busyId === s.id} title={s.active ? "Désactiver" : "Activer"}
                      style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(240,235,227,0.05)", border: "none", color: "var(--muted)", cursor: busyId === s.id ? "not-allowed" : "pointer" }}>
                      {s.active ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => openEdit(s)} title="Modifier"
                      style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(240,235,227,0.05)", border: "none", color: "var(--muted)", cursor: "pointer" }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(s)} title="Supprimer"
                      style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(220,50,50,0.08)", border: "none", color: "#f08080", cursor: "pointer" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL CRÉER / MODIFIER ── */}
      {modalOpen && (
        <div onClick={e => { if (e.target === e.currentTarget && !saving) setModalOpen(false); }}
          style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}>
          <div style={{ width: "100%", maxWidth: "540px", maxHeight: "90vh", display: "flex", flexDirection: "column", borderRadius: "20px", background: "var(--bg2)", border: "1px solid rgba(240,235,227,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", overflow: "hidden" }}>
            <div style={{ height: "3px", background: "linear-gradient(90deg, var(--amber), var(--gold))" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0" }}>
              <h2 className="bebas" style={{ fontSize: "22px", color: "var(--text)" }}>{editingId ? "Modifier la radio" : "Nouvelle radio"}</h2>
              <button onClick={() => setModalOpen(false)} disabled={saving} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><X size={16} /></button>
            </div>
            <div style={{ padding: "16px 24px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
              {formError && (
                <div style={{ padding: "10px 14px", borderRadius: "9px", background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.2)", color: "#f08080", fontSize: "12px" }}>⚠️ {formError}</div>
              )}
              <div>
                <label style={label}>Nom *</label>
                <input value={form.name ?? ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inp} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={label}>Fréquence</label>
                  <input value={form.freq ?? ""} onChange={e => setForm(f => ({ ...f, freq: e.target.value }))} placeholder="Ex: 98.9 FM" style={inp} />
                </div>
                <div>
                  <label style={label}>Catégorie</label>
                  <select value={form.category ?? "music"} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inp}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={label}>Description courte</label>
                <input value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={label}>Description longue</label>
                <textarea value={form.longDescription ?? ""} onChange={e => setForm(f => ({ ...f, longDescription: e.target.value }))} rows={3} style={{ ...inp, resize: "vertical" as const }} />
              </div>
              <div>
                <label style={label}>URL du flux audio</label>
                <input value={form.streamUrl ?? ""} onChange={e => setForm(f => ({ ...f, streamUrl: e.target.value }))} placeholder="https://stream.example.com/..." style={inp} />
              </div>
              <div>
                <label style={label}>Site web</label>
                <input value={form.homepage ?? ""} onChange={e => setForm(f => ({ ...f, homepage: e.target.value }))} placeholder="https://..." style={inp} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={label}>Langue</label>
                  <input value={form.lang ?? ""} onChange={e => setForm(f => ({ ...f, lang: e.target.value }))} placeholder="Français" style={inp} />
                </div>
                <div>
                  <label style={label}>Couleur</label>
                  <input type="color" value={form.color ?? "#E8601A"} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ ...inp, padding: "4px", height: "40px" }} />
                </div>
                <div>
                  <label style={label}>Icône</label>
                  <select value={form.iconKey ?? "radio"} onChange={e => setForm(f => ({ ...f, iconKey: e.target.value }))} style={inp}>
                    {ICON_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px", background: "rgba(240,235,227,0.03)", border: "1px solid rgba(240,235,227,0.08)" }}>
                <input id="radio-active" type="checkbox" checked={form.active ?? true} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} style={{ width: "16px", height: "16px", accentColor: "var(--amber)", cursor: "pointer" }} />
                <label htmlFor="radio-active" style={{ fontSize: "13px", color: "var(--text)", cursor: "pointer" }}>Visible publiquement</label>
              </div>
              <button onClick={save} disabled={saving} style={{
                padding: "14px", borderRadius: "12px", border: "none", marginTop: "4px",
                background: saving ? "rgba(232,96,26,0.4)" : "var(--amber)",
                color: "#fff", fontSize: "12px", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase",
                cursor: saving ? "not-allowed" : "pointer",
              }}>
                {saving ? "Enregistrement…" : editingId ? "Enregistrer" : "Créer la radio"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRMATION SUPPRESSION ── */}
      {deleteTarget && (
        <div onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
          style={{ position: "fixed", inset: 0, zIndex: 210, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}>
          <div style={{ width: "100%", maxWidth: "400px", borderRadius: "18px", background: "var(--bg2)", border: "1px solid rgba(240,235,227,0.1)", padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>Supprimer « {deleteTarget.name} » ?</h3>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "20px" }}>Cette action est irréversible.</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: "9px 16px", borderRadius: "9px", background: "none", border: "1px solid var(--border)", color: "var(--muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
              <button onClick={confirmDelete} disabled={busyId === deleteTarget.id} style={{ padding: "9px 16px", borderRadius: "9px", background: "#f08080", border: "none", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
