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
  status: "published" | "draft" | "pending_review" | "rejected"; published_at?: string;
  rejection_reason?: string;
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

export const registerArtist = (data: ArtistRegData, idDocFile: File): Promise<{ id: string; message: string }> => {
  const fd = new FormData();
  fd.append("email", data.email);
  fd.append("password", data.password);
  fd.append("firstName", data.firstName);
  fd.append("lastName", data.lastName);
  fd.append("stageName", data.stageName);
  fd.append("genre", data.genre);
  fd.append("city", data.city);
  if (data.bio) fd.append("bio", data.bio);
  if (data.phone) fd.append("phone", data.phone);
  fd.append("id_doc", idDocFile);
  return fetch(`${BASE}/api/v1/auth/register/artist`, { method: "POST", body: fd })
    .then(async res => {
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      return body;
    });
};

/* ── Dashboard artiste ── */
export const getMyArtistProfile = () =>
  get<MyArtistProfile>("/api/v1/artists/me");

export const becomeArtist = (data: { stage_name: string; genre: string; city: string }, idDocFile: File): Promise<{ id: string; message: string }> => {
  const fd = new FormData();
  fd.append("stageName", data.stage_name);
  fd.append("name", data.stage_name);
  fd.append("genre", data.genre);
  fd.append("city", data.city);
  fd.append("id_doc", idDocFile);
  const token = localStorage.getItem('ebia_token') || keycloak.token;
  return fetch(`${BASE}/api/v1/auth/become-artist`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd,
  }).then(async res => {
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return body;
  });
};

export const updateMyArtistProfile = (data: Partial<MyArtistProfile> & { bio?: string }) =>
  put<MyArtistProfile & { pending_changes?: Record<string, unknown> }>("/api/v1/artists/me", data);

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
export const uploadArtistImage = (field: "avatar" | "cover", file: File): Promise<{ url: string; pending?: boolean; message?: string }> => {
  const fd = new FormData();
  fd.append("field", field);
  fd.append("file", file);
  return fetch(`${BASE}/api/v1/artists/me/images`, {
    method: "POST",
    headers: (localStorage.getItem('ebia_token') || keycloak.token) ? { Authorization: `Bearer ${localStorage.getItem('ebia_token') || keycloak.token!}` } : undefined,
    body: fd,
  }).then(async res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<{ url: string; pending?: boolean; message?: string }>;
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

export type ChatMessageType = "text" | "image" | "audio" | "video";

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type?: ChatMessageType;
  mediaUrl?: string | null;
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

/** Options d'envoi : type de message média + URL (upload préalable via uploadChatMedia). */
export type SendMessageOptions = {
  type?: Exclude<ChatMessageType, "text">;
  mediaUrl?: string;
};

export const sendMessage = (
  recipientId: string,
  content: string,
  opts?: SendMessageOptions
) =>
  post<{ id: string; conversationId: string; content: string; type?: ChatMessageType; mediaUrl?: string | null; createdAt: string }>(
    "/api/v1/messages",
    { recipientId, content, type: opts?.type ?? undefined, mediaUrl: opts?.mediaUrl ?? undefined }
  );

export const sendGroupMessage = (
  conversationId: string,
  content: string,
  opts?: SendMessageOptions
) =>
  post<{ id: string; conversationId: string; content: string; type?: ChatMessageType; mediaUrl?: string | null; createdAt: string }>(
    `/api/v1/messages/${conversationId}`,
    { content, type: opts?.type ?? undefined, mediaUrl: opts?.mediaUrl ?? undefined }
  );

/**
 * Upload un média (image/audio/vidéo) pour la messagerie, avec suivi de progression.
 * @returns URL publique du fichier.
 */
export const uploadChatMedia = (
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url: string }> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const token = localStorage.getItem("ebia_token") || keycloak.token;
    const fd = new FormData();
    fd.append("file", file);
    xhr.open("POST", `${BASE}/api/v1/messages/media`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.timeout = 180_000;
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText || "{}") as { url?: string; error?: string };
        if (xhr.status >= 200 && xhr.status < 300 && body.url) resolve({ url: body.url });
        else reject(new Error(body.error || `HTTP ${xhr.status}`));
      } catch { reject(new Error("Réponse invalide du serveur")); }
    };
    xhr.onerror = () => reject(new Error("Erreur réseau pendant l'upload"));
    xhr.ontimeout = () => reject(new Error("L'upload a pris trop de temps."));
    xhr.send(fd);
  });

