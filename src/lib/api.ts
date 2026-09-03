import keycloak from "./keycloak";

export const BASE = import.meta.env.VITE_API_URL || "";
const MINIO = import.meta.env.VITE_MINIO_URL ?? "/ebia-audio";
export const audioUrl = (filePath: string) =>
  `${MINIO}/${filePath.split("/").map(encodeURIComponent).join("/")}`;

/* ── Helpers HTTP ── */
const authHeaders = (extra: Record<string, string> = {}): Record<string, string> => {
  const token = localStorage.getItem("ebia_token") || keycloak.token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { ...authHeaders(), ...(init?.headers as Record<string, string> ?? {}) },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as Record<string, string>;
      throw Object.assign(new Error(err.error || `HTTP ${res.status}`), { status: res.status });
    }
    return res.json() as Promise<T>;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Le serveur met trop de temps à répondre. Vérifiez votre connexion.");
    }
    if (e instanceof TypeError && e.message === "Failed to fetch") {
      throw new Error("Impossible de joindre le serveur. Vérifiez votre connexion internet.");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

const get   = <T>(path: string) => req<T>(path);
const post  = <T>(path: string, body: unknown) =>
  req<T>(path, { method: "POST", body: JSON.stringify(body) });
const patch = <T>(path: string, body: unknown) =>
  req<T>(path, { method: "PATCH", body: JSON.stringify(body) });
const put   = <T>(path: string, body: unknown) =>
  req<T>(path, { method: "PUT", body: JSON.stringify(body) });
const del   = <T>(path: string) => req<T>(path, { method: "DELETE" });

/* ── Types publics ── */
export type Artist = {
  id: string; slug: string; name: string; bio: string; genre: string;
  city: string; avatar_url: string; cover_url: string; verified: boolean;
  user_id?: string;
  followers_count: number; plays_count: number; tracks_count: number;
  tracks?: Track[];
};

export type Track = {
  id: string; title: string; duration_s: number; genre: string;
  plays_count: number; likes_count: number; artist_id?: string;
  artistId?: string; artist_name?: string; artistName?: string; artist_avatar?: string;
  slug?: string;
  createdAt?: string;
};

/* ── Types artiste dashboard ── */
export type MyTrack = {
  id: string; title: string; genre: string; duration_s: number;
  plays_count: number; likes_count: number;
  album_name?: string; album_cover_url?: string;
  status: "published" | "draft" | "pending"; published_at?: string;
  release_date?: string;
  file_path: string;
};

export type ArtistStats = {
  total_plays: number; total_likes: number; total_followers: number;
  tracks_published: number; tracks_draft: number;
  monthly: { month: string; plays: number; likes: number }[];
};

export type MyArtistProfile = {
  id: string; slug: string; name: string; stage_name: string;
  bio: string; genre: string; city: string;
  avatar_url: string; cover_url: string;
  verified: boolean; plan: "free" | "pro";
  free_tracks_used: number; free_tracks_limit: number;
};

/* ── Types inscription ── */
export type ListenerRegData = {
  email: string; password: string; firstName: string; lastName: string;
  genres?: string[]; favoriteArtistIds?: string[];
};

export type ArtistRegData = {
  email: string; password: string;
  firstName: string; lastName: string;
  stageName: string;
  birthDate: string;
  idType: "cni" | "passport";
  idNumber: string;
  genre: string; city: string; bio?: string; phone?: string;
};

/* ── API publique ── */
export const getArtists = () =>
  get<{ data: Artist[]; total: number }>("/api/v1/artists");

export const getArtist = (slug: string) =>
  get<Artist>(`/api/v1/artists/${slug}`);

export const getTracks = (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return get<{ data: Track[] }>(`/api/v1/tracks${qs}`);
};

export const searchTracks = (q: string, limit = 10) =>
  get<Track[]>(`/api/v1/tracks/search?q=${encodeURIComponent(q)}&limit=${limit}`);


/* ── Inscription ── */
export const registerListener = (data: ListenerRegData) =>
  post<{ id: string; message: string }>("/api/v1/auth/register", { ...data, role: "listener" });

export const registerArtist = (data: ArtistRegData) =>
  post<{ id: string; message: string }>("/api/v1/auth/register/artist", data);

/* ── Dashboard artiste ── */
export const getMyArtistProfile = () =>
  get<MyArtistProfile>("/api/v1/artists/me");

export const becomeArtist = (data: { stage_name: string; genre: string; city: string }) =>
  post<{ access_token: string; token_type: string }>("/api/v1/auth/become-artist", {
    stageName: data.stage_name,
    name: data.stage_name,
    genre: data.genre,
    city: data.city,
  });

export const updateMyArtistProfile = (data: Partial<MyArtistProfile> & { bio?: string }) =>
  put<MyArtistProfile>("/api/v1/artists/me", data);

export const getMyTracks = () =>
  get<{ data: MyTrack[]; total: number }>("/api/v1/artists/me/tracks");

export const getMyStats = () =>
  get<ArtistStats>("/api/v1/artists/me/stats");

export const deleteMyTrack = (trackId: string) =>
  del<{ message: string }>(`/api/v1/artists/me/tracks/${trackId}`);

/* ── Titres tendances & rétro ── */
export const getTrendingTracks = (limit = 20) =>
  get<Track[]>(`/api/v1/tracks/trending?limit=${limit}`);

export const getRetroTracks = (limit = 20) =>
  get<Track[]>(`/api/v1/tracks/retro?limit=${limit}`);

/* Upload multipart — audio + cover album optionnel */
export const uploadTrack = (formData: FormData): Promise<MyTrack> =>
  fetch(`${BASE}/api/v1/artists/me/tracks`, {
    method: "POST",
    headers: (localStorage.getItem('ebia_token') || keycloak.token) ? { Authorization: `Bearer ${localStorage.getItem('ebia_token') || keycloak.token!}` } : undefined,
    body: formData,
  }).then(async res => {
    if (!res.ok) {
      const e = await res.json().catch(() => ({})) as Record<string, string>;
      throw new Error(e.error || `HTTP ${res.status}`);
    }
    return res.json() as Promise<MyTrack>;
  });

/* Upload avatar/cover */
export const uploadArtistImage = (field: "avatar" | "cover", file: File): Promise<{ url: string }> => {
  const fd = new FormData();
  fd.append("field", field);
  fd.append("file", file);
  return fetch(`${BASE}/api/v1/artists/me/images`, {
    method: "POST",
    headers: (localStorage.getItem('ebia_token') || keycloak.token) ? { Authorization: `Bearer ${localStorage.getItem('ebia_token') || keycloak.token!}` } : undefined,
    body: fd,
  }).then(async res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<{ url: string }>;
  });
};

