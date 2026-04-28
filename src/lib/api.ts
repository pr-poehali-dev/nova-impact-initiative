import func2url from '../../func2url.json';

const getUrl = (fn: string) => (func2url as Record<string, string>)[fn] || '';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
  return data;
}

// Posts
export const getPosts = () =>
  request<{ posts: import('@/types').Post[] }>(getUrl('posts') + '?action=list');

export const getPost = (id: number) =>
  request<{ post: import('@/types').Post }>(getUrl('posts') + `?action=get&id=${id}`);

export const createPost = (data: Partial<import('@/types').Post>) =>
  request<{ post: import('@/types').Post }>(getUrl('posts'), {
    method: 'POST',
    body: JSON.stringify({ action: 'create', ...data }),
  });

export const updatePost = (id: number, data: Partial<import('@/types').Post>) =>
  request<{ post: import('@/types').Post }>(getUrl('posts'), {
    method: 'POST',
    body: JSON.stringify({ action: 'update', id, ...data }),
  });

export const deletePost = (id: number) =>
  request<{ success: boolean }>(getUrl('posts'), {
    method: 'POST',
    body: JSON.stringify({ action: 'delete', id }),
  });

// News & Trends
export const getNews = (limit = 20) =>
  request<{ items: import('@/types').NewsItem[] }>(getUrl('news') + `?limit=${limit}`);

export const fetchTrends = () =>
  request<{ items: import('@/types').NewsItem[]; fetched: number }>(getUrl('news'), {
    method: 'POST',
    body: JSON.stringify({ action: 'fetch' }),
  });

// Generate post content
export const generatePost = (data: { news_id?: number; topic?: string; platform?: string }) =>
  request<{ content: string; title: string }>(getUrl('generate-post'), {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Schedule
export const getSchedule = (month?: string) =>
  request<{ items: import('@/types').ScheduledPost[] }>(
    getUrl('scheduler') + (month ? `?month=${month}` : '')
  );

export const schedulePost = (data: {
  post_id: number;
  platforms: import('@/types').Platform[];
  scheduled_at: string;
}) =>
  request<{ items: import('@/types').ScheduledPost[] }>(getUrl('scheduler'), {
    method: 'POST',
    body: JSON.stringify({ action: 'schedule', ...data }),
  });

export const cancelSchedule = (id: number) =>
  request<{ success: boolean }>(getUrl('scheduler'), {
    method: 'POST',
    body: JSON.stringify({ action: 'cancel', id }),
  });

// Social accounts
export const getSocialAccounts = () =>
  request<{ accounts: import('@/types').SocialAccount[] }>(getUrl('social-accounts'));

export const updateSocialAccount = (platform: string, data: Record<string, string | boolean>) =>
  request<{ account: import('@/types').SocialAccount }>(getUrl('social-accounts'), {
    method: 'POST',
    body: JSON.stringify({ platform, ...data }),
  });

// Publish now
export const publishPost = (data: {
  post_id: number;
  platforms: import('@/types').Platform[];
}) =>
  request<{ results: Record<string, boolean> }>(getUrl('publish'), {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Upload media
export const uploadMedia = (post_id: number, file_base64: string, filename: string) =>
  request<{ file: import('@/types').MediaFile }>(getUrl('media'), {
    method: 'POST',
    body: JSON.stringify({ action: 'upload', post_id, file_base64, filename }),
  });

export const getMedia = (post_id: number) =>
  request<{ files: import('@/types').MediaFile[] }>(getUrl('media') + `?post_id=${post_id}`);

// Dashboard stats
export const getDashboardStats = () =>
  request<import('@/types').DashboardStats>(getUrl('posts') + '?action=stats');