export const createGroupConversation = (name: string, memberIds: string[]) =>
  post<{ id: string; groupName: string; type: string }>(
    "/api/v1/messages/group",
    { name, memberIds }
  );

/** Signale un appel audio/vidéo resté sans réponse (déclenche une notification "appel manqué"). */
export const reportMissedCall = (calleeId: string, type: "audio" | "video") =>
  post<{ reported: boolean }>("/api/v1/calls/missed", { calleeId, type });

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

/* ── Découverte personnalisée ── */
// canonGenre vit dans ./preferences (module pur) — ré-exporté ici pour
// préserver l'import existant depuis les pages.
export { canonGenre } from "./preferences";

export type DiscoverArtist = {
  id: string; slug: string; name: string; genre: string; city: string;
  avatar_url: string | null; cover_url: string | null; verified: boolean;
  plays_count: number; followers_count: number;
};

export type DiscoverTrack = {
  id: string; title: string; slug?: string; genre: string; duration_s: number;
  plays_count: number; likes_count: number;
  audio_url: string | null; cover_url: string | null; created_at?: string | null;
  artist_id?: string | null; artist_name?: string; artist_avatar?: string | null;
};

export type DiscoverMode = "explicit" | "implicit" | "none";

export type DiscoverResponse<T> = {
  mode: DiscoverMode;
  genres: string[];
  data: T[];
};

/**
 * Découverte personnalisée : genres choisis à l'inscription → uniquement ces
 * types ; sinon activité réelle (écoutes/likes/abonnements) → genres favoris
 * en tête ; sinon contenu mélangé. Anonyme → ordre public par popularité.
 */
export const getDiscoverArtists = () =>
  get<DiscoverResponse<DiscoverArtist>>("/api/v1/discover/artists");

export const getDiscoverTracks = () =>
  get<DiscoverResponse<DiscoverTrack>>("/api/v1/discover/tracks");

/** Autres artistes partageant le même genre qu'un artiste donné. */
export const getSimilarArtists = (artistId: string, limit = 8) =>
  get<{ data: DiscoverArtist[]; total: number }>(`/api/v1/discover/artists/${artistId}/similar?limit=${limit}`);

/**
 * Genres « actifs » de l'auditeur courant (tels que calculés par le moteur de
 * découverte) : genres choisis à l'inscription ou affinités déduites de son
 * activité. Vide en mode aléatoire ou pour un visiteur → pas de re-tri.
 */
export const getListenerPreferredGenres = async (role?: string | null): Promise<string[]> => {
  if (role === "artist" || role === "admin") return [];
  try {
    const res = await getDiscoverTracks();
    return res.mode === "none" ? [] : res.genres ?? [];
  } catch {
    return [];
  }
};

/** Token courant (localStorage puis Keycloak) pour les appels authentifiés. */
export const getAuthToken = (): string | null =>
  localStorage.getItem("ebia_token") || keycloak.token || null;

export const isLoggedListener = (role?: string | null) =>
  role !== "artist" && role !== "admin";

/* ── Social ── */
export const recordPlay = (trackId: string) =>
  post<{ plays_count: number }>(`/api/v1/tracks/${trackId}/play`, {});

export const toggleLike = (trackId: string) =>
  post<{ liked: boolean; likes_count: number }>(`/api/v1/tracks/${trackId}/like`, {});

