import { Radio as RadioIcon, Music2, Cross, Disc, Zap, Globe, Scale, Mic2, Headphones } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { RadioStationApi } from "../lib/api";

export type StationCategory = "all" | "info" | "music" | "gospel" | "community";

export type Station = {
  id: string;
  name: string;
  freq: string;
  desc: string;
  longDesc?: string;
  lang: string;
  color: string;
  Icon: LucideIcon;
  homepage: string;
  streamUrl: string;
  category: StationCategory;
  listeners?: number;
  schedule?: { day: string; time: string; show: string }[];
  tags?: string[];
};

export const ICON_MAP: Record<string, LucideIcon> = {
  radio: RadioIcon,
  music: Music2,
  cross: Cross,
  disc: Disc,
  scale: Scale,
  globe: Globe,
  mic: Mic2,
  headphones: Headphones,
};

export const ICON_KEYS = Object.keys(ICON_MAP);

/** Convertit une station reçue de l'API (icône en string) en Station affichable (icône en composant). */
export function toStation(s: RadioStationApi): Station {
  return {
    id: s.id,
    name: s.name,
    freq: s.freq ?? "",
    desc: s.description ?? "",
    longDesc: s.longDescription ?? undefined,
    lang: s.lang ?? "",
    color: s.color,
    Icon: ICON_MAP[s.iconKey] ?? RadioIcon,
    homepage: s.homepage ?? "",
    streamUrl: s.streamUrl ?? "",
    category: (s.category as StationCategory) ?? "music",
    listeners: s.listeners ?? undefined,
    schedule: s.schedule ?? undefined,
    tags: s.tags ?? undefined,
  };
}

export const CATEGORY_CONFIG: Record<StationCategory, { label: string; icon: LucideIcon }> = {
  all: { label: "Toutes", icon: RadioIcon },
  info: { label: "Info / Débats", icon: Zap },
  music: { label: "Musique", icon: Music2 },
  gospel: { label: "Gospel / Spiritualité", icon: Cross },
  community: { label: "Communauté", icon: Globe },
};
