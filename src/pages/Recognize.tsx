import { useState, useRef, useEffect } from "react";
import { Mic, Search, Music2, ArrowRight, RotateCcw, Loader, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BASE } from "../lib/api";
import { describeMicFailure, logMicDiagnostics, micPreflight } from "../lib/microphone";
import MicDiagnosticPanel from "../components/MicDiagnosticPanel";
import { useTranslation } from "react-i18next";

type RecognizeState = "idle" | "recording" | "processing" | "found" | "not_found" | "error";

type TrackResult = {
  id: string; title: string; genre: string; duration_s: number;
  plays_count: number; artist: string; artist_slug: string; artist_avatar?: string;
};

const RECORD_SECONDS = 10;

// Délai maximum avant d'abandonner une analyse et de rendre la main à l'utilisateur.
//
// Compromis : trop court, il annule une analyse que le serveur allait rendre —
// et un « non trouvé » légitime devient un échec côté client, ce qui est pire que
// d'attendre. Trop long, un fetch qui ne répond jamais garde le spinner à l'écran.
//
// Repère mesuré : à index chaud un match revient en ~0,25 s ; le pire cas
// LÉGITIME est le balayage complet « non trouvé » à index froid, ~30 à 47 s
// (disque mécanique). 60 s couvre ce pire cas avec ~13 s de marge tout en restant
// sous le plafond serveur (45 s par tentative ×2 = ~90 s). En dessous de ~50 s on
// couperait de vraies analyses « non trouvé ».
const RECOGNIZE_TIMEOUT_MS = 60_000;

