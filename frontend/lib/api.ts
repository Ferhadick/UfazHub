import type { ArticleRead, CollectionRead, FeedItem, PaginatedResponse, ResourceRead, TagRead, TokenResponse, UserPublic } from "@/types/api";

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
