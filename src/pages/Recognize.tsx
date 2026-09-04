import { useState, useRef, useEffect } from "react";
import { Mic, Search, Music2, ArrowRight, RotateCcw, Loader, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BASE } from "../lib/api";
import { useTranslation } from "react-i18next";

type RecognizeState = "idle" | "recording" | "processing" | "found" | "not_found" | "error";

type TrackResult = {
  id: string; title: string; genre: string; duration_s: number;
  plays_count: number; artist: string; artist_slug: string; artist_avatar?: string;
};

const RECORD_SECONDS = 10;

export default function Recognize() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [state, setState] = useState<RecognizeState>("idle");
  const [countdown, setCountdown] = useState(RECORD_SECONDS);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number>(0);

  const getSupportedMimeType = (): string => {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4", "audio/3gpp"];
    return types.find(t => { try { return MediaRecorder.isTypeSupported(t); } catch { return false; } }) ?? "";
  };

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current!);
      cancelAnimationFrame(animRef.current);
      mediaRef.current?.stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startRecording = async () => {
    setState("recording");
    setCountdown(RECORD_SECONDS);
    chunksRef.current = [];

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("no_support");
      }

      // Le navigateur applique par défaut echoCancellation/noiseSuppression/autoGainControl,
      // des filtres DSP pensés pour la voix qui déforment le spectre et cassent le matching
      // d'empreintes audio (les pics de fréquence doivent rester fidèles au signal d'origine).
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      });

      // Analyser le niveau audio pour les visualisations
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;

      const updateLevel = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((s, v) => s + v, 0) / data.length;
        setAudioLevel(avg / 128);
        animRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      const mimeType = getSupportedMimeType();
      mimeTypeRef.current = mimeType;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRef.current = recorder;

      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        cancelAnimationFrame(animRef.current);
        setAudioLevel(0);
        processAudio();
      };

      recorder.start(100);

      // Countdown
      let remaining = RECORD_SECONDS;
      intervalRef.current = setInterval(() => {
        remaining--;
        setCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(intervalRef.current!);
          recorder.stop();
        }
      }, 1000);

    } catch (e: unknown) {
      setState("error");
      const msg = e instanceof Error ? e.message : "";
      if (msg === "no_support") {
        setErrorMsg("Votre appareil ne supporte pas l'enregistrement audio.");
      } else if (msg.includes("NotAllowedError") || msg.includes("Permission") || msg.includes("denied")) {
        setErrorMsg("Accès au microphone refusé. Autorisez-le dans les paramètres de l'application.");
      } else {
        setErrorMsg("Impossible d'accéder au microphone. Vérifiez les permissions.");
      }
    }
  };

  const processAudio = async () => {
    setState("processing");
    const blobType = mimeTypeRef.current || "audio/webm";
    const blob = new Blob(chunksRef.current, { type: blobType });
    const fd = new FormData();
    fd.append("file", blob, "recognition.webm");

    try {
      const res = await fetch(`${BASE}/api/v1/recognize`, {
        method: "POST", body: fd,
      });
      const data = await res.json() as { found: boolean; track?: TrackResult; confidence?: number; message?: string; error?: string };

      if (!res.ok) {
        const msg = data.error || data.message || `Erreur serveur (${res.status})`;
        setErrorMsg(res.status === 503 ? "Service de reconnaissance temporairement indisponible. Réessayez plus tard." : msg);
        setState("error");
        return;
      }

      if (data.found && data.track) {
        /* Utiliser directement les infos du track retournées par le backend */
        const t = data.track;
        setResult({
          id: t.id || "",
          title: t.title || "Titre inconnu",
          genre: t.genre || "",
          duration_s: t.duration_s || 0,
          plays_count: t.plays_count || 0,
          artist: t.artist || "Artiste inconnu",
          artist_slug: t.artist_slug || "",
          artist_avatar: t.artist_avatar,
        });
        setConfidence(data.confidence ?? 0);
        setState("found");
      } else if (data.found && data.track) {
        setResult(data.track);
        setConfidence(data.confidence ?? 0);
        setState("found");
      } else {
        setErrorMsg(data.message ?? "Titre non reconnu dans notre base.");
        setState("not_found");
      }
    } catch {
      setErrorMsg("Impossible de joindre le serveur de reconnaissance. Vérifiez votre connexion.");
      setState("error");
    }
  };

  const reset = () => {
    setState("idle");
    setResult(null);
    setConfidence(0);
    setErrorMsg("");
    setCountdown(RECORD_SECONDS);
  };

  const progress = ((RECORD_SECONDS - countdown) / RECORD_SECONDS) * 100;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "120px" }}>

      {/* ── HERO ── */}
      <section style={{
        padding: "120px 24px 60px", maxWidth: "1360px", margin: "0 auto",
        position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <div style={{
          position: "absolute", top: "-20%", left: "-15%",
          width: "600px", height: "600px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,96,26,0.08) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />
        {[200, 140, 80].map((s, i) => (
          <div key={i} style={{
            position: "absolute", top: `${10 + i * 12}%`, left: `${5 + i * 6}%`,
            width: s, height: s, borderRadius: "50%",
            border: `1px solid rgba(232,96,26,${6 + i * 3})`,
            pointerEvents: "none",
          }} />
        ))}

      {/* Titre */}
      <div style={{ textAlign: "center", marginBottom: "48px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", borderRadius: "99px", border: "1px solid rgba(232,96,26,0.3)", marginBottom: "20px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--amber)" }}>
          <Search size={11} /> {t("recognize.tag")}
        </div>
        <h1 className="bebas" style={{ fontSize: "clamp(48px, 8vw, 80px)", color: "var(--text)", lineHeight: 1, marginBottom: "12px" }}>
          {t("recognize.title")}<br /><span style={{ color: "var(--amber)" }}>{t("recognize.titleAccent")}</span>
        </h1>
        <p style={{ fontSize: "15px", color: "var(--muted)", maxWidth: "440px", lineHeight: 1.7 }}>
          {t("recognize.description")}
        </p>
      </div>

      {/* Zone principale */}
      <div style={{ width: "100%", maxWidth: "440px" }}>

        {/* IDLE */}
        {state === "idle" && (
          <div style={{ textAlign: "center" }}>
            <button onClick={startRecording} style={{
              width: "140px", height: "140px", borderRadius: "50%",
              background: "linear-gradient(135deg, var(--amber), var(--gold))",
              border: "none", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 24px",
              boxShadow: "0 16px 48px rgba(232,96,26,0.4)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.05)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 24px 64px rgba(232,96,26,0.5)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 48px rgba(232,96,26,0.4)"; }}
            >
              <Mic size={52} color="white" />
            </button>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "8px" }}>{t("recognize.tapToListen")}</p>
            <p style={{ fontSize: "12px", color: "var(--muted)" }}>{t("recognize.recordDuration", { seconds: RECORD_SECONDS })}</p>
          </div>
        )}

        {/* RECORDING */}
        {state === "recording" && (
          <div style={{ textAlign: "center" }}>
            {/* Cercles d'animation niveau audio */}
            <div style={{ position: "relative", width: "140px", height: "140px", margin: "0 auto 24px" }}>
              {[1.4, 1.25, 1.1].map((scale, i) => (
                <div key={i} style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: `rgba(232,96,26,${0.08 - i * 0.02})`,
                  transform: `scale(${1 + audioLevel * (scale - 1)})`,
                  transition: "transform 0.05s",
                }} />
              ))}
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Mic size={52} color="white" />
              </div>
            </div>

            {/* Progress */}
            <p className="bebas" style={{ fontSize: "64px", color: "var(--amber)", lineHeight: 1, marginBottom: "8px" }}>{countdown}</p>
            <div style={{ height: "4px", borderRadius: "99px", background: "rgba(240,235,227,0.08)", overflow: "hidden", marginBottom: "12px" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "var(--amber)", borderRadius: "99px", transition: "width 1s linear" }} />
            </div>
            <p style={{ fontSize: "13px", color: "var(--muted)" }}><span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><Music2 size={13} /> {t("recognize.listening")}</span></p>
          </div>
        )}

        {/* PROCESSING */}
        {state === "processing" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "rgba(232,96,26,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Loader size={40} style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }} />
            </div>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>{t("recognize.analyzing")}</p>
            <p style={{ fontSize: "13px", color: "var(--muted)" }}>{t("recognize.analyzingHint")}</p>
          </div>
        )}

        {/* FOUND */}
        {state === "found" && result && (
          <div>
            <div style={{ padding: "28px", borderRadius: "20px", background: "rgba(76,175,130,0.06)", border: "1px solid rgba(76,175,130,0.2)", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4caf82" }} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#4caf82", textTransform: "uppercase", letterSpacing: "0.15em" }}>{t("recognize.trackIdentified")}</span>
                <span style={{ marginLeft: "auto", fontSize: "10px", color: "var(--muted)" }}>{t("recognize.matches", { count: confidence })}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                {result.artist_avatar
                  ? <img src={result.artist_avatar} alt="" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  : <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, var(--amber), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Music2 size={24} color="white" />
                    </div>
                }
                <div>
                  <p style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)", marginBottom: "4px" }}>{result.title}</p>
                  <p style={{ fontSize: "14px", color: "var(--amber)", fontWeight: 600 }}>{result.artist}</p>
                  <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>{result.genre}</p>
                </div>
              </div>

              <button onClick={() => navigate(`/artist/${result.artist_slug}`)} style={{
                width: "100%", padding: "14px", borderRadius: "12px",
                background: "var(--amber)", border: "none", color: "#fff",
                fontSize: "13px", fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                transition: "box-shadow 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(232,96,26,0.45)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
              >
                Voir l'artiste <ArrowRight size={14} />
              </button>
            </div>
            <button onClick={reset} style={{ width: "100%", padding: "13px", borderRadius: "12px", background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <RotateCcw size={13} /> Nouvelle recherche
            </button>
          </div>
        )}

        {/* NOT FOUND / ERROR */}
        {(state === "not_found" || state === "error") && (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "rgba(240,235,227,0.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "40px" }}>
              {state === "error" ? <XCircle size={40} style={{ color: "var(--muted)" }} /> : <Search size={40} style={{ color: "var(--muted)" }} />}
            </div>
            <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>
              {state === "error" ? "Erreur" : "Titre non trouvé"}
            </p>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "24px", lineHeight: 1.6 }}>
              {errorMsg || "Ce titre n'est pas encore dans notre base. Il sera peut-être ajouté bientôt !"}
            </p>
            <button onClick={reset} style={{ padding: "13px 28px", borderRadius: "99px", background: "var(--amber)", border: "none", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <RotateCcw size={13} /> Réessayer
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      {state === "idle" && (
        <div style={{ marginTop: "48px", textAlign: "center", maxWidth: "400px" }}>
          <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.7 }}>
Fonctionne avec les musiques indexées dans E-Bia. Pour ajouter une musique ancienne à la base, <a href="/explore" style={{ color: "var(--amber)" }}>contactez les artistes</a> ou l'équipe E-Bia.
          </p>
        </div>
      )}

      </section>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
