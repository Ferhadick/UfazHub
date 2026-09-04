export type ResourceType = "course" | "article" | "video" | "docs" | "github_repo" | "website" | "book";
export type Difficulty = "beginner" | "intermediate" | "advanced";

export type UserRole = "user" | "verified_ufazian" | "admin";
export type UserStatus = "active" | "muted" | "banned";
export type QuestionStatus = "open" | "answered" | "closed";

export type UserPublic = {
  id: string;
  email: string;
  username: string;
  name: string;
  bio: string | null;
  faculty: string | null;
  graduation_year?: number | null;
  current_role?: string | null;
  company_or_institution?: string | null;
  degree_level?: string | null;
  is_verified?: boolean;
  avatar_url: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  telegram_url?: string | null;
  youtube_url?: string | null;
  website_url?: string | null;
  reputation_score: number;
  role: UserRole;
  status: UserStatus;
  muted_until: string | null;
  warning_count: number;
  created_at: string;
};

export type AnswerRead = {
  id: string;
  question_id: string;
  author_id: string;
  author: UserPublic;
  body: string;
  linked_resources: Array<{ title?: string; url?: string; id?: string }>;
  upvotes: number;
  downvotes: number;
  is_pinned: boolean;
  is_helpful: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
};

export type QuestionRead = {
  id: string;
  author_id: string;
  author: UserPublic;
  title: string;
  body: string | null;
  topic_tag: string;
  linked_resource_id: string | null;
  linked_resource: ResourceRead | null;
  status: QuestionStatus;
  upvotes: number;
  downvotes: number;
  is_hidden: boolean;
  is_pinned_admin: boolean;
  answers_count: number;
  has_verified_answer: boolean;
  created_at: string;
  updated_at: string;
};

export type QuestionDetail = QuestionRead & {
  answers: AnswerRead[];
};

export type AdminQACluster = {
  keyword: string;
  count: number;
  questions: QuestionRead[];
};

export type AdminQAQueueResponse = {
  total_unanswered: number;
  total_questions: number;
  clusters: AdminQACluster[];
  recent_questions: QuestionRead[];
};

export type TagRead = {
  id: string;
  name: string;
  slug: string;
};

export type ResourceLinkRead = {
  id: string;
  url: string;
  label: string | null;
  position: number;
};

export type ResourceAttachmentRead = {
  id: string;
  url: string;
  filename: string;
  content_type: string | null;
  size_bytes: number | null;
  position: number;
};

export type ResourceRead = {
  id: string;
  title: string;
  description: string;
  url: string;
  type: ResourceType;
  category: string;
  difficulty: Difficulty;
  use_case: string | null;
  time_commitment: string | null;
  prerequisites: string | null;
  best_part: string | null;
  warning: string | null;
  student_note: string | null;
  upvotes: number;
  downvotes: number;
  is_pending_review: boolean;
  created_at: string;
  updated_at: string;
  author: UserPublic;
  tags: TagRead[];
  links: ResourceLinkRead[];
  attachments: ResourceAttachmentRead[];
};

export type ArticleRead = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image_url: string | null;
  reading_time: number;
  status: "draft" | "published";
  upvotes: number;
  downvotes: number;
  is_pending_review?: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  author: UserPublic;
  tags: TagRead[];
};

export type CollectionRead = {
  id: string;
  title: string;
  description: string;
  upvotes: number;
  downvotes: number;
  is_pending_review?: boolean;
  created_at: string;
  updated_at: string;
  author: UserPublic;
  tags: TagRead[];
  items: Array<{ position: number; resource: ResourceRead }>;
};

export type FeedItem = {
  id: string;
  kind: string;
  title: string;
  description: string;
  href: string;
  author_name: string;
  author_username: string;
  tags: string[];
  score: number;
  meta: string;
  created_at: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

export type TokenResponse = {
  access_token: string;
  token_type: "bearer";
  user: UserPublic;
};

export type ContentKind = "resource" | "article" | "collection";

export type ModerationEventRead = {
  id: string;
  user_id: string;
  actor_id: string;
  event_type: string;
  reason: string;
  duration_minutes: number | null;
  expires_at: string | null;
  created_at: string;
  actor_username: string | null;
};

export type AdminActionEventRead = {
  id: string;
  actor_type: "guest" | "user";
  event_type: string;
  user_id: string | null;
  username: string | null;
  guest_session_id: string | null;
  ip_hash: string | null;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ContentCounts = {
  resources: number;
  articles: number;
  collections: number;
};

export type AdminOverview = {
  users_total: number;
  users_active: number;
  users_muted: number;
  users_banned: number;
  admins: number;
  content_counts: ContentCounts;
  hidden_counts: ContentCounts;
  events_last_7_days: Record<string, number>;
  recent_moderation_events: ModerationEventRead[];
  recent_blocked_guest_actions: AdminActionEventRead[];
};

export type AdminUserDetail = {
  user: UserPublic;
  moderation_history: ModerationEventRead[];
  content_counts: ContentCounts;
  recent_action_events: AdminActionEventRead[];
};

export type AdminContentItem = {
  kind: ContentKind;
  id: string;
  title: string;
  slug: string | null;
  is_hidden: boolean;
  is_pending_review: boolean;
  hidden_reason: string | null;
  author_id: string;
  author_username: string;
  created_at: string;
};

export type AdminResourceRead = ResourceRead & {
  is_hidden: boolean;
  is_pending_review: boolean;
  hidden_reason: string | null;
  hidden_at: string | null;
};

export type AdminArticleRead = ArticleRead & {
  is_hidden: boolean;
  is_pending_review: boolean;
  hidden_reason: string | null;
  hidden_at: string | null;
};

export type AdminCollectionRead = CollectionRead & {
  is_hidden: boolean;
  is_pending_review: boolean;
  hidden_reason: string | null;
  hidden_at: string | null;
};
