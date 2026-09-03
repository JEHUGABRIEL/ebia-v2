import { Radio as RadioIcon, Music2, Scale, Cross, Disc, Zap, Globe } from "lucide-react";
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
    id: "ndeke-luka",
    name: "Radio Ndeke Luka",
    freq: "100.9 FM",
    desc: "La radio la plus écoutée de RCA · Info, débats, musique · 24h/24",
    longDesc: "Radio Ndeke Luka est la station de radio la plus populaire de République Centrafricaine. Fondée en 2000, elle offre une programmation variée allant de l'info en continu aux émissions culturelles, en passant par la musique centrafricaine et internationale. Avec plus de 12 000 auditeurs quotidiens, elle est incontournable pour rester connecté à l'actualité de la RCA.",
    lang: "Français / Sango",
    color: "#E8601A",
    Icon: RadioIcon,
    homepage: "https://www.radiondekeluka.org",
    streamUrl: "https://stream.zeno.fm/yn6k8u0dsq0uv",
    category: "info",
    listeners: 12400,
    schedule: [
      { day: "Lundi - Vendredi", time: "06h00 - 09h00", show: "Bonjour RCA — Info matinale" },
      { day: "Lundi - Vendredi", time: "12h00 - 13h00", show: "Édition spéciale midi" },
      { day: "Lundi - Vendredi", time: "18h00 - 20h00", show: "Le Grand Débat" },
      { day: "Samedi", time: "10h00 - 12h00", show: "Samedi Culture" },
      { day: "Dimanche", time: "08h00 - 10h00", show: "Messe & Méditation" },
    ],
    tags: ["Info", "Débats", "24h/24", "Populaire"],
  },
  {
    id: "guira-fm",
    name: "Guira FM",
    freq: "93.3 FM",
    desc: "Radio de la MINUSCA · Paix, réconciliation nationale et culture",
    longDesc: "Guira FM est la station de radio des Nations Unies en République Centrafricaine (MINUSCA). Elle diffuse des programmes promouvant la paix, la réconciliation nationale et la culture centrafricaine. Avec des émissions en français et en sango, elle touche des millions d'auditeurs à travers le pays.",
    lang: "Français / Sango",
    color: "#1565C0",
    Icon: RadioIcon,
    homepage: "https://minusca.unmissions.org/guira-fm",
    streamUrl: "https://stream.zeno.fm/qdqc4u7fmrhvv",
    category: "community",
    listeners: 8200,
    schedule: [
      { day: "Lundi - Vendredi", time: "07h00 - 08h00", show: "Matin Paix" },
      { day: "Lundi - Vendredi", time: "12h00 - 13h30", show: "Les Voix de la Réconciliation" },
      { day: "Samedi", time: "14h00 - 16h00", show: "Culture & Tradition" },
      { day: "Dimanche", time: "09h00 - 11h00", show: "Heure de Paix" },
    ],
    tags: ["Paix", "MINUSCA", "Réconciliation", "Communauté"],
  },
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
    id: "hit-radio",
    name: "Hit Radio RCA",
    freq: "96.1 FM",
    desc: "Musique populaire et divertissement à Bangui",
    longDesc: "Hit Radio RCA est la radio du divertissement à Bangui. Pop, afro-pop, hip-hop, ndombolo — elle diffuse les tubes du moment et les artistes émergents. Animée par une équipe dynamique, c'est la station préférée de la jeunesse centrafricaine.",
    lang: "Français",
    color: "#C62828",
    Icon: Music2,
    homepage: "https://facebook.com/HitRadioRCA",
    streamUrl: "https://stream.zeno.fm/ydkvmq8xdqzuv",
    category: "music",
    listeners: 9100,
    schedule: [
      { day: "Lundi - Vendredi", time: "06h30 - 10h00", show: "Morning Hit" },
      { day: "Lundi - Vendredi", time: "15h00 - 18h00", show: "Afternoon Vibes" },
      { day: "Samedi", time: "18h00 - 22h00", show: "Hit Party" },
      { day: "Dimanche", time: "12h00 - 15h00", show: "Best Of de la Semaine" },
    ],
    tags: ["Pop", "Afro-Pop", "Hip-Hop", "Jeunesse"],
  },
  {
    id: "rjdh",
    name: "RJDH Bangui",
    freq: "100.5 FM",
    desc: "Radio Jeunesse pour la Démocratie et les Droits de l'Homme",
    longDesc: "La RJDH (Radio Jeunesse pour la Démocratie et les Droits de l'Homme) est une station engagée pour les droits de l'homme et la démocratie en RCA. Elle offre une plateforme d'expression aux jeunes et aux organisations de la société civile, tout en diffusant des programmes éducatifs et culturels.",
    lang: "Français",
    color: "#6A1B9A",
    Icon: Scale,
    homepage: "https://www.rjdhrca.org",
    streamUrl: "https://stream.zeno.fm/f1mxy5s68tzuv",
    category: "community",
    listeners: 4300,
    schedule: [
      { day: "Lundi - Vendredi", time: "08h00 - 10h00", show: "Droits & Démocratie" },
      { day: "Lundi - Vendredi", time: "14h00 - 16h00", show: "Jeunes & Citoyenneté" },
      { day: "Samedi", time: "10h00 - 12h00", show: "Débat Jeunesse" },
    ],
    tags: ["Droits de l'homme", "Jeunesse", "Démocratie", "Société civile"],
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

