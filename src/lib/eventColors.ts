const GENRE_COLORS: Record<string, string> = {
  "Afro-Pop": "#E8601A",
  "Afro-Folk": "#2E7D32",
  "Hip-Hop": "#8B5CF6",
  "Afro-Trap": "#F59E0B",
  "Jazz / Blues": "#1565C0",
  "Gospel": "#6A1B9A",
  "Soukous": "#C62828",
  "R&B": "#4527A0",
  "Traditionnel": "#0F766E",
  "Soul": "#B45309",
  "Afro-Beat": "#0891B2",
  "Multi-genre": "#E8601A",
};

export const eventColor = (genre?: string): string =>
  (genre && GENRE_COLORS[genre]) || "#E8601A";

export const fmtEventDate = (iso: string, opts?: Intl.DateTimeFormatOptions) =>
  new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", opts ?? { day: "numeric", month: "long", year: "numeric" });
