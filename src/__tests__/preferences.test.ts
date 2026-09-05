/**
 * Tests unitaires — logique de personnalisation (module pur preferences.ts) :
 *  - canonGenre : correspondance des libellés de genre (accents, synonymes) ;
 *  - computeWizardArtists : filtrage par genres choisis + dévoilement des
 *    artistes du même type à la sélection (étape 3 de l'inscription) ;
 *  - filterFeedByQuery : filtres recherche + genre du flux Explore.
 */

import { describe, it, expect } from "vitest";
import {
  canonGenre,
  computeWizardArtists,
  filterFeedByQuery,
  matchesPreferredGenres,
  orderByPreferredGenres,
  type FeedItem,
} from "../lib/preferences";

/* ── Fixtures ─────────────────────────────────────────────── */

const artist = (id: string, name: string, genre: string): FeedItem & { name: string } => ({ id, name, genre });

// 5 artistes Afro-Pop + 2 R&B + 1 Gospel, ordre = popularité décroissante (serveur)
const CATALOG = [
  artist("a1", "Afro A", "Afro-Pop"),
  artist("a2", "Afro B", "Afro-Pop"),
  artist("a3", "Afro C", "Afro-Pop"),
  artist("a4", "Afro D", "Afro-Pop"),
  artist("a5", "Afro E", "Afro-Pop"),
  artist("r1", "RnB A", "R&B"),
  artist("r2", "RnB B", "R&B"),
  artist("g1", "Gospel A", "Gospel"),
];

/* ── canonGenre ───────────────────────────────────────────── */

describe("canonGenre", () => {
  it("ignore les accents et la ponctuation", () => {
    expect(canonGenre("Afro-Pop")).toBe("afropop");
    expect(canonGenre("Coupé-Décaler")).toBe("coupedecaler");
  });

  it("traite R&B / rnb / R n B comme une même clé", () => {
    expect(canonGenre("R&B")).toBe("rnb");
    expect(canonGenre("rnb")).toBe("rnb");
  });

  it("traite Jazz / Blues comme du jazz", () => {
    expect(canonGenre("Jazz / Blues")).toBe("jazz");
    expect(canonGenre("Jazz")).toBe("jazz");
  });

  it("retourne une chaîne vide pour les valeurs null/blank", () => {
    expect(canonGenre(null)).toBe("");
    expect(canonGenre(undefined)).toBe("");
    expect(canonGenre("")).toBe("");
  });
});

/* ── computeWizardArtists ─────────────────────────────────── */

describe("computeWizardArtists", () => {
  it("sans genres choisis (étape passée) : tous les artistes sont proposés", () => {
    const res = computeWizardArtists({ artists: CATALOG, selectedGenres: [] });
    expect(res.filtered).toHaveLength(8);
    expect(res.visible).toHaveLength(8);
    expect(res.hidden).toBe(0);
  });

  it("restreint la liste aux genres choisis à l'inscription", () => {
    const res = computeWizardArtists({ artists: CATALOG, selectedGenres: ["afro-pop"] });
    expect(res.filtered).toHaveLength(5);
    expect(res.visible.map(v => v.id)).toEqual(["a1", "a2", "a3"]);
    expect(res.hidden).toBe(2);
  });

  it("matche les genres malgré des libellés différents (afro-pop ↔ Afro-Pop, R&B ↔ rnb)", () => {
    const res = computeWizardArtists({ artists: CATALOG, selectedGenres: ["rnb", "afro-pop"] });
    expect(res.filtered.map(v => v.id)).toEqual([
      "a1", "a2", "a3", "a4", "a5", "r1", "r2",
    ]);
  });

  it("choisir un artiste dévoile les autres artistes de son genre", () => {
    // L'auditeur a sélectionné un artiste Afro-Pop → genre afropop « découvert ».
    const res = computeWizardArtists({
      artists: CATALOG,
      selectedGenres: ["afro-pop"],
      revealedGenres: new Set(["afropop"]),
    });
    expect(res.visible.map(v => v.id)).toEqual(["a1", "a2", "a3", "a4", "a5"]);
    expect(res.hidden).toBe(0);
  });

  it("ne dévoile que le genre sélectionné, pas les autres", () => {
    const res = computeWizardArtists({
      artists: CATALOG,
      selectedGenres: ["afro-pop", "rnb", "gospel"],
      revealedGenres: new Set(["rnb"]),
    });
    expect(res.visible.map(v => v.id)).toEqual([
      "a1", "a2", "a3",      // afro-pop : 3 premiers seulement
      "r1", "r2",            // rnb : dévoilé en entier
      "g1",                  // gospel : seul artiste → visible
    ]);
    expect(res.hidden).toBe(2); // a4, a5 toujours cachés
  });

  it("conserve l'ordre de popularité du catalogue", () => {
    const res = computeWizardArtists({ artists: CATALOG, selectedGenres: ["afro-pop", "rnb"] });
    expect(res.visible.map(v => v.id)).toEqual(["a1", "a2", "a3", "r1", "r2"]);
  });

  it("genre inconnu : aucun artiste proposé", () => {
    const res = computeWizardArtists({ artists: CATALOG, selectedGenres: ["soukous"] });
    expect(res.filtered).toHaveLength(0);
    expect(res.visible).toHaveLength(0);
    expect(res.hidden).toBe(0);
  });

  it("ne renvoie rien si le catalogue est vide", () => {
    const res = computeWizardArtists({ artists: [], selectedGenres: ["afro-pop"] });
    expect(res.visible).toHaveLength(0);
    expect(res.hidden).toBe(0);
  });
});