export const toggleFollow = (artistId: string) =>
  post<{ followed: boolean; followers_count: number }>(`/api/v1/artists/${artistId}/follow`, {});

export type LikedTrack = {
  id: string; title: string; slug?: string;
  artistId?: string; artistName?: string;
  audioUrl: string; coverUrl?: string | null;
  genre?: string; durationSeconds?: number;
  playCount?: number; likeCount?: number;
};

export const getLikedTracks = () =>
  get<LikedTrack[]>("/api/v1/tracks/liked");

export const getFollowedArtists = () =>
  get<{ data: Artist[]; total: number }>("/api/v1/artists/followed");

export const updateProfile = (data: { display_name?: string; avatar_url?: string; phone?: string; current_password?: string; new_password?: string }) =>
  patch<{ access_token: string; user: Record<string, string>; pending_password_change?: string }>("/api/v1/auth/profile", data);

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

/* ── Playlists ── */
export type PlaylistTrackItem = {
  id: string;
  trackId: string;
  trackTitle: string;
  artistName: string;
  position: number;
  addedAt: string;
};

export type Playlist = {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  ownerId: string;
  ownerName: string;
  trackCount: number;
  tracks: PlaylistTrackItem[];
  createdAt: string;
  updatedAt: string;
};

export const getMyPlaylists = () =>
  get<Playlist[]>("/api/playlists");

export const getPlaylist = (playlistId: string) =>
  get<Playlist>(`/api/playlists/${playlistId}`);

export const createPlaylist = (data: { name: string; description?: string; isPublic?: boolean }) =>
  post<Playlist>("/api/playlists", data);

export const updatePlaylist = (playlistId: string, data: { name?: string; description?: string; isPublic?: boolean }) =>
  put<Playlist>(`/api/playlists/${playlistId}`, data);

export const deletePlaylist = (playlistId: string) =>
  del<{ message: string }>(`/api/playlists/${playlistId}`);

export const addTrackToPlaylist = (playlistId: string, trackId: string) =>
  post<Playlist>(`/api/playlists/${playlistId}/tracks`, { trackId });

export const removeTrackFromPlaylist = (playlistId: string, trackId: string) =>
  del<Playlist>(`/api/playlists/${playlistId}/tracks/${trackId}`);

export const reorderPlaylistTracks = (playlistId: string, trackIds: string[]) =>
  put<Playlist>(`/api/playlists/${playlistId}/reorder`, { trackIds });

/* ── Play History ── */
export type PlayHistoryItem = {
  id: string;
  trackId: string;
  trackTitle: string;
  artistName: string;
  durationPlayed: number | null;
  playedAt: string;
};

export const getPlayHistory = (page = 0, size = 50) =>
  get<PlayHistoryItem[]>(`/api/play-history?page=${page}&size=${size}`);

export const recordPlayHistory = (data: { trackId: string; trackTitle?: string; artistName?: string; durationPlayed?: number }) =>
  post<PlayHistoryItem>('/api/play-history', data);

export const clearPlayHistory = () =>
  del<{ message: string }>('/api/play-history');

export const deletePlayHistoryEntry = (historyId: string) =>
  del<{ message: string }>(`/api/play-history/${historyId}`);

/* ── Admin Dashboard ── */
export type AdminStats = {
  totalUsers: number;
  totalArtists: number;
  totalTracks: number;
  totalPlays: number;
  totalLikes: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  activeUsersToday: number;
  computedAt: string;
};

export type AdminAccountStatus = "active" | "suspended" | "banned" | "deleted";

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  active: boolean;
  accountStatus: AdminAccountStatus;
  subscription: "free" | "pro";
  createdAt: string;
};