/* ── Upload profil utilisateur ── */
export const uploadUserAvatar = (file: File): Promise<{ url: string }> => {
  const fd = new FormData();
  fd.append('file', file);
  const token = localStorage.getItem('ebia_token') || keycloak.token;
  return fetch(`${BASE}/api/v1/auth/upload/avatar`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  }).then(async res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<{ url: string }>;
  });
};

export const uploadIdDoc = (file: File): Promise<{ message: string; key: string }> => {
  const fd = new FormData();
  fd.append('file', file);
  return fetch(`${BASE}/api/v1/auth/upload/id-doc`, {
    method: 'POST',
    headers: (localStorage.getItem('ebia_token') || keycloak.token) ? { Authorization: `Bearer ${localStorage.getItem('ebia_token') || keycloak.token!}` } : undefined,
    body: fd,
  }).then(async res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<{ message: string; key: string }>;
  });
};

/* ── Messagerie artistes ── */
export type ConversationMember = {
  userId: string;
  displayName: string;
  avatarUrl: string;
};

export type Conversation = {
  id: string;
  type: "direct" | "group";
  otherParticipantId: string | null;
  otherParticipantName: string | null;
  otherParticipantAvatar: string | null;
  groupName: string | null;
  members: ConversationMember[];
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

export type MessageReaction = {
  id: string;
  userId: string;
  emoji: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  read: boolean;
  createdAt: string;
  reactions?: Record<string, MessageReaction[]>;
};

export const getConversations = () =>
  get<Conversation[]>("/api/v1/messages");

export const getMessages = (conversationId: string, page = 0, size = 50) =>
  get<{ data: ChatMessage[]; page: number; size: number }>(
    `/api/v1/messages/${conversationId}?page=${page}&size=${size}`
  );

export const sendMessage = (recipientId: string, content: string) =>
  post<{ id: string; conversationId: string; content: string; createdAt: string }>(
    "/api/v1/messages",
    { recipientId, content }
  );

export const sendGroupMessage = (conversationId: string, content: string) =>
  post<{ id: string; conversationId: string; content: string; createdAt: string }>(
    `/api/v1/messages/${conversationId}`,
    { content }
  );

export const createGroupConversation = (name: string, memberIds: string[]) =>
  post<{ id: string; groupName: string; type: string }>(
    "/api/v1/messages/group",
    { name, memberIds }
  );

export const getArtistsForMessaging = () =>
  get<{ data: Artist[] }>("/api/v1/artists");

export const searchMessages = (query: string, limit = 20) =>
  get<{ data: ChatMessage[]; query: string }>(
    `/api/v1/messages/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );

export const toggleReaction = (messageId: string, emoji: string) =>
  post<{ added: boolean; emoji: string; reactions: MessageReaction[] }>(
    `/api/v1/messages/${messageId}/reactions`,
    { emoji }
  );

/* ── Mot de passe oublié ── */
export const forgotPassword = (email: string) =>
  post<{ message: string }>("/api/v1/auth/forgot-password", { email });

export const resetPassword = (token: string, newPassword: string) =>
  post<{ message: string }>("/api/v1/auth/reset-password", { token, newPassword });

/* ── Social ── */
export const recordPlay = (trackId: string) =>
  post<{ plays_count: number }>(`/api/v1/tracks/${trackId}/play`, {});

export const toggleLike = (trackId: string) =>
  post<{ liked: boolean; likes_count: number }>(`/api/v1/tracks/${trackId}/like`, {});

export const toggleFollow = (artistId: string) =>
  post<{ followed: boolean; followers_count: number }>(`/api/v1/artists/${artistId}/follow`, {});

export const updateProfile = (data: { display_name?: string; avatar_url?: string; phone?: string; current_password?: string; new_password?: string }) =>
  patch<{ access_token: string; user: Record<string, string> }>("/api/v1/auth/profile", data);

/* ── Notifications ── */
export type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  actorName?: string;
  actorAvatar?: string;
  entityType?: string;
  entityId?: string;
  entitySlug?: string;
  read: boolean;
  createdAt: string;
};

export const getNotifications = (page = 0, size = 20) =>
  get<{ data: Notification[]; unread_count: number; page: number; size: number }>(
    `/api/v1/notifications?page=${page}&size=${size}`
  );

export const getUnreadNotificationCount = () =>
  get<{ unread_count: number }>('/api/v1/notifications/unread-count');

export const markNotificationAsRead = (id: string) =>
  put<{ message: string }>(`/api/v1/notifications/${id}/read`, {});

export const markAllNotificationsAsRead = () =>
  put<{ message: string }>('/api/v1/notifications/read-all', {});
