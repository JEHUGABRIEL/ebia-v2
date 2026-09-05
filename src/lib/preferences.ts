/**
 * Logique pure des préférences musicales (aucune dépendance UI/API).
 * ────────────────────────────────────────────────────────────────
 * Partagée par :
 *  - le wizard d'inscription (filtrage des artistes par genres choisis,
 *    dévoilement des artistes du même genre après une sélection) ;
 *  - la page d'exploration (filtres recherche + genre sur le flux
 *    personnalisé).
 *
 * La logique est volontairement sans accès réseau : testable unitairement.
 */

/** Type minimal d'un artiste de flux (découverte ou catalogue). */
export interface FeedItem {
  id: string;
  name?: string | null;
  genre: string | null | undefined;
}

/**
 * Normalise un libellé de genre en clé canonique comparable — même logique
 * que le backend `GenreKey` (accents/ponctuation ignorés, synonymes
 * R&B → rnb, Jazz / Blues → jazz, afrobeats → afrobeat...).
 */
export const canonGenre = (g: string | null | undefined): string => {
  if (!g) return "";
  const flat = g.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
  if (!flat) return "";
  switch (flat) {
    case "rnb": case "rb": case "rndb": return "rnb";
    case "jazzblues": case "jazzandblues": return "jazz";
    case "afrobeats": return "afrobeat";
    case "hiphoprap": return "hiphop";
    case "coupédecaler": case "coupedecaler": return "coupedecaler";
    default: return flat;
  }
};

/** Filtre un flux par recherche (nom ou genre) et par genre canonique. */
export function filterFeedByQuery<T extends FeedItem>(
  items: readonly T[],
  search = "",
  genre: string | null | undefined = null,
): T[] {
  const q = search.trim().toLowerCase();
  return items.filter(item => {
    const matchSearch = !q
      || (item.name ?? "").toLowerCase().includes(q)
      || (item.genre ?? "").toLowerCase().includes(q);
    const matchGenre = !genre || canonGenre(item.genre) === canonGenre(genre);
    return matchSearch && matchGenre;
  });
}

/** Item susceptible de porter un genre et/ou des tags (radio, concert…). */
export interface TaggedItem {
  genre?: string | null;
  tags?: ReadonlyArray<string | null | undefined> | null;
}

/** True si l'item porte (genre ou tags) un des genres préférés. */
export function matchesPreferredGenres<T extends TaggedItem>(
  item: T,
  preferredKeys: ReadonlySet<string>,
): boolean {
  if (preferredKeys.size === 0) return false;
  if (canonGenre(item.genre) && preferredKeys.has(canonGenre(item.genre))) return true;
  return (item.tags ?? []).some(tag => {
    const key = canonGenre(tag);
    return key !== "" && preferredKeys.has(key);
  });
}

/**
 * Réordonne des items (radios, concerts…) en poussant en tête, sans changer
 * leur ordre relatif, ceux dont le genre/tags correspondent aux genres de
 * l'auditeur. Liste vide de genres → ordre d'origine conservé (tri stable).
 */
export function orderByPreferredGenres<T extends TaggedItem>(
  items: readonly T[],
  preferredGenres: readonly string[],
): T[] {
  const keys = new Set(preferredGenres.map(canonGenre));
  if (keys.size === 0) return [...items];

  const matched: T[] = [];
  const others: T[] = [];
  for (const item of items) {
    (matchesPreferredGenres(item, keys) ? matched : others).push(item);
  }
  return [...matched, ...others];
}

/** Résultat du calcul des artistes visibles dans le wizard d'inscription. */
export interface WizardArtistsResult<T> {
  /** Artistes correspondant aux genres choisis (tous, avant dévoilement). */
  filtered: T[];
  /** Artistes réellement affichés (dévoilement progressif appliqué). */
  visible: T[];
  /** Nombre d'artistes encore cachés derrière le dévoilement. */
  hidden: number;
}

export interface WizardArtistsOptions<T> {
  artists: readonly T[];
  /** Genres choisis à l'étape précédente (ids/libellés libres). */
  selectedGenres?: string[];
  /** Clés canoniques des genres « découverts » par une sélection. */
  revealedGenres?: ReadonlySet<string> | Iterable<string>;
  /** Nombre max d'artistes affichés par genre avant dévoilement. */
  initialPerGenre?: number;
}

/**
 * Artistes proposés à l'étape « vos artistes préférés » :
 *  - genres choisis → seuls les artistes de ces genres ;
 *  - chaque genre affiche d'abord `initialPerGenre` artistes ;
 *    choisir un artiste dévoile les autres artistes du même genre ;
 *  - aucun genre choisi (étape passée) → tous les artistes.
 * L'ordre du catalogue (popularité côté serveur) est conservé.
 */
export function computeWizardArtists<T extends FeedItem>(
  opts: WizardArtistsOptions<T>,
): WizardArtistsResult<T> {
  const selectedKeys = new Set((opts.selectedGenres ?? []).map(canonGenre));
  const revealed = new Set(opts.revealedGenres ?? []);
  const perGenre = Math.max(1, opts.initialPerGenre ?? 3);
  const hasGenrePrefs = selectedKeys.size > 0;

  const filtered = hasGenrePrefs
    ? opts.artists.filter(a => selectedKeys.has(canonGenre(a.genre)))
    : [...opts.artists];

  if (!hasGenrePrefs) {
    return { filtered, visible: [...filtered], hidden: 0 };
  }

  const countByGenre = new Map<string, number>();
  const visible: T[] = [];
  for (const artist of filtered) {
    const key = canonGenre(artist.genre);
    if (revealed.has(key)) {
      visible.push(artist);
      continue;
    }
    const idx = countByGenre.get(key) ?? 0;
    if (idx < perGenre) {
      visible.push(artist);
      countByGenre.set(key, idx + 1);
    }
  }

  return { filtered, visible, hidden: filtered.length - visible.length };
}
