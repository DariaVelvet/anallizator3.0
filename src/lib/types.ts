export interface Post {
  id: string;
  account: string;
  subreddit: string;
  title: string;
  score: number;
  comments: number;
  created_utc: number;
  url: string;
}

export type Team = 'velvet' | 'gb';

export interface Model {
  name: string;
  avatar: string;
  accounts: string[];
  team?: Team;
}

export interface PostWithMeta extends Post {
  modelName: string;
  modelAvatar: string;
  successScore: number;
}

export interface SubredditStats {
  subreddit: string;
  totalPosts: number;
  avgUpvotes: number;
  maxUpvotes: number;
  avgComments: number;
  maxComments: number;
  successFormula: number;
  topPosts: PostWithMeta[];
}

export type SortKey = 'subreddit' | 'totalPosts' | 'avgUpvotes' | 'maxUpvotes' | 'avgComments' | 'maxComments' | 'successFormula';
export type SortDir = 'asc' | 'desc';
export type DatePreset = 'week' | 'month' | '3months' | 'all' | 'custom';

export interface SubredditModelBreakdownEntry {
  modelName: string;
  avatar: string;
  count: number;
}
