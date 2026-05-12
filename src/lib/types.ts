export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
};

export type Plate = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string;
  ai_rating: number | null;
  ai_comment: string | null;
  avg_user_rating: number | null;
  rating_count: number;
  created_at: string;
  profiles?: Profile;
};

export type Rating = {
  id: string;
  plate_id: string;
  user_id: string;
  score: number;
  comment: string | null;
  created_at: string;
  profiles?: Profile;
};

export type Comment = {
  id: string;
  plate_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  profiles?: Profile;
  replies?: Comment[];
};
