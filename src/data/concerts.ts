export type EventStatus = "upcoming" | "sold_out" | "free" | "past";

export type ConcertEvent = {
  id: string;
  title: string;
  artist: string;
  artistSlug: string;
  location: string;
  date: string;
  time: string;
  genre: string;
  status: EventStatus;
  description: string;
  longDescription?: string;
  attendees?: number;
  coverColor: string;
  featured?: boolean;
  lineup?: string[];
  tags?: string[];
};

export const CONCERTS: ConcertEvent[] = [
  {
    id: "1",
    title: "Festival Ndeke 2026",
    artist: "Multiple artistes",
    artistSlug: "",
    location: "Stade Barthélemy Boganda, Bangui",
    date: "15 Mars 2026",
    time: "19h00",
    genre: "Multi-genre",
    status: "upcoming",
    description: "Le plus grand festival de musique de RCA. Trois jours de concerts, ateliers et rencontres avec les artistes centrafricains.",
    longDescription: "Le Festival Ndeke revient pour sa 3ème édition ! Trois jours inoubliables de musique live réunissant les plus grands talents de la République Centrafricaine et d'Afrique centrale. Au programme : concerts en plein air, ateliers de production musicale, rencontres avec les artistes, et une nuit exceptionnelle de clôture au stade Barthélemy Boganda. Venez vibrer au rythme du soukous, du ndombolo, de l'afro-pop et bien plus encore.",
    attendees: 2500,
    coverColor: "#E8601A",
    featured: true,
    lineup: ["Idylle Mamba", "La Troupe Makasi", "Frangipane", "Ariel Sheney", "Grems", "Ponce Pilate"],
    tags: ["Festival", "Plein air", "3 jours", "Workshops"],
  },
  {
    id: "2",
    title: "Soukous Night",
    artist: "La Troupe Makasi & Invités",
    artistSlug: "",
    location: "Espace culturel Bangui",
    date: "22 Mars 2026",
    time: "20h00",
    genre: "Soukous",
    status: "upcoming",
    description: "Une nuit dédiée au ndombolo et soukous avec les meilleurs danseurs et musiciens de Bangui.",
    longDescription: "Plongez dans l'univers du soukous et du ndombolo lors d'une soirée exceptionnelle animée par La Troupe Makasi et leurs invités surprise. Au programme : guitaristes virtuoses, danseurs acrobatiques et une ambiance qui ne s'arrêtera qu'au petit matin. Le meilleur du son centrafricain dans un cadre festif et chaleureux.",
    attendees: 800,
    coverColor: "#C62828",
    lineup: ["La Troupe Makasi", "Djou Gotto", "Kentiny"],
    tags: ["Soukous", "Ndombolo", "Danse", "Nocturne"],
  },
  {
    id: "3",
    title: "Gospel Fest RCA",
    artist: "Flora Biano, Otilie & Chœur",
    artistSlug: "",
    location: "Cathédrale Notre-Dame, Bangui",
    date: "5 Avril 2026",
    time: "18h00",
    genre: "Gospel",
    status: "free",
    description: "Concert gospel gratuit ouvert à tous. Venez célébrer la musique et la foi ensemble.",
    longDescription: "Un moment de recueillement et de célébration à travers la musique gospel. Flora Biano, Otilie et un chœur de 40 voix vous offriront un concert gratuit et ouvert à tous. Une soirée émouvante qui transcende les frontières musicales et rassemble les cœurs.",
    attendees: 1200,
    coverColor: "#2E7D32",
    lineup: ["Flora Biano", "Otilie", "Chœur de la Cathédrale"],
    tags: ["Gratuit", "Gospel", "Chœur", "Ouvert à tous"],
  },
  {
    id: "4",
    title: "Hip-Hop Underground",
    artist: "Samy Diko, Tressor Mpassy & Crew",
    artistSlug: "",
    location: "Le Hangar, Bangui",
    date: "12 Avril 2026",
    time: "21h00",
    genre: "Hip-Hop",
    status: "upcoming",
    description: "La scène hip-hop de Bangui prend d'assaut le Hangar. Cyphers, freestyles et performances live.",
    longDescription: "Le Hangar devient le terrain de jeu de la scène hip-hop centrafricaine. Cyphers improvisés, freestyles incendiaires et performances live qui vont vous donner le frisson. Samy Diko, Tressor Mpassy et tout le crew repoussent les limites du rap made in RCA. Une nuit brute et authentique.",
    attendees: 400,
    coverColor: "#8B5CF6",
    lineup: ["Samy Diko", "Tressor Mpassy", "MC Bangui", "DJ Centrafrique"],
    tags: ["Hip-Hop", "Cyphers", "Freestyle", "Underground"],
  },
  {
    id: "5",
    title: "Afro-Pop Summer",
    artist: "Idylle Mamba, Grems & Invités",
    artistSlug: "",
    location: "Plage de la Catembe, Bangui",
    date: "20 Avril 2026",
    time: "16h00",
    genre: "Afro-Pop",
    status: "sold_out",
    description: "Festival en plein air sur les bords de l'Oubangui. Ambiance garantie avec les plus grands noms de l'afro-pop centrafricaine.",
    longDescription: "Le soleil, l'Oubangui et la musique réunis pour un festival afro-pop inoubliable. Idylle Mamba, Grems et leurs invités vous promettent une journée complète de musique, de danse et de bonne humeur sur la plage de la Catembe. Food trucks, espaces détente et piston gratuit pour les premiers arrivés.",
    attendees: 1500,
    coverColor: "#F59E0B",
    lineup: ["Idylle Mamba", "Grems", "Ozagin", "Strong Girl"],
    tags: ["Afro-Pop", "Plein air", "Plage", "Journée"],
  },
  {
    id: "6",
    title: "Nuit R&B & Soul",
    artist: "Ponce Pilate & Band",
    artistSlug: "",
    location: "Hotel Ledger, Bangui",
    date: "3 Mai 2026",
    time: "20h30",
    genre: "R&B",
    status: "upcoming",
    description: "Une soirée élégante dédiée au R&B et à la soul. Dîner-concert dans un cadre raffiné.",
    longDescription: "Une expérience gastronomique et musicale unique. Ponce Pilate et son band vous offrent un dîner-concert dans le cadre raffiné de l'Hôtel Ledger. Ambiance tamisée, saveurs d'Afrique et mélodies envoûtantes pour une soirée chic et mémorable. Places limitées.",
    attendees: 200,
    coverColor: "#6A1B9A",
    lineup: ["Ponce Pilate", "The Soul Band"],
    tags: ["R&B", "Soul", "Dîner-concert", "Élégant"],
  },
];

export const PAST_CONCERTS: Pick<ConcertEvent, "title" | "artist" | "location" | "date" | "attendees" | "coverColor">[] = [
  { title: "Festival Ndeke 2025", artist: "Multiple artistes", location: "Bangui", date: "Mars 2025", attendees: 2000, coverColor: "#E8601A" },
  { title: "Rumba Night", artist: "Frangipane & Band", location: "Bangui", date: "Janvier 2025", attendees: 600, coverColor: "#C9930A" },
  { title: "Concert Charity", artist: "Ariel Sheney", location: "Berberati", date: "Décembre 2024", attendees: 800, coverColor: "#10B981" },
];

export const STATUS_CONFIG: Record<EventStatus, { label: string; color: string; bg: string }> = {
  upcoming: { label: "Bientôt", color: "#E8601A", bg: "rgba(232,96,26,0.1)" },
  free: { label: "Gratuit", color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  sold_out: { label: "Complet", color: "#f08080", bg: "rgba(240,128,128,0.1)" },
  past: { label: "Passé", color: "var(--muted)", bg: "rgba(240,235,227,0.05)" },
};
