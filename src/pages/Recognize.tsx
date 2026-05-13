import { useState, useRef, useEffect } from "react";
import { Mic, Search, Music2, ArrowRight, RotateCcw, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";

type RecognizeState = "idle" | "recording" | "processing" | "found" | "not_found" | "error";

type TrackResult = {
  id: string; title: string; genre: string; duration_s: number;
  plays_count: number; artist: string; artist_slug: string; artist_avatar?: string;
};

const RECORD_SECONDS = 8;

export default function Recognize() {
  const navigate = useNavigate();
  const [state, setState] = useState<RecognizeState>("idle");
  const [countdown, setCountdown] = useState(RECORD_SECONDS);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number>(0);

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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

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

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
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

    } catch (e) {
      setState("error");
      setErrorMsg("Accès au microphone refusé. Autorisez l'accès dans les paramètres du navigateur.");
    }
  };

  const processAudio = async () => {
    setState("processing");
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const fd = new FormData();
    fd.append("file", blob, "recognition.webm");

    try {
      const res = await fetch("http://localhost/api/v1/recognize", {
        method: "POST", body: fd,
      });
      const data = await res.json() as { found: boolean; track?: TrackResult; confidence?: number; message?: string };

      if (data.found && data.track) {
        setResult(data.track);
        setConfidence(data.confidence ?? 0);
        setState("found");
      } else {
        setErrorMsg(data.message ?? "Titre non reconnu");
        setState("not_found");
      }
    } catch {
      setErrorMsg("Erreur de connexion au serveur de reconnaissance");
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
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 24px 120px" }}>

      {/* Titre */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", borderRadius: "99px", border: "1px solid rgba(232,96,26,0.3)", marginBottom: "20px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--amber)" }}>
          <Search size={11} /> Reconnaissance musicale
        </div>
        <h1 className="bebas" style={{ fontSize: "clamp(48px, 8vw, 80px)", color: "var(--text)", lineHeight: 1, marginBottom: "12px" }}>
          Identifier<br /><span style={{ color: "var(--amber)" }}>une musique</span>
        </h1>
        <p style={{ fontSize: "15px", color: "var(--muted)", maxWidth: "440px", lineHeight: 1.7 }}>
          Enregistrez 5 à 10 secondes d'une musique centrafricaine — depuis une radio, une cassette ou fredonnée — et E-Bia l'identifiera.
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
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "8px" }}>Appuyez pour écouter</p>
            <p style={{ fontSize: "12px", color: "var(--muted)" }}>Enregistrement de {RECORD_SECONDS} secondes</p>
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
            <p style={{ fontSize: "13px", color: "var(--muted)" }}>🎵 Écoute en cours… approchez la source sonore</p>
          </div>
        )}

        {/* PROCESSING */}
        {state === "processing" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "rgba(232,96,26,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Loader size={40} style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }} />
            </div>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>Analyse en cours…</p>
            <p style={{ fontSize: "13px", color: "var(--muted)" }}>Comparaison avec la base de données musicale</p>
          </div>
        )}

        {/* FOUND */}
        {state === "found" && result && (
          <div>
            <div style={{ padding: "28px", borderRadius: "20px", background: "rgba(76,175,130,0.06)", border: "1px solid rgba(76,175,130,0.2)", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4caf82" }} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#4caf82", textTransform: "uppercase", letterSpacing: "0.15em" }}>Titre identifié</span>
                <span style={{ marginLeft: "auto", fontSize: "10px", color: "var(--muted)" }}>{confidence} correspondances</span>
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
              {state === "error" ? "🚫" : "🔍"}
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
            💡 Fonctionne avec les musiques indexées dans E-Bia. Pour ajouter une musique ancienne à la base, <a href="/explore" style={{ color: "var(--amber)" }}>contactez les artistes</a> ou l'équipe E-Bia.
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
