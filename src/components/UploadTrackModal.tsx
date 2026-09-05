import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, FileAudio, X, AlertCircle, Check, Camera, Crown, Phone } from "lucide-react";
import { uploadTrack } from "../lib/api";

const GENRES = ["Afro-Pop","Afro-Folk","Hip-Hop","Afro-Trap","Jazz / Blues","Gospel","Soukous","R&B","Traditionnel","Soul","Afro-Beat"];

interface UploadTrackModalProps {
  open: boolean;
  isFreeTierFull: boolean;
  freeSlotsLeft: number;
  phoneComplete: boolean;
  onClose: () => void;
  onUploaded: () => void;
  onViewTracks: () => void;
  onGoToProfile: () => void;
}

export default function UploadTrackModal({ open, isFreeTierFull, freeSlotsLeft, phoneComplete, onClose, onUploaded, onViewTracks, onGoToProfile }: UploadTrackModalProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadAlbum, setUploadAlbum] = useState("");
  const [uploadGenre, setUploadGenre] = useState("");
  const [uploadReleaseDate, setUploadReleaseDate] = useState("");
  const [uploadStep, setUploadStep] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");

  const audioRef = useRef<HTMLInputElement>(null);
  const coverUpRef = useRef<HTMLInputElement>(null);

  const resetUpload = useCallback(() => {
    setAudioFile(null); setCoverFile(null); setCoverPreview(null);
    setUploadTitle(""); setUploadAlbum(""); setUploadGenre(""); setUploadReleaseDate("");
    setUploadStep("idle"); setUploadProgress(0); setUploadError("");
  }, []);

  const handleClose = useCallback(() => { resetUpload(); onClose(); }, [resetUpload, onClose]);

  /* Fermer avec la touche Échap (désactivé pendant l'upload) */
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && uploadStep !== "uploading") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, uploadStep, handleClose]);

  if (!open) return null;

  const inp: React.CSSProperties = {
    width: "100%", padding: "13px 16px", borderRadius: "10px",
    border: "1.5px solid rgba(240,235,227,0.1)", background: "rgba(240,235,227,0.05)",
    color: "var(--text)", fontSize: "14px", outline: "none",
    boxSizing: "border-box", transition: "border-color 0.2s",
  };
  const fa = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => (e.target.style.borderColor = "var(--amber)");
  const fb = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => (e.target.style.borderColor = "rgba(240,235,227,0.1)");

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setCoverFile(f);
    const r = new FileReader(); r.onload = ev => setCoverPreview(ev.target?.result as string); r.readAsDataURL(f);
  };

  const handleUpload = async () => {
    if (!audioFile || !uploadTitle || !uploadGenre) return;
    if (isFreeTierFull) { setUploadError("Limite de 5 titres gratuits atteinte. Passez en Pro."); return; }

    setUploadStep("uploading"); setUploadProgress(0); setUploadError("");
    const fd = new FormData();
    fd.append("audio", audioFile);
    fd.append("title", uploadTitle);
    fd.append("genre", uploadGenre);
    if (uploadAlbum) fd.append("album_name", uploadAlbum);
    if (coverFile) fd.append("cover", coverFile);
    if (uploadReleaseDate) fd.append("release_date", uploadReleaseDate);

    /* Simuler progression (le vrai upload n'a pas d'événements progress sans XHR) */
    const interval = setInterval(() => setUploadProgress(p => Math.min(p + 8, 85)), 300);
    try {
      await uploadTrack(fd);
      clearInterval(interval); setUploadProgress(100);
      setTimeout(() => { setUploadStep("done"); onUploaded(); }, 400);
    } catch (e: unknown) {
      clearInterval(interval); setUploadStep("error");
      setUploadError(e instanceof Error ? e.message : "Erreur upload");
    }
  };

  const label: React.CSSProperties = {
    fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
    color: "var(--muted)", display: "block", marginBottom: "5px",
  };

  return (
    <div onClick={e => { if (e.target === e.currentTarget && uploadStep !== "uploading") handleClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}>
      <div style={{ width: "100%", maxWidth: "560px", maxHeight: "90vh", display: "flex", flexDirection: "column", borderRadius: "20px", background: "var(--bg2)", border: "1px solid rgba(240,235,227,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", overflow: "hidden", animation: "fadeUp 0.2s ease both" }}>
        <div style={{ height: "3px", background: "linear-gradient(90deg, var(--amber), var(--gold))" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 28px 0" }}>
          <div>
            <h2 className="bebas" style={{ fontSize: "24px", color: "var(--text)", lineHeight: 1 }}>Uploader un titre</h2>
            <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>MP3, WAV, FLAC · max 50 Mo</p>
          </div>
          {uploadStep !== "uploading" && (
            <button onClick={handleClose} style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", transition: "all 0.15s", flexShrink: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.06)"; (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: "20px 28px 28px", overflowY: "auto" }}>

          {!phoneComplete ? (
            <div style={{ padding: "32px 16px", borderRadius: "16px", textAlign: "center", background: "rgba(232,96,26,0.05)", border: "1px solid rgba(232,96,26,0.2)" }}>
              <Phone size={40} style={{ color: "var(--amber)", margin: "0 auto 16px" }} />
              <h2 className="bebas" style={{ fontSize: "26px", color: "var(--text)", marginBottom: "8px" }}>Coordonnées requises</h2>
              <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "24px", lineHeight: 1.65 }}>
                Ajoutez votre numéro de contact et votre numéro Mobile Money dans votre profil avant de publier un titre — ils nous permettent de vous contacter et de vous payer.
              </p>
              <button onClick={onGoToProfile} style={{ padding: "14px 28px", borderRadius: "99px", background: "var(--amber)", border: "none", color: "#fff", fontSize: "13px", fontWeight: 800, cursor: "pointer" }}>
                Compléter mon profil →
              </button>
            </div>
          ) : isFreeTierFull ? (
            <div style={{ padding: "32px 16px", borderRadius: "16px", textAlign: "center", background: "rgba(232,96,26,0.05)", border: "1px solid rgba(232,96,26,0.2)" }}>
              <Crown size={40} style={{ color: "var(--amber)", margin: "0 auto 16px" }} />
              <h2 className="bebas" style={{ fontSize: "26px", color: "var(--text)", marginBottom: "8px" }}>Passez en Pro</h2>
              <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "24px", lineHeight: 1.65 }}>
                Vous avez utilisé vos 5 titres gratuits. Passez au plan Pro pour publier un nombre illimité de titres, accéder aux analytics avancés et bien plus.
              </p>
              <button style={{ padding: "14px 28px", borderRadius: "99px", background: "var(--amber)", border: "none", color: "#fff", fontSize: "13px", fontWeight: 800, cursor: "pointer" }}>
                Découvrir le plan Pro →
              </button>
            </div>
          ) : uploadStep === "done" ? (
            <div style={{ padding: "40px 16px", borderRadius: "16px", textAlign: "center", background: "rgba(76,175,130,0.06)", border: "1px solid rgba(76,175,130,0.2)" }}>
              <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(76,175,130,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Check size={26} style={{ color: "#4caf82" }} />
              </div>
              <h2 className="bebas" style={{ fontSize: "26px", color: "var(--text)", marginBottom: "8px" }}>Titre publié !</h2>
              <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "24px" }}>"{uploadTitle}" est maintenant disponible.</p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button onClick={resetUpload} style={{ padding: "11px 20px", borderRadius: "10px", background: "var(--amber)", border: "none", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Uploader un autre</button>
                <button onClick={() => { resetUpload(); onViewTracks(); }} style={{ padding: "11px 20px", borderRadius: "10px", background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Voir mes titres</button>
              </div>
            </div>
          ) : uploadStep === "uploading" ? (
            <div style={{ padding: "40px 16px", borderRadius: "16px", textAlign: "center", background: "rgba(240,235,227,0.03)", border: "1px solid var(--border)" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(232,96,26,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Upload size={22} style={{ color: "var(--amber)" }} />
              </div>
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>Upload en cours…</h2>
              <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "20px" }}>{uploadTitle}</p>
              <div style={{ height: "6px", borderRadius: "99px", background: "rgba(240,235,227,0.08)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${uploadProgress}%`, background: "var(--amber)", borderRadius: "99px", transition: "width 0.3s" }} />
              </div>
              <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "8px" }}>{Math.round(uploadProgress)}%</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              {!isFreeTierFull && freeSlotsLeft > 0 && (
                <div style={{ padding: "9px 14px", borderRadius: "9px", background: "rgba(232,96,26,0.07)", border: "1px solid rgba(232,96,26,0.18)", fontSize: "11px", color: "rgba(240,235,227,0.6)" }}>
                  {freeSlotsLeft} titre{freeSlotsLeft > 1 ? "s" : ""} gratuit{freeSlotsLeft > 1 ? "s" : ""} restant{freeSlotsLeft > 1 ? "s" : ""} sur le plan gratuit
                </div>
              )}

              {uploadStep === "error" && uploadError && (
                <div style={{ padding: "11px 14px", borderRadius: "9px", background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.2)", color: "#f08080", fontSize: "12px" }}>⚠️ {uploadError}</div>
              )}

              {/* Drop zone audio */}
              <div onClick={() => audioRef.current?.click()} style={{ padding: "28px", borderRadius: "12px", textAlign: "center", cursor: "pointer", border: `2px dashed ${audioFile ? "var(--amber)" : "rgba(240,235,227,0.15)"}`, background: audioFile ? "rgba(232,96,26,0.05)" : "rgba(240,235,227,0.02)", transition: "all 0.2s" }}
                onMouseEnter={e => { if (!audioFile) (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.3)"; }}
                onMouseLeave={e => { if (!audioFile) (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.15)"; }}>
                <input ref={audioRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={e => setAudioFile(e.target.files?.[0] ?? null)} />
                {audioFile ? (
                  <div>
                    <FileAudio size={28} style={{ color: "var(--amber)", margin: "0 auto 8px" }} />
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>{audioFile.name}</p>
                    <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{(audioFile.size / 1024 / 1024).toFixed(1)} Mo</p>
                    <button onClick={e => { e.stopPropagation(); setAudioFile(null); }} style={{ marginTop: "8px", background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", gap: "3px", margin: "8px auto 0" }}>
                      <X size={11} /> Changer
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload size={24} style={{ color: "var(--muted)", margin: "0 auto 8px" }} />
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "3px" }}>Sélectionner un fichier audio *</p>
                    <p style={{ fontSize: "11px", color: "var(--muted)" }}>MP3, WAV, FLAC · max 50 Mo</p>
                  </div>
                )}
              </div>

              {/* Titre */}
              <div>
                <label style={label}>Titre du morceau *</label>
                <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Ex: On va se marier" style={inp} onFocus={fa} onBlur={fb} />
              </div>

              {/* Genre */}
              <div>
                <label style={label}>Genre musical *</label>
                <select value={uploadGenre} onChange={e => setUploadGenre(e.target.value)} style={{ ...inp, appearance: "none" as const }} onFocus={fa} onBlur={fb}>
                  <option value="">Choisir un genre</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* Album */}
              <div>
                <label style={label}>Nom de l'album <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--muted)" }}>(optionnel)</span></label>
                <input value={uploadAlbum} onChange={e => setUploadAlbum(e.target.value)} placeholder="Ex: Premier Souffle" style={inp} onFocus={fa} onBlur={fb} />
              </div>

              {/* Date de sortie */}
              <div>
                <label style={label}>Date de sortie <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--muted)" }}>(optionnel)</span></label>
                <input type="date" value={uploadReleaseDate} onChange={e => setUploadReleaseDate(e.target.value)} max={new Date().toISOString().split('T')[0]} style={inp} onFocus={fa} onBlur={fb} />
                <p style={{ fontSize: "10px", color: "var(--muted)", marginTop: "4px" }}>Détermine la section Tendances ou Rétro sur la page d'accueil</p>
              </div>

              {/* Cover album */}
              <div>
                <label style={label}>Photo de l'album <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--muted)" }}>(optionnel)</span></label>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div onClick={() => coverUpRef.current?.click()} style={{ width: "72px", height: "72px", borderRadius: "10px", overflow: "hidden", border: `2px dashed ${coverPreview ? "var(--amber)" : "rgba(240,235,227,0.15)"}`, background: "rgba(240,235,227,0.03)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "border-color 0.2s" }}>
                    {coverPreview
                      ? <img src={coverPreview} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <Camera size={20} style={{ color: "var(--muted)" }} />
                    }
                    <input ref={coverUpRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverChange} />
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>
                    {coverPreview ? "Photo sélectionnée — cliquez pour changer" : "JPG ou PNG · min 500×500px recommandé"}
                  </p>
                </div>
              </div>

              {/* Droits */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "9px", padding: "11px 14px", borderRadius: "10px", background: "rgba(201,147,10,0.06)", border: "1px solid rgba(201,147,10,0.18)" }}>
                <AlertCircle size={13} style={{ color: "var(--gold)", flexShrink: 0, marginTop: "1px" }} />
                <p style={{ fontSize: "11px", color: "rgba(240,235,227,0.5)", lineHeight: 1.65 }}>En publiant, vous certifiez être l'auteur ou détenir les droits sur ce contenu.</p>
              </div>

              <button onClick={handleUpload} disabled={!audioFile || !uploadTitle || !uploadGenre} style={{
                padding: "16px", borderRadius: "12px", border: "none",
                background: (!audioFile || !uploadTitle || !uploadGenre) ? "rgba(232,96,26,0.3)" : "var(--amber)",
                color: "#fff", fontSize: "12px", fontWeight: 800, letterSpacing: "0.08em",
                textTransform: "uppercase", cursor: (!audioFile || !uploadTitle || !uploadGenre) ? "not-allowed" : "pointer",
                opacity: (!audioFile || !uploadTitle || !uploadGenre) ? 0.6 : 1, transition: "box-shadow 0.2s",
              }}
              onMouseEnter={e => { if (audioFile && uploadTitle && uploadGenre) (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(232,96,26,0.45)"; }}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}>
                Publier le titre
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}