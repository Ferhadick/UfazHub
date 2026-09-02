import type {
  AdminActionEventRead,
  AdminArticleRead,
  AdminCollectionRead,
  AdminContentItem,
  AdminOverview,
  AdminResourceRead,
  AdminUserDetail,
  ArticleRead,
  CollectionRead,
  ContentKind,
  FeedItem,
  PaginatedResponse,
  ResourceRead,
  TagRead,
  TokenResponse,
  UserPublic,
  UserRole,
  UserStatus
} from "@/types/api";

const API_BASE =
  typeof window === "undefined"
    ? (process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1")
    : (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1");

type FetchOptions = RequestInit & {
  token?: string;
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
    cache: options.cache ?? "no-store"
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string; code?: string } | null;
    throw new ApiClientError(body?.detail ?? "Request failed", response.status, body?.code ?? "REQUEST_FAILED");
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function listResources(limit = 12): Promise<PaginatedResponse<ResourceRead>> {
  return request<PaginatedResponse<ResourceRead>>(`/resources?limit=${limit}`);
}

export function listFeed(limit = 12): Promise<FeedItem[]> {
  return request<FeedItem[]>(`/feed?limit=${limit}`);
}

export function searchArchive(query: string): Promise<FeedItem[]> {
  return request<FeedItem[]>(`/search?q=${encodeURIComponent(query)}&limit=8`);
}

export function listArticles(limit = 20): Promise<PaginatedResponse<ArticleRead>> {
  return request<PaginatedResponse<ArticleRead>>(`/articles?limit=${limit}`);
}

export function getArticle(slug: string): Promise<ArticleRead> {
  return request<ArticleRead>(`/articles/${slug}`);
}

export function listCollections(limit = 20): Promise<PaginatedResponse<CollectionRead>> {
  return request<PaginatedResponse<CollectionRead>>(`/collections?limit=${limit}`);
}

export function getCollection(id: string): Promise<CollectionRead> {
  return request<CollectionRead>(`/collections/${id}`);
}

export function listPeople(limit = 20): Promise<PaginatedResponse<UserPublic>> {
  return request<PaginatedResponse<UserPublic>>(`/people?limit=${limit}`);
}

export function getPublicProfile(username: string): Promise<UserPublic> {
  return request<UserPublic>(`/users/${username}`);
}

export async function getProfileArchive(username: string): Promise<{
  resources: ResourceRead[];
  articles: ArticleRead[];
  collections: CollectionRead[];
}> {
  const [resources, articles, collections] = await Promise.all([
    listResources(100).catch(() => ({ items: [], total: 0, limit: 100, offset: 0 })),
    listArticles(100).catch(() => ({ items: [], total: 0, limit: 100, offset: 0 })),
    listCollections(100).catch(() => ({ items: [], total: 0, limit: 100, offset: 0 }))
  ]);

  return {
    resources: resources.items.filter((item) => item.author.username === username),
    articles: articles.items.filter((item) => item.author.username === username),
    collections: collections.items.filter((item) => item.author.username === username)
  };
}

export function getMe(token: string): Promise<UserPublic> {
  return request<UserPublic>("/users/me", { token });
}

export function updateMe(
  token: string,
  payload: { name?: string; bio?: string; faculty?: string; avatar_url?: string }
): Promise<UserPublic> {
  return request<UserPublic>("/users/me", { method: "PATCH", token, body: JSON.stringify(payload) });
}

export function refreshToken(): Promise<TokenResponse> {
  return request<TokenResponse>("/auth/refresh", { method: "POST" });
}

export function logoutUser(): Promise<void> {
  return request<void>("/auth/logout", { method: "POST" });
}

export function listTags(limit = 12): Promise<TagRead[]> {
  return request<TagRead[]>(`/tags?limit=${limit}`);
}

export function continueAsGuest(): Promise<{ id: string; actor_type: "guest" }> {
  return request<{ id: string; actor_type: "guest" }>("/auth/guest", { method: "POST" });
}

export function registerUser(payload: {
  email: string;
  username: string;
  password: string;
  name: string;
  faculty?: string;
}): Promise<TokenResponse> {
  return request<TokenResponse>("/auth/register", { method: "POST", body: JSON.stringify(payload) });
}

export function loginUser(payload: { email: string; password: string }): Promise<TokenResponse> {
  return request<TokenResponse>("/auth/login", { method: "POST", body: JSON.stringify(payload) });
}

export function createResource(
  token: string,
  payload: {
    title: string;
    description: string;
    url: string;
    type: string;
    category: string;
    difficulty: string;
    use_case?: string;
    time_commitment?: string;
    prerequisites?: string;
    best_part?: string;
    warning?: string;
    student_note?: string;
    tags: string[];
  }
): Promise<ResourceRead> {
  return request<ResourceRead>("/resources", { method: "POST", token, body: JSON.stringify(payload) });
}

export function createArticle(
  token: string,
  payload: {
    title: string;
    content: string;
    excerpt?: string;
    cover_image_url?: string;
    status: "draft" | "published";
    tags: string[];
  }
): Promise<ArticleRead> {
  return request<ArticleRead>("/articles", { method: "POST", token, body: JSON.stringify(payload) });
}

export function createCollection(
  token: string,
  payload: {
    title: string;
    description: string;
    resource_ids: string[];
    tags: string[];
  }
): Promise<CollectionRead> {
  return request<CollectionRead>("/collections", { method: "POST", token, body: JSON.stringify(payload) });
}

export function trackBlockedSubmit(target: "resource" | "article" | "collection"): Promise<void> {
  return request<void>(`/${target}s/blocked-submit`, { method: "POST" });
}

function queryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

export function adminOverview(token: string): Promise<AdminOverview> {
  return request<AdminOverview>("/admin/overview", { token });
}

export function adminListUsers(
  token: string,
  params: { q?: string; status?: UserStatus | ""; role?: UserRole | ""; limit?: number; offset?: number } = {}
): Promise<PaginatedResponse<UserPublic>> {
  return request<PaginatedResponse<UserPublic>>(`/admin/users${queryString(params)}`, { token });
}

export function adminCreateUser(
  token: string,
  payload: { email: string; username: string; password: string; name: string; faculty?: string }
): Promise<UserPublic> {
  return request<UserPublic>("/admin/users", { method: "POST", token, body: JSON.stringify(payload) });
}

export function adminGetUser(token: string, id: string): Promise<AdminUserDetail> {
  return request<AdminUserDetail>(`/admin/users/${id}`, { token });
}

export function adminUpdateUser(
  token: string,
  id: string,
  payload: Partial<{ name: string; bio: string; faculty: string; username: string; email: string; role: UserRole; reason: string }>
): Promise<UserPublic> {
  return request<UserPublic>(`/admin/users/${id}`, { method: "PATCH", token, body: JSON.stringify(payload) });
}

export function adminWarnUser(token: string, id: string, reason: string): Promise<UserPublic> {
  return request<UserPublic>(`/admin/users/${id}/warn`, { method: "POST", token, body: JSON.stringify({ reason }) });
}

export function adminMuteUser(token: string, id: string, reason: string, duration_minutes: number | null): Promise<UserPublic> {
  return request<UserPublic>(`/admin/users/${id}/mute`, {
    method: "POST",
    token,
    body: JSON.stringify({ reason, duration_minutes })
  });
}

export function adminUnmuteUser(token: string, id: string, reason: string): Promise<UserPublic> {
  return request<UserPublic>(`/admin/users/${id}/unmute`, { method: "POST", token, body: JSON.stringify({ reason }) });
}

export function adminBanUser(token: string, id: string, reason: string): Promise<UserPublic> {
  return request<UserPublic>(`/admin/users/${id}/ban`, { method: "POST", token, body: JSON.stringify({ reason }) });
}

export function adminUnbanUser(token: string, id: string, reason: string): Promise<UserPublic> {
  return request<UserPublic>(`/admin/users/${id}/unban`, { method: "POST", token, body: JSON.stringify({ reason }) });
}

export function adminListContent(
  token: string,
  params: { kind: ContentKind; q?: string; hidden?: boolean; pending_review?: boolean; author_id?: string; limit?: number; offset?: number }
): Promise<PaginatedResponse<AdminContentItem>> {
  return request<PaginatedResponse<AdminContentItem>>(`/admin/content${queryString(params)}`, { token });
}

export function adminGetContent(
  token: string,
  kind: ContentKind,
  id: string
): Promise<AdminResourceRead | AdminArticleRead | AdminCollectionRead> {
  return request(`/admin/content/${kind}/${id}`, { token });
}

export function adminUpdateContent(
  token: string,
  kind: ContentKind,
  id: string,
  payload: Record<string, unknown>
): Promise<AdminResourceRead | AdminArticleRead | AdminCollectionRead> {
  return request(`/admin/content/${kind}/${id}`, { method: "PATCH", token, body: JSON.stringify(payload) });
}

export function adminHideContent(token: string, kind: ContentKind, id: string, reason: string) {
  return request(`/admin/content/${kind}/${id}/hide`, { method: "POST", token, body: JSON.stringify({ reason }) });
}

export function adminUnhideContent(token: string, kind: ContentKind, id: string, reason: string) {
  return request(`/admin/content/${kind}/${id}/unhide`, { method: "POST", token, body: JSON.stringify({ reason }) });
}

export function adminDeleteContent(token: string, kind: ContentKind, id: string): Promise<void> {
  return request<void>(`/admin/content/${kind}/${id}`, { method: "DELETE", token });
}

export function adminApproveResource(token: string, id: string): Promise<AdminResourceRead> {
  return request<AdminResourceRead>(`/admin/content/resource/${id}/approve`, { method: "POST", token });
}

export function adminListEvents(
  token: string,
  params: {
    event_type?: string;
    actor_type?: "guest" | "user" | "";
    user_id?: string;
    guest_session_id?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<PaginatedResponse<AdminActionEventRead>> {
  return request<PaginatedResponse<AdminActionEventRead>>(`/admin/events${queryString(params)}`, { token });
}