/* ── filterFeedByQuery (flux Explore) ─────────────────────── */

describe("filterFeedByQuery", () => {
  it("recherche par nom (insensible à la casse)", () => {
    const res = filterFeedByQuery(CATALOG, "afro");
    expect(res.map(v => v.id)).toEqual(["a1", "a2", "a3", "a4", "a5"]);
  });

  it("recherche aussi dans le genre", () => {
    const res = filterFeedByQuery(CATALOG, "RnB");
    expect(res.map(v => v.id)).toEqual(["r1", "r2"]);
  });

  it("filtre par genre canonique (chip 'rnb' trouve R&B)", () => {
    const res = filterFeedByQuery(CATALOG, "", "rnb");
    expect(res.map(v => v.id)).toEqual(["r1", "r2"]);
  });

  it("combine recherche + genre", () => {
    const res = filterFeedByQuery(CATALOG, "B", "afropop");
    expect(res.map(v => v.id)).toEqual(["a2"]);
  });

  it("aucun filtre → flux inchangé", () => {
    const res = filterFeedByQuery(CATALOG);
    expect(res).toHaveLength(8);
  });

  it("fonctionne sur des titres (sans nom)", () => {
    const tracks = [
      { id: "t1", genre: "Afro-Pop" },
      { id: "t2", genre: "Gospel" },
    ];
    const res = filterFeedByQuery(tracks, "", "afropop");
    expect(res.map(v => v.id)).toEqual(["t1"]);
  });
});

/* ── orderByPreferredGenres (radios / concerts) ───────────── */

describe("orderByPreferredGenres", () => {
  // Fixtures proches des données réelles : les radios n'ont que des tags,
  // les concerts un champ genre (et des tags).
  const station = (id: string, tags: string[]) => ({ id, name: id, tags });
  const concert = (id: string, genre: string) => ({ id, title: id, genre });

  it("remonte en tête les radios dont un tag correspond (musique/afro-pop…)", () => {
    const radios = [
      station("info", ["Info", "Débats"]),
      station("hit", ["Pop", "Afro-Pop", "Hip-Hop"]),
      station("gospel", ["Gospel", "Spiritualité"]),
    ];
    const ordered = orderByPreferredGenres(radios, ["Afro-Pop", "Hip-Hop"]);
    expect(ordered.map(s => s.id)).toEqual(["hit", "info", "gospel"]);
  });

  it("matche le champ genre d'un concert (R&B ↔ rnb)", () => {
    const concerts = [
      concert("soukous", "Soukous"),
      concert("rnb", "R&B"),
      concert("gospel", "Gospel"),
    ];
    const ordered = orderByPreferredGenres(concerts, ["rnb"]);
    expect(ordered.map(c => c.id)).toEqual(["rnb", "soukous", "gospel"]);
  });

  it("liste de genres vide → ordre d'origine inchangé", () => {
    const radios = [
      station("a", ["Info"]),
      station("b", ["Afro-Pop"]),
    ];
    expect(orderByPreferredGenres(radios, []).map(s => s.id)).toEqual(["a", "b"]);
  });

  it("préserve l'ordre relatif au sein des deux groupes (tri stable)", () => {
    const concerts = [
      concert("hiphop-1", "Hip-Hop"),
      concert("soukous", "Soukous"),
      concert("hiphop-2", "Hip-Hop"),
    ];
    const ordered = orderByPreferredGenres(concerts, ["Hip-Hop"]);
    expect(ordered.map(c => c.id)).toEqual(["hiphop-1", "hiphop-2", "soukous"]);
  });

  it("matchesPreferredGenres teste aussi les tags", () => {
    const pref = new Set(["gospel"]);
    expect(matchesPreferredGenres({ id: "r1", genre: "Pop", tags: ["Gospel"] }, pref)).toBe(true);
    expect(matchesPreferredGenres({ id: "r2", genre: "Pop" }, pref)).toBe(false);
  });
});
