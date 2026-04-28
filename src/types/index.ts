export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type Platform = 'telegram' | 'vk' | 'instagram' | 'dzen';
export type ScheduleStatus = 'pending' | 'published' | 'failed' | 'cancelled';

export interface Post {
  id: number;
  title?: string;
  content: string;
  status: PostStatus;
  source_url?: string;
  source_title?: string;
  image_urls?: string[];
  created_at: string;
  updated_at: string;
  scheduled?: ScheduledPost[];
}

export interface ScheduledPost {
  id: number;
  post_id: number;
  platform: Platform;
  scheduled_at: string;
  published_at?: string;
  status: ScheduleStatus;
  error_message?: string;
  platform_post_id?: string;
  created_at: string;
}

export interface SocialAccount {
  id: number;
  platform: Platform;
  is_connected: boolean;
  account_name?: string;
  extra_data?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface NewsItem {
  id: number;
  source_id?: number;
  title: string;
  summary?: string;
  url?: string;
  published_at?: string;
  is_trending: boolean;
  trend_score: number;
  fetched_at: string;
  source_title?: string;
}

export interface MediaFile {
  id: number;
  post_id: number;
  filename: string;
  cdn_url: string;
  file_type: string;
  sort_order: number;
  created_at: string;
}

export interface DashboardStats {
  total_posts: number;
  scheduled_posts: number;
  published_today: number;
  connected_platforms: number;
}
