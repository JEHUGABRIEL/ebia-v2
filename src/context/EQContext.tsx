import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import type { ReactNode } from "react";

type Band = {
  frequency: number;
  gain: number;
};

type Preset = {
  name: string;
  label: string;
  gains: number[];
};

const FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

const PRESETS: Preset[] = [
  { name: "flat", label: "Plat", gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: "bass-boost", label: "Basses", gains: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0] },
  { name: "treble-boost", label: "Aigus", gains: [0, 0, 0, 0, 0, 0, 2, 4, 5, 6] },
  { name: "vocal", label: "Voix", gains: [-2, -1, 0, 3, 5, 5, 3, 0, -1, -2] },
  { name: "rock", label: "Rock", gains: [5, 4, -2, -3, -1, 2, 4, 5, 5, 5] },
  { name: "electronic", label: "Électro", gains: [5, 4, 1, 0, -2, 0, 1, 4, 5, 5] },
  { name: "hip-hop", label: "Hip-Hop", gains: [5, 4, 2, 0, -1, -1, 0, 1, 3, 4] },
  { name: "jazz", label: "Jazz", gains: [3, 2, 0, 2, -1, -1, 0, 2, 3, 4] },
  { name: "classical", label: "Classique", gains: [4, 3, 2, 1, -1, -1, 0, 2, 3, 4] },
  { name: "bass-reduce", label: "Basses −", gains: [-5, -4, -2, 0, 0, 0, 0, 0, 0, 0] },
];

type EQContextType = {
  enabled: boolean;
  toggleEQ: () => void;
  bands: Band[];
  setBandGain: (index: number, gain: number) => void;
  currentPreset: string;
  setPreset: (presetName: string) => void;
  presets: Preset[];
  connectAudioElement: (audioElement: HTMLAudioElement) => void;
};

const EQContext = createContext<EQContextType | null>(null);

export function EQProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [bands, setBands] = useState<Band[]>(
    FREQUENCIES.map((f, i) => ({ frequency: f, gain: PRESETS[0].gains[i] }))
  );
  const [currentPreset, setCurrentPreset] = useState("flat");

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      // Create 10-band filters
      filtersRef.current = FREQUENCIES.map((freq) => {
        const filter = audioContextRef.current!.createBiquadFilter();
        filter.type = "peaking";
        filter.frequency.value = freq;
        filter.Q.value = 1.4;
        filter.gain.value = 0;
        return filter;
      });
    }
  }, []);

  const connectAudioElement = useCallback((audioElement: HTMLAudioElement) => {
    initAudioContext();
    if (sourceRef.current) return; // Already connected

    try {
      sourceRef.current = audioContextRef.current!.createMediaElementSource(audioElement);

      // Chain: source → filters → analyser → destination
      let lastNode: AudioNode = sourceRef.current;
      filtersRef.current.forEach((filter) => {
        lastNode.connect(filter);
        lastNode = filter;
      });
      lastNode.connect(analyserRef.current!);
      analyserRef.current!.connect(audioContextRef.current!.destination);
    } catch (err) {
      console.error("Failed to connect EQ:", err);
    }
  }, [initAudioContext]);

  const toggleEQ = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (next) {
        // Enable: apply current gains
        filtersRef.current.forEach((filter, i) => {
          filter.gain.value = bands[i].gain;
        });
      } else {
        // Disable: set all gains to 0
        filtersRef.current.forEach((filter) => {
          filter.gain.value = 0;
        });
      }
      return next;
    });
  }, [bands]);

  const setBandGain = useCallback((index: number, gain: number) => {
    setBands((prev) => {
      const newBands = [...prev];
      newBands[index] = { ...newBands[index], gain };
      return newBands;
    });

    // Apply gain if enabled
    if (enabled && filtersRef.current[index]) {
      filtersRef.current[index].gain.value = gain;
    }

    // Reset preset name since we're manually adjusting
    setCurrentPreset("custom");
  }, [enabled]);

  const setPreset = useCallback((presetName: string) => {
    const preset = PRESETS.find((p) => p.name === presetName);
    if (!preset) return;

    setCurrentPreset(presetName);
    const newBands = FREQUENCIES.map((f, i) => ({ frequency: f, gain: preset.gains[i] }));
    setBands(newBands);

    // Apply gains if enabled
    if (enabled) {
      filtersRef.current.forEach((filter, i) => {
        filter.gain.value = preset.gains[i];
      });
    }
  }, [enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <EQContext.Provider
      value={{
        enabled,
        toggleEQ,
        bands,
        setBandGain,
        currentPreset,
        setPreset,
        presets: PRESETS,
        connectAudioElement,
      }}
    >
      {children}
    </EQContext.Provider>
  );
}

export function useEQ() {
  const context = useContext(EQContext);
  if (!context) {
    throw new Error("useEQ must be used within an EQProvider");
  }
  return context;
}

export { FREQUENCIES, PRESETS };
