export type User = {
  id: string;
  email: string;
  username: string;
  created_at: string;
};

export type ShareVisibility = "public" | "private";

export type Prompt = {
  id: string;
  user_id: string;
  collection_id: string | null;
  title: string;
  content: string;
  tags: string[];
  is_shared: boolean;
  share_id: string | null;
  share_visibility: ShareVisibility | null;
  share_description: string | null;
  is_favorite: boolean;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Collection = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_shared: boolean;
  share_id: string | null;
  share_visibility: ShareVisibility | null;
  created_at: string;
  updated_at: string;
};