export type AdminUserDetails = AdminUser & {
  phone?: string;
  verificationStatus: string;
  statusReason?: string;
  statusChangedAt?: string;
  pendingProfileChanges: number;
  artist?: {
    stageName: string; bio?: string; genre: string; city: string;
    avatarUrl?: string; coverUrl?: string; verified: boolean;
    followersCount: number; playsCount: number; tracksCount: number;
  };
  identityDocument?: {
    status: string; submittedAt?: string; rejectionReason?: string;
  };
};

export const getAdminStats = () =>
  get<AdminStats>('/api/admin/stats');

export const getAdminUsers = (page = 0, size = 20, role?: string, subscription?: "free" | "pro") => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (role) params.set('role', role);
  if (subscription) params.set('subscription', subscription);
  return get<AdminUser[]>(`/api/admin/users?${params}`);
};

export const getAdminUserDetails = (userId: string) =>
  get<AdminUserDetails>(`/api/admin/users/${userId}`);

export type SubscriptionSummary = { pro: number; free: number; total: number };

export const getSubscriptionSummary = () =>
  get<SubscriptionSummary>('/api/admin/subscriptions/summary');

export const changeUserRole = (userId: string, role: string) =>
  put<{ message: string }>(`/api/admin/users/${userId}/role`, { role });

export const changeUserSubscription = (userId: string, plan: "free" | "pro") =>
  put<{ message: string; subscription: string }>(`/api/admin/users/${userId}/subscription`, { plan });

export const suspendUser = (userId: string, reason?: string) =>
  post<{ message: string; accountStatus: string }>(`/api/admin/users/${userId}/suspend`, { reason });

export const banUser = (userId: string, reason?: string) =>
  post<{ message: string; accountStatus: string }>(`/api/admin/users/${userId}/ban`, { reason });

export const reactivateUser = (userId: string) =>
  post<{ message: string; accountStatus: string }>(`/api/admin/users/${userId}/reactivate`, {});

export const deleteUserAccount = (userId: string) =>
  del<{ message: string }>(`/api/admin/users/${userId}`);

/* ── Admin — Validations (comptes artistes, profils, titres) ── */
export type ArtistValidation = {
  id: string; userId: string; email: string; stageName: string;
  genre: string; city: string; submittedAt: string;
  rejectionReason?: string; documentUrl?: string;
};

export type ProfileChangeValidation = {
  id: string; userId: string; email: string; displayName: string;
  changeType: "PASSWORD" | "AVATAR" | "COVER" | "ARTIST_PROFILE";
  payload: Record<string, unknown>; createdAt: string;
};

export type TrackValidation = {
  id: string; title: string; genre: string; albumName?: string;
  artistId: string; artistName: string; createdAt: string; streamUrl?: string;
};

export const getArtistValidations = (status: "pending" | "approved" | "rejected" = "pending") =>
  get<ArtistValidation[]>(`/api/admin/validations/artists?status=${status}`);
export const approveArtist = (id: string) =>
  post<{ message: string }>(`/api/admin/validations/artists/${id}/approve`, {});
export const rejectArtist = (id: string, reason?: string) =>
  post<{ message: string }>(`/api/admin/validations/artists/${id}/reject`, { reason });

export const getProfileChangeValidations = (status: "pending" | "approved" | "rejected" = "pending") =>
  get<ProfileChangeValidation[]>(`/api/admin/validations/profile-changes?status=${status}`);
export const approveProfileChange = (id: string) =>
  post<{ message: string }>(`/api/admin/validations/profile-changes/${id}/approve`, {});
export const rejectProfileChange = (id: string, reason?: string) =>
  post<{ message: string }>(`/api/admin/validations/profile-changes/${id}/reject`, { reason });

export const getTrackValidations = () =>
  get<TrackValidation[]>(`/api/admin/validations/tracks`);
export const approveTrack = (id: string) =>
  post<{ message: string }>(`/api/admin/validations/tracks/${id}/approve`, {});
export const rejectTrack = (id: string, reason?: string) =>
  post<{ message: string }>(`/api/admin/validations/tracks/${id}/reject`, { reason });

