import { Radio as RadioIcon, Music2, Cross, Disc, Zap, Globe } from "lucide-react";
import type { LucideIcon } from "lucide-react";

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

export const STATIC_STATIONS: Station[] = [
  {
    id: "lengo-songo",
    name: "Radio Lengo Songo",
    freq: "98.9 FM",
    desc: "Musique centrafricaine, programmes culturels et communautaires",
    longDesc: "Radio Lengo Songo est dédiée à la promotion de la musique et de la culture centrafricaines. Elle diffuse en priorité des artistes locaux et propose des émissions sur les traditions, les langues et le patrimoine de la RCA. Une voix authentiquement centrafricaine.",
    lang: "Sango / Français",
    color: "#2E7D32",
    Icon: Disc,
    homepage: "https://lengosongo.cf",
    streamUrl: "https://stream.zeno.fm/0r0xa792kwzuv",
    category: "music",
    listeners: 6500,
    schedule: [
      { day: "Lundi - Vendredi", time: "06h00 - 10h00", show: "Réveil Musical" },
      { day: "Lundi - Vendredi", time: "14h00 - 17h00", show: "Hits du Moment" },
      { day: "Samedi", time: "16h00 - 20h00", show: "Soirée Soukous" },
      { day: "Dimanche", time: "10h00 - 13h00", show: "Gospel & Tradition" },
    ],
    tags: ["Musique", "Culture", "Sango", "Artistes locaux"],
  },
  {
    id: "radio-maria",
    name: "Radio Maria RCA",
    freq: "90.9 FM",
    desc: "Radio catholique internationale · Programmes spirituels et culturels",
    longDesc: "Radio Maria RCA fait partie du réseau mondial de Radio Maria. Elle diffuse des programmes spirituels, des messes, des prières et des émissions culturelles en français et en sango. Un espace de recueillement et de partage pour la communauté catholique de RCA.",
    lang: "Français / Sango",
    color: "#4527A0",
    Icon: Cross,
    homepage: "http://www.radiomariacentrafrique.org",
    streamUrl: "https://cast3.asurahosting.com/proxy/dreamradio/stream.mp3",
    category: "gospel",
    listeners: 5700,
    schedule: [
      { day: "Lundi - Vendredi", time: "06h00 - 07h00", show: "Matin avec Marie" },
      { day: "Lundi - Vendredi", time: "12h00 - 12h30", show: "Angelus & Prières" },
      { day: "Samedi", time: "09h00 - 11h00", show: "Catéchèse" },
      { day: "Dimanche", time: "07h00 - 10h00", show: "Messe du Dimanche" },
    ],
    tags: ["Gospel", "Spiritualité", "Catholique", "Prière"],
  },
];

export const CATEGORY_CONFIG: Record<StationCategory, { label: string; icon: LucideIcon }> = {
  all: { label: "Toutes", icon: RadioIcon },
  info: { label: "Info / Débats", icon: Zap },
  music: { label: "Musique", icon: Music2 },
  gospel: { label: "Gospel / Spiritualité", icon: Cross },
  community: { label: "Communauté", icon: Globe },
};