export default function Recognize() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [state, setState] = useState<RecognizeState>("idle");
  const [countdown, setCountdown] = useState(RECORD_SECONDS);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  // Panneau de diagnostic : ouvert d'office quand le micro échoue, accessible
  // à la demande sinon. Le message d'erreur seul ne permet pas de distinguer
  // « pas de micro » de « permission refusée » ou de « page non HTTPS ».
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number>(0);
  const levelSampleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const peakByteRef = useRef<number>(0);

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
      // Hors contexte sécurisé (http:// sur un hôte non-local, par exemple le
      // serveur de dev ouvert via l'IP du réseau local) le navigateur masque
      // `navigator.mediaDevices` : l'API n'existe pas. Sans ce test on annoncerait
      // « appareil non supporté » alors que c'est la page qui bloque le micro.
      const preflight = micPreflight();
      if (preflight) {
        console.warn("[reconnaissance] micro indisponible :", preflight.detail);
        setState("error");
        setErrorMsg(t(preflight.i18nKey));
        setShowDiagnostics(true);
        return;
      }
      void logMicDiagnostics("reconnaissance");

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

      // Un flux sans piste audio (micro présent dans le système mais muet) doit
      // être traité comme « aucun périphérique » : sinon on enregistre 10 s de
      // silence et on laisse croire que le titre manque au catalogue.
      if (stream.getAudioTracks().length === 0) {
        throw new DOMException("Aucune piste audio dans le flux", "NotFoundError");
      }

      // Analyser le niveau audio pour les visualisations
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;

      peakByteRef.current = 0;

      // Animation du visualiseur : requestAnimationFrame, pour rester fluide.
      const updateLevel = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (const v of data) sum += v;
        setAudioLevel(sum / data.length / 128);
        animRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      // Mesure du pic : setInterval, PAS requestAnimationFrame. Chrome gèle
      // complètement les rAF dès que la fenêtre passe en arrière-plan ou est
      // masquée — le pic resterait alors à 0 sur une prise pourtant correcte.
      // setInterval continue de tourner (cadencé à 1 s au minimum).
      levelSampleRef.current = setInterval(() => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        for (const v of data) if (v > peakByteRef.current) peakByteRef.current = v;
      }, 200);

      const mimeType = getSupportedMimeType();
      mimeTypeRef.current = mimeType;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRef.current = recorder;

      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        cancelAnimationFrame(animRef.current);
        clearInterval(levelSampleRef.current!);
        setAudioLevel(0);
        // On envoie TOUJOURS l'enregistrement : c'est le serveur qui tranche, en
        // lisant les échantillons décodés. Le pic mesuré ici ne sert qu'à
        // formuler le bon message d'erreur — jamais à jeter une prise, sinon un
        // simple gel du navigateur ferait perdre un enregistrement valide.
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
      // Chaque cause a son remède : page non sécurisée, navigateur incompatible,
      // permission refusée, aucun périphérique ou micro déjà occupé. L'ancien
      // message unique « votre appareil ne supporte pas » envoyait l'utilisateur
      // chercher au mauvais endroit.
      const failure = describeMicFailure(e);
      console.warn("[reconnaissance] échec de l'accès au micro :", failure.detail);
      setState("error");
      setErrorMsg(t(failure.i18nKey));
      setShowDiagnostics(true);
    }
  };

  const processAudio = async () => {
    setState("processing");
    const blobType = mimeTypeRef.current || "audio/webm";
    const blob = new Blob(chunksRef.current, { type: blobType });
    const fd = new FormData();
    fd.append("file", blob, "recognition.webm");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), RECOGNIZE_TIMEOUT_MS);

    try {
      const res = await fetch(`${BASE}/api/v1/recognize`, {
        method: "POST", body: fd, signal: controller.signal,
      });
      const data = await res.json() as { found: boolean; recognized?: boolean; track?: TrackResult; confidence?: number; message?: string; error?: string };

      if (!res.ok) {
        // 422 = le serveur n'a trouvé aucun son exploitable. Si le micro n'a rien
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
      } else if (peakByteRef.current === 0) {
        // Le serveur n'a rien reconnu ET le micro n'a capté aucun niveau de toute
        // la prise : c'est le micro qui est en cause, pas le catalogue. On le dit,
        // au lieu de laisser croire que le titre n'est pas dans la base.
        // (Le test ne peut pas se faire sur le statut HTTP : la passerelle répond
        // toujours 200, même quand le service audio a renvoyé un 422.)
        setErrorMsg(t("recognize.errorNoSignal"));
        setState("error");
      } else {
        // `recognized` distingue « titre identifié mais pas encore diffusable »
        // de « absent du catalogue » : le message du serveur est alors le bon,
        // et il ne faut surtout pas le remplacer par « non reconnu ».
        setErrorMsg(data.message ?? "Titre non reconnu dans notre base.");
        setState("not_found");
      }
    } catch (e) {
      // Distinguer l'abandon volontaire (délai dépassé) d'une vraie panne réseau :
      // les deux arrivaient avant en « Impossible de joindre le serveur », ce qui
      // envoyait l'utilisateur vérifier sa connexion alors que le serveur était
      // simplement trop lent.
      if (e instanceof Error && e.name === "AbortError") {
        setErrorMsg("Le serveur met trop de temps à répondre. Réessayez.");
      } else {
        setErrorMsg("Impossible de joindre le serveur de reconnaissance. Vérifiez votre connexion.");
      }
      setState("error");
    } finally {
      clearTimeout(timer);
    }
  };

  const reset = () => {
    setState("idle");
    setResult(null);
    setConfidence(0);
    setErrorMsg("");
    setCountdown(RECORD_SECONDS);
    setShowDiagnostics(false);
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
            <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "10px" }}>{t("recognize.recordDuration", { seconds: RECORD_SECONDS })}</p>
            <p style={{ fontSize: "11px", color: "var(--muted)", opacity: 0.7, maxWidth: "320px", margin: "0 auto", lineHeight: 1.5 }}>{t("recognize.sameDeviceHint")}</p>
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

      {/* Diagnostic micro — visible quand ça bloque, repliable autrement */}
      {(state === "error" || state === "idle") && (
        <div style={{ width: "100%", maxWidth: "440px" }}>
          {showDiagnostics
            ? <MicDiagnosticPanel onClose={() => setShowDiagnostics(false)} />
            : <button onClick={() => setShowDiagnostics(true)} style={{
                marginTop: "18px", background: "transparent", border: "none", cursor: "pointer",
                color: "var(--muted)", fontSize: "11px", textDecoration: "underline", padding: "4px",
              }}>
                {t("mic.panel.open")}
              </button>}
        </div>
      )}

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
