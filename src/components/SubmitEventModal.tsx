import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarPlus, MapPin, X, AlertCircle, Check, Camera } from "lucide-react";
import { submitEventRequest } from "../lib/api";

const GENRES = ["Afro-Pop","Afro-Folk","Hip-Hop","Afro-Trap","Jazz / Blues","Gospel","Soukous","R&B","Traditionnel","Soul","Afro-Beat","Multi-genre"];

interface SubmitEventModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function SubmitEventModal({ open, onClose, onSubmitted }: SubmitEventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [genre, setGenre] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [ticketPrice, setTicketPrice] = useState("");
  const [capacity, setCapacity] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const coverRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setTitle(""); setDescription(""); setVenue(""); setCity("");
    setEventDate(""); setEventTime(""); setGenre(""); setIsFree(false);
    setTicketPrice(""); setCapacity(""); setCoverFile(null); setCoverPreview(null);
    setStep("idle"); setError("");
  }, []);

  const handleClose = useCallback(() => { reset(); onClose(); }, [reset, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step !== "sending") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, step, handleClose]);

  if (!open) return null;

  const inp: React.CSSProperties = {
    width: "100%", padding: "13px 16px", borderRadius: "10px",
    border: "1.5px solid rgba(240,235,227,0.1)", background: "rgba(240,235,227,0.05)",
    color: "var(--text)", fontSize: "14px", outline: "none",
    boxSizing: "border-box", transition: "border-color 0.2s",
  };
  const fa = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => (e.target.style.borderColor = "var(--amber)");
  const fb = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => (e.target.style.borderColor = "rgba(240,235,227,0.1)");
  const label: React.CSSProperties = {
    fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
    color: "var(--muted)", display: "block", marginBottom: "5px",
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setCoverFile(f);
    const r = new FileReader(); r.onload = ev => setCoverPreview(ev.target?.result as string); r.readAsDataURL(f);
  };

  const isValid = title.trim() && venue.trim() && city.trim() && eventDate;

  const handleSubmit = async () => {
    if (!isValid) return;
    setStep("sending"); setError("");
    const fd = new FormData();
    fd.append("title", title.trim());
    if (description.trim()) fd.append("description", description.trim());
    fd.append("venue", venue.trim());
    fd.append("city", city.trim());
    fd.append("event_date", eventDate);
    if (eventTime) fd.append("event_time", eventTime);
    if (genre) fd.append("genre", genre);
    fd.append("is_free", String(isFree));
    if (!isFree && ticketPrice) fd.append("ticket_price", ticketPrice);
    if (capacity) fd.append("capacity", capacity);
    if (coverFile) fd.append("cover", coverFile);

    try {
      await submitEventRequest(fd);
      setStep("done");
      onSubmitted();
    } catch (e: unknown) {
      setStep("error");
      setError(e instanceof Error ? e.message : "Erreur lors de l'envoi");
    }
  };

  return (
    <div onClick={e => { if (e.target === e.currentTarget && step !== "sending") handleClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}>
      <div style={{ width: "100%", maxWidth: "560px", maxHeight: "90vh", display: "flex", flexDirection: "column", borderRadius: "20px", background: "var(--bg2)", border: "1px solid rgba(240,235,227,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", overflow: "hidden", animation: "fadeUp 0.2s ease both" }}>
        <div style={{ height: "3px", background: "linear-gradient(90deg, var(--amber), var(--gold))" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 28px 0" }}>
          <div>
            <h2 className="bebas" style={{ fontSize: "24px", color: "var(--text)", lineHeight: 1 }}>Soumettre un événement</h2>
            <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>Validé par l'équipe E-BIA avant publication</p>
          </div>
          {step !== "sending" && (
            <button onClick={handleClose} style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", transition: "all 0.15s", flexShrink: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.06)"; (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}>
              <X size={16} />
            </button>
          )}
        </div>

        <div style={{ padding: "20px 28px 28px", overflowY: "auto" }}>
          {step === "done" ? (
            <div style={{ padding: "40px 16px", borderRadius: "16px", textAlign: "center", background: "rgba(76,175,130,0.06)", border: "1px solid rgba(76,175,130,0.2)" }}>
              <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(76,175,130,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Check size={26} style={{ color: "#4caf82" }} />
              </div>
              <h2 className="bebas" style={{ fontSize: "26px", color: "var(--text)", marginBottom: "8px" }}>Demande envoyée !</h2>
              <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "24px" }}>« {title} » est en attente de validation par l'équipe E-BIA.</p>
              <button onClick={handleClose} style={{ padding: "11px 20px", borderRadius: "10px", background: "var(--amber)", border: "none", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Fermer</button>
            </div>
          ) : step === "sending" ? (
            <div style={{ padding: "40px 16px", borderRadius: "16px", textAlign: "center", background: "rgba(240,235,227,0.03)", border: "1px solid var(--border)" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(232,96,26,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <CalendarPlus size={22} style={{ color: "var(--amber)" }} />
              </div>
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>Envoi en cours…</h2>
              <p style={{ fontSize: "12px", color: "var(--muted)" }}>{title}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {step === "error" && error && (
                <div style={{ padding: "11px 14px", borderRadius: "9px", background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.2)", color: "#f08080", fontSize: "12px" }}>⚠️ {error}</div>
              )}

              <div>
                <label style={label}>Titre de l'événement *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Soirée Afro-Pop au Hangar" style={inp} onFocus={fa} onBlur={fb} />
              </div>

              <div>
                <label style={label}>Description <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--muted)" }}>(optionnel)</span></label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Présentez votre événement en quelques lignes" style={{ ...inp, resize: "vertical" as const }} onFocus={fa} onBlur={fb} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={label}>Lieu *</label>
                  <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Ex: Palais des Sports" style={inp} onFocus={fa} onBlur={fb} />
                </div>
                <div>
                  <label style={label}>Ville *</label>
                  <input value={city} onChange={e => setCity(e.target.value)} placeholder="Ex: Bangui" style={inp} onFocus={fa} onBlur={fb} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={label}>Date *</label>
                  <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} min={new Date().toISOString().split('T')[0]} style={inp} onFocus={fa} onBlur={fb} />
                </div>
                <div>
                  <label style={label}>Heure <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--muted)" }}>(optionnel)</span></label>
                  <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} style={inp} onFocus={fa} onBlur={fb} />
                </div>
              </div>

              <div>
                <label style={label}>Genre <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--muted)" }}>(optionnel)</span></label>
                <select value={genre} onChange={e => setGenre(e.target.value)} style={{ ...inp, appearance: "none" as const }} onFocus={fa} onBlur={fb}>
                  <option value="">Choisir un genre</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderRadius: "10px", background: "rgba(240,235,227,0.03)", border: "1px solid rgba(240,235,227,0.08)" }}>
                <input id="event-is-free" type="checkbox" checked={isFree} onChange={e => setIsFree(e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "var(--amber)", cursor: "pointer" }} />
                <label htmlFor="event-is-free" style={{ fontSize: "13px", color: "var(--text)", cursor: "pointer" }}>Entrée gratuite</label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={label}>Prix du billet {!isFree && "(FCFA)"}</label>
                  <input type="number" min="0" value={ticketPrice} onChange={e => setTicketPrice(e.target.value)} disabled={isFree} placeholder={isFree ? "Gratuit" : "Ex: 5000"} style={{ ...inp, opacity: isFree ? 0.5 : 1 }} onFocus={fa} onBlur={fb} />
                </div>
                <div>
                  <label style={label}>Capacité <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--muted)" }}>(optionnel)</span></label>
                  <input type="number" min="0" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="Ex: 500" style={inp} onFocus={fa} onBlur={fb} />
                </div>
              </div>

              <div>
                <label style={label}>Affiche <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--muted)" }}>(optionnel)</span></label>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div onClick={() => coverRef.current?.click()} style={{ width: "72px", height: "72px", borderRadius: "10px", overflow: "hidden", border: `2px dashed ${coverPreview ? "var(--amber)" : "rgba(240,235,227,0.15)"}`, background: "rgba(240,235,227,0.03)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "border-color 0.2s" }}>
                    {coverPreview
                      ? <img src={coverPreview} alt="Affiche" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <Camera size={20} style={{ color: "var(--muted)" }} />
                    }
                    <input ref={coverRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverChange} />
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>
                    {coverPreview ? "Affiche sélectionnée — cliquez pour changer" : "JPG ou PNG"}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "9px", padding: "11px 14px", borderRadius: "10px", background: "rgba(201,147,10,0.06)", border: "1px solid rgba(201,147,10,0.18)" }}>
                <AlertCircle size={13} style={{ color: "var(--gold)", flexShrink: 0, marginTop: "1px" }} />
                <p style={{ fontSize: "11px", color: "rgba(240,235,227,0.5)", lineHeight: 1.65 }}>Votre événement sera examiné par l'équipe E-BIA avant d'apparaître sur la page Concerts.</p>
              </div>

              <button onClick={handleSubmit} disabled={!isValid} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                padding: "16px", borderRadius: "12px", border: "none",
                background: !isValid ? "rgba(232,96,26,0.3)" : "var(--amber)",
                color: "#fff", fontSize: "12px", fontWeight: 800, letterSpacing: "0.08em",
                textTransform: "uppercase", cursor: !isValid ? "not-allowed" : "pointer",
                opacity: !isValid ? 0.6 : 1, transition: "box-shadow 0.2s",
              }}
              onMouseEnter={e => { if (isValid) (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(232,96,26,0.45)"; }}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}>
                <MapPin size={13} /> Envoyer pour validation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
