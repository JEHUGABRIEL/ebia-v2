const BASE = "http://localhost";
const MINIO = "http://localhost/audio";

export const audioUrl = (filename: string) => `${MINIO}/${filename}`;

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

export type Artist = {
  id: string;
  slug: string;
  name: string;
  bio: string;
  genre: string;
  city: string;
  avatar_url: string;
  cover_url: string;
  verified: boolean;
  followers_count: number;
  plays_count: number;
  tracks_count: number;
  tracks?: Track[];
};

export type Track = {
  id: string;
  title: string;
  duration_s: number;
  genre: string;
  plays_count: number;
  artist_id?: string;
  artist_name?: string;
  artist_avatar?: string;
};

export const getArtists = () =>
  get<{ data: Artist[]; total: number }>("/api/v1/artists");

export const getArtist = (slug: string) =>
  get<Artist>(`/api/v1/artists/${slug}`);

export const getTracks = (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return get<{ data: Track[] }>(`/api/v1/tracks${qs}`);
};
