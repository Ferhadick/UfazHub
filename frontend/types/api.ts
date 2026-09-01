export type ResourceType = "course" | "article" | "video" | "docs" | "github_repo" | "website" | "book";
export type Difficulty = "beginner" | "intermediate" | "advanced";

export type UserPublic = {
  id: string;
  email: string;
  username: string;
  name: string;
  bio: string | null;
  faculty: string | null;
  avatar_url: string | null;
  reputation_score: number;
  created_at: string;
};

export type TagRead = {
  id: string;
  name: string;
  slug: string;
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
  created_at: string;
  updated_at: string;
  author: UserPublic;
  tags: TagRead[];
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