/* ── User Settings ── */
export type UserSettings = {
  displayName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  language: string;
  theme: string;
  updatedAt: string;
};

export const getUserSettings = () =>
  get<UserSettings>('/api/settings');

export const updateUserSettings = (data: Partial<UserSettings>) =>
  put<UserSettings>('/api/settings', data);

export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
  put<{ message: string }>('/api/settings/password', data);

/* ── Lyrics ── */
export type LyricLine = {
  startTime: number;
  endTime: number;
  text: string;
};

export type TrackLyrics = {
  id: string;
  trackId: string;
  language: string;
  plainText: string | null;
  timedLines: LyricLine[];
  updatedAt: string;
};

export const getTrackLyrics = (trackId: string) =>
  get<TrackLyrics>(`/api/tracks/${trackId}/lyrics`);

export const saveTrackLyrics = (trackId: string, data: { language: string; plainText?: string; timedLines?: LyricLine[] }) =>
  post<TrackLyrics>(`/api/tracks/${trackId}/lyrics`, data);

export const deleteTrackLyrics = (trackId: string) =>
  del<{ message: string }>(`/api/tracks/${trackId}/lyrics`);

/* ── Activity Feed ── */
export type Activity = {
  id: string;
  userName: string;
  userAvatar: string | null;
  type: string;
  title: string;
  description: string | null;
  targetType: string | null;
  targetSlug: string | null;
  createdAt: string;
};

export const getActivityFeed = (limit = 50) =>
  get<Activity[]>(`/api/activity/feed?limit=${limit}`);

export const recordActivity = (data: {
  user_id: string; user_name: string; user_avatar?: string;
  type: string; title: string; description?: string;
  target_id?: string; target_type?: string; target_slug?: string;
}) => post<Activity>('/api/activity/record', data);

export const deleteAccount = (password: string) =>
  fetch(`${BASE}/api/settings`, {
    method: 'DELETE',
    headers: authHeaders(),
    body: JSON.stringify({ password }),
  }).then(async res => {
    if (!res.ok) {
      const e = await res.json().catch(() => ({})) as Record<string, string>;
      throw new Error(e.error || `HTTP ${res.status}`);
    }
    return res.json() as Promise<{ message: string }>;
  });

/* ── Collaborative Playlists ── */
export type PlaylistCollaborator = {
  id: string;
  userId: string;
  userName: string | null;
  userAvatar: string | null;
  role: string;
  invitedAt: string;
};

export const getCollaborators = (playlistId: string) =>
  get<PlaylistCollaborator[]>(`/api/playlists/${playlistId}/collaborators`);

export const inviteCollaborator = (playlistId: string, userId: string, role: string) =>
  post<PlaylistCollaborator>(`/api/playlists/${playlistId}/collaborators`, { userId, role });

export const updateCollaboratorRole = (playlistId: string, collaboratorId: string, role: string) =>
  put<PlaylistCollaborator>(`/api/playlists/${playlistId}/collaborators/${collaboratorId}`, { role });

export const removeCollaborator = (playlistId: string, collaboratorId: string) =>
  del<{ message: string }>(`/api/playlists/${playlistId}/collaborators/${collaboratorId}`);

/* ── Listening Stats (Wrapped) ── */
export type ListeningStats = {
  totalTracksPlayed: number;
  totalMinutesListened: number;
  uniqueArtists: number;
  uniqueTracks: number;
  listeningDays: number;
  currentStreak: number;
  longestStreak: number;
  topArtist: { name: string; avatarUrl: string; playCount: number; minutesListened: number } | null;
  topTrack: { title: string; artistName: string; playCount: number; durationSeconds: number } | null;
  topGenres: { genre: string; playCount: number; percentage: number }[];
  hourlyDistribution: { hour: number; playCount: number }[];
  monthlyProgress: { month: string; tracksPlayed: number; minutesListened: number }[];
};

