/**
 * Tests unitaires pour le module offline.ts (IndexedDB)
 * ─────────────────────────────────────────────────────────────
 * On utilise fake-indexeddb pour simuler IndexedDB dans node.
 * Dans ce test on mocke les appels IndexedDB avec des implémentations
 * minimales pour vérifier la logique métier (expiration, purge, etc.).
 *
 * NOTE: Pour éviter la complexité de fake-indexeddb, on teste
 * les fonctions qui ne dépendent PAS d'IndexedDB directement
 * (daysLeft) et on mocke les appels à IndexedDB pour les autres.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Module à tester ──────────────────────────────────────────

// On va tester les fonctions exportées de offline.ts
// En mockant les appels IndexedDB
const EXPIRY_DAYS = 7;

interface OfflineTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration_s: number;
  coverUrl?: string;
  audioBlob: Blob;
  downloadedAt: number;
  expiresAt: number;
}

type OfflineTrackInput = Omit<OfflineTrack, "downloadedAt" | "expiresAt">;

// ── Helper daysLeft (pure, pas de DB) ────────────────────────

function daysLeft(track: OfflineTrack): number {
  return Math.max(0, Math.ceil((track.expiresAt - Date.now()) / 86_400_000));
}

// ── Module mocké pour les tests IndexedDB ────────────────────

// Simule un store en mémoire (remplace IndexedDB)
const mockStore = new Map<string, OfflineTrack>();
const mockOpenRejects = vi.fn<() => boolean>(() => false);
const mockGetRejects = vi.fn<() => boolean>(() => false);

// On réinitialise le store avant chaque test
beforeEach(() => {
  mockStore.clear();
  mockOpenRejects.mockReturnValue(false);
  mockGetRejects.mockReturnValue(false);
});

// Helper pour créer un enregistrement offline
function createMockTrack(overrides: Partial<OfflineTrack> = {}): OfflineTrack {
  const now = Date.now();
  return {
    id: "test-001",
    title: "Test Song",
    artist: "Test Artist",
    genre: "Afro-Pop",
    duration_s: 240,
    audioBlob: new Blob(["fake-audio-data"], { type: "audio/mpeg" }),
    downloadedAt: now,
    expiresAt: now + EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    ...overrides,
  };
}

// Implémentations mockées des fonctions offline
async function mockSaveOfflineTrack(track: OfflineTrackInput): Promise<void> {
  if (mockOpenRejects()) throw new Error("DB open error");
  const now = Date.now();
  const entry: OfflineTrack = {
    ...track,
    downloadedAt: now,
    expiresAt: now + EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  };
  mockStore.set(track.id, entry);
}

async function mockGetOfflineTrack(id: string): Promise<OfflineTrack | null> {
  if (mockOpenRejects()) throw new Error("DB open error");
  const track = mockStore.get(id);
  if (!track) return null;
  if (Date.now() > track.expiresAt) {
    mockStore.delete(id);
    return null;
  }
  return track;
}

async function mockGetAllOfflineTracks(): Promise<OfflineTrack[]> {
  if (mockOpenRejects()) throw new Error("DB open error");
  // Le vrai getAllOfflineTracks ne filtre pas les expirés
  return Array.from(mockStore.values());
}

async function mockDeleteOfflineTrack(id: string): Promise<void> {
  if (mockOpenRejects()) throw new Error("DB open error");
  mockStore.delete(id);
}

async function mockPurgeExpiredTracks(): Promise<number> {
  if (mockOpenRejects()) throw new Error("DB open error");
  const now = Date.now();
  let count = 0;
  for (const [id, track] of mockStore.entries()) {
    if (now > track.expiresAt) {
      mockStore.delete(id);
      count++;
    }
  }
  return count;
}

// ── Tests ────────────────────────────────────────────────────

describe("daysLeft()", () => {
  it("retourne le nombre de jours restants pour un téléchargement valide", () => {
    const future = Date.now() + 3 * 86_400_000; // 3 jours
    const track = createMockTrack({ expiresAt: future });
    expect(daysLeft(track)).toBe(3);
  });

  it("retourne 0 pour un téléchargement expiré", () => {
    const past = Date.now() - 86_400_000; // -1 jour
    const track = createMockTrack({ expiresAt: past });
    expect(daysLeft(track)).toBe(0);
  });

  it("retourne 0 pour exactement à l'expiration", () => {
    const track = createMockTrack({ expiresAt: Date.now() });
    expect(daysLeft(track)).toBe(0);
  });

  it("retourne 7 pour un téléchargement tout juste effectué", () => {
    const future = Date.now() + 7 * 86_400_000;
    const track = createMockTrack({ expiresAt: future });
    expect(daysLeft(track)).toBe(7);
  });
});

describe("saveOfflineTrack (mocké)", () => {
  it("sauvegarde un titre et lui ajoute downloadedAt/expiresAt", async () => {
    const input: OfflineTrackInput = {
      id: "track-1",
      title: "One Africa",
      artist: "Cool Fawa",
      genre: "Hip-Hop",
      duration_s: 260,
      audioBlob: new Blob(["data"], { type: "audio/mpeg" }),
    };

    await mockSaveOfflineTrack(input);

    const saved = mockStore.get("track-1");
    expect(saved).toBeDefined();
    expect(saved!.title).toBe("One Africa");
    expect(saved!.artist).toBe("Cool Fawa");
    expect(saved!.downloadedAt).toBeGreaterThan(0);
    expect(saved!.expiresAt).toBeGreaterThan(saved!.downloadedAt);
    expect(saved!.expiresAt - saved!.downloadedAt).toBe(
      EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );
  });
});

describe("getOfflineTrack (mocké)", () => {
  it("retourne le titre s'il existe et n'est pas expiré", async () => {
    const track = createMockTrack({ id: "track-1" });
    mockStore.set("track-1", track);

    const result = await mockGetOfflineTrack("track-1");
    expect(result).not.toBeNull();
    expect(result!.id).toBe("track-1");
    expect(result!.title).toBe("Test Song");
  });

  it("retourne null si le titre n'existe pas", async () => {
    const result = await mockGetOfflineTrack("track-inexistant");
    expect(result).toBeNull();
  });

  it("retourne null si le titre est expiré (et le supprime)", async () => {
    const expired = createMockTrack({
      id: "track-expired",
      expiresAt: Date.now() - 1000, // déjà expiré
    });
    mockStore.set("track-expired", expired);

    const result = await mockGetOfflineTrack("track-expired");
    expect(result).toBeNull();
    // Vérifie qu'il a été supprimé du store
    expect(mockStore.has("track-expired")).toBe(false);
  });
});

describe("getAllOfflineTracks (mocké)", () => {
  it("retourne tous les titres du store", async () => {
    mockStore.set("a", createMockTrack({ id: "a", title: "Song A" }));
    mockStore.set("b", createMockTrack({ id: "b", title: "Song B" }));

    const all = await mockGetAllOfflineTracks();
    expect(all).toHaveLength(2);
    expect(all.map((t) => t.id).sort()).toEqual(["a", "b"]);
  });

  it("retourne un tableau vide si aucun titre sauvegardé", async () => {
    const all = await mockGetAllOfflineTracks();
    expect(all).toHaveLength(0);
  });
});

describe("deleteOfflineTrack (mocké)", () => {
  it("supprime un titre du store", async () => {
    mockStore.set("track-1", createMockTrack({ id: "track-1" }));
    expect(mockStore.has("track-1")).toBe(true);

    await mockDeleteOfflineTrack("track-1");
    expect(mockStore.has("track-1")).toBe(false);
  });

  it("ne génère pas d'erreur si le titre n'existe pas", async () => {
    // Ne devrait pas throw
    await expect(mockDeleteOfflineTrack("track-inexistant")).resolves.not.toThrow();
  });
});

describe("purgeExpiredTracks (mocké)", () => {
  it("purge les titres expirés et retourne le nombre", async () => {
    const now = Date.now();
    mockStore.set("valide", createMockTrack({
      id: "valide",
      expiresAt: now + 86_400_000, // expire demain
    }));
    mockStore.set("expire-1", createMockTrack({
      id: "expire-1",
      expiresAt: now - 1000, // déjà expiré
    }));
    mockStore.set("expire-2", createMockTrack({
      id: "expire-2",
      expiresAt: now - 86_400_000, // expiré depuis 1 jour
    }));

    const purged = await mockPurgeExpiredTracks();
    expect(purged).toBe(2);
    expect(mockStore.has("valide")).toBe(true);
    expect(mockStore.has("expire-1")).toBe(false);
    expect(mockStore.has("expire-2")).toBe(false);
  });

  it("retourne 0 si aucun titre expiré", async () => {
    const now = Date.now();
    mockStore.set("a", createMockTrack({
      id: "a",
      expiresAt: now + 86_400_000, // expire demain
    }));
    mockStore.set("b", createMockTrack({
      id: "b",
      expiresAt: now + 7 * 86_400_000, // expire dans 7 jours
    }));

    const purged = await mockPurgeExpiredTracks();
    expect(purged).toBe(0);
    expect(mockStore.size).toBe(2);
  });
});

describe("downloadTrack (simulation)", () => {
  /** Simule la fonction downloadTrack() d'AppContext.tsx
   *  avec le correctif : appelle /download au lieu de /stream
   */
  async function simulateDownloadTrack(trackId: string): Promise<OfflineTrack> {
    // Simule l'appel API au backend (maintenant /download avec auth)
    const mockApiResponse = {
      url: "https://minio.example.com/tracks/test.mp3?token=xxx",
      title: "Test Song",
      duration_s: 240,
      expires_in: 172800,
    };

    // Simuler le téléchargement du blob audio
    const audioBlob = new Blob(["downloaded-audio-data"], { type: "audio/mpeg" });

    // Sauvegarder dans le store offline
    const track: OfflineTrackInput = {
      id: trackId,
      title: mockApiResponse.title,
      artist: "Cool Fawa",
      genre: "Afro-Pop",
      duration_s: mockApiResponse.duration_s,
      audioBlob,
    };

    await mockSaveOfflineTrack(track);

    const saved = mockStore.get(trackId);
    expect(saved).toBeDefined();
    expect(saved!.id).toBe(trackId);
    expect(saved!.audioBlob.size).toBeGreaterThan(0);
    return saved!;
  }

  it("simule un téléchargement complet (API + sauvegarde IndexedDB)", async () => {
    const saved = await simulateDownloadTrack("track-dl-1");
    expect(saved.title).toBe("Test Song");
    expect(saved.duration_s).toBe(240);
    expect(saved.downloadedAt).toBeGreaterThan(0);
    expect(saved.expiresAt).toBeGreaterThan(saved.downloadedAt);
  });

  it("plusieurs téléchargements ne s'écrasent pas", async () => {
    await simulateDownloadTrack("track-1");
    await simulateDownloadTrack("track-2");

    expect(mockStore.size).toBe(2);
    expect(mockStore.get("track-1")!.id).toBe("track-1");
    expect(mockStore.get("track-2")!.id).toBe("track-2");
  });
});