export const getListeningStats = (period = 'all') =>
  get<ListeningStats>(`/api/stats?period=${period}`);

/* ── Release Scheduling ── */
export type ScheduledRelease = {
  id: string;
  trackId: string;
  trackTitle: string;
  releaseDate: string;
  notifyFollowers: boolean;
  status: string;
  createdAt: string;
  publishedAt: string | null;
};

export const scheduleRelease = (data: { trackId: string; trackTitle: string; releaseDate: string; notifyFollowers?: boolean }) =>
  post<ScheduledRelease>('/api/releases', data);

export const getScheduledReleases = (status?: string) =>
  get<ScheduledRelease[]>(`/api/releases${status ? `?status=${status}` : ''}`);

export const cancelRelease = (releaseId: string) =>
  del<{ message: string }>(`/api/releases/${releaseId}`);

/* ── Album Management ── */
export type AlbumTrack = {
  trackId: string;
  position: number;
};

export type Album = {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  genre: string | null;
  releaseDate: string | null;
  isPublished: boolean;
  trackCount: number;
  tracks: AlbumTrack[];
  createdAt: string;
  updatedAt: string;
};

export const getMyAlbums = () =>
  get<Album[]>('/api/albums');

export const getAlbum = (albumId: string) =>
  get<Album>(`/api/albums/${albumId}`);

export const createAlbum = (data: { title: string; description?: string; genre?: string; coverUrl?: string; releaseDate?: string }) =>
  post<Album>('/api/albums', data);

export const updateAlbum = (albumId: string, data: { title?: string; description?: string; genre?: string; coverUrl?: string; releaseDate?: string }) =>
  put<Album>(`/api/albums/${albumId}`, data);

export const deleteAlbum = (albumId: string) =>
  del<{ message: string }>(`/api/albums/${albumId}`);

export const addTrackToAlbum = (albumId: string, trackId: string) =>
  post<{ message: string }>(`/api/albums/${albumId}/tracks`, { trackId });

export const removeTrackFromAlbum = (albumId: string, trackId: string) =>
  del<{ message: string }>(`/api/albums/${albumId}/tracks/${trackId}`);

/* ── Enhanced Artist Analytics ── */
export type ArtistAnalytics = {
  demographics: {
    totalListeners: number;
    returningListeners: number;
    newListeners: number;
    retentionRate: number;
  } | null;
  geography: {
    topCountry: string;
    topCity: string;
    countries: { country: string; listeners: number; percentage: number }[];
  } | null;
  peakHours: { hour: number; plays: number; percentage: number }[];
  retentionCurve: { second: number; retentionPercentage: number }[];
  skipRates: { trackTitle: string; completionRate: number; skipRate: number }[];
  topCities: { city: string; listeners: number; percentage: number }[];
  retention: { day7: number; day30: number; day90: number } | null;
};

export const getArtistAnalytics = (period = 'all') =>
  get<ArtistAnalytics>(`/api/analytics?period=${period}`);

/* ── Content Moderation ── */
export type ContentFlag = {
  id: string;
  reporterId: string;
  reporterName: string | null;
  targetId: string;
  targetType: string;
  targetTitle: string | null;
  flagType: string;
  reason: string | null;
  status: string;
  reviewedBy: string | null;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export const flagContent = (data: { targetId: string; targetType: string; targetTitle?: string; flagType: string; reason?: string }) =>
  post<ContentFlag>('/api/moderation/flag', data);

export const getFlaggedContent = (status?: string, limit = 50) =>
  get<ContentFlag[]>(`/api/moderation/flags?limit=${limit}${status ? `&status=${status}` : ''}`);

export const resolveFlag = (flagId: string, status: string, note?: string) =>
  put<ContentFlag>(`/api/moderation/flags/${flagId}/resolve`, { status, note });

export const getModerationStats = () =>
  get<{ pending: number; resolved: number; dismissed: number }>('/api/moderation/stats');
