import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPosts, deletePost } from '@/lib/api';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import type { PostStatus, Platform } from '@/types';

const STATUS_LABELS: Record<PostStatus, string> = {
  draft: 'Черновик',
  scheduled: 'Запланирован',
  published: 'Опубликован',
  failed: 'Ошибка',
};

const STATUS_COLORS: Record<PostStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-500/20 text-blue-400',
  published: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
};

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'draft', label: 'Черновики' },
  { value: 'scheduled', label: 'Запланированные' },
  { value: 'published', label: 'Опубликованные' },
  { value: 'failed', label: 'С ошибкой' },
];

export default function Posts() {
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Пост удалён');
    },
    onError: () => toast.error('Ошибка удаления'),
  });

  const posts = data?.posts || [];
  const filtered = filter === 'all' ? posts : posts.filter((p) => p.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === opt.value
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <Link to="/create">
          <Button className="gap-2">
            <Icon name="Plus" size={16} />
            Новый пост
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Icon name="Loader2" size={32} className="animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gradient-card rounded-xl text-muted-foreground">
          <Icon name="FileText" size={48} className="mb-3 opacity-30" />
          <p className="font-medium">Постов нет</p>
          <Link to="/create" className="text-sm text-primary mt-2 hover:underline">
            Создать первый пост
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <div key={post.id} className="gradient-card rounded-xl p-4 flex items-start gap-4">
              {post.image_urls && post.image_urls.length > 0 && (
                <img
                  src={post.image_urls[0]}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {post.title || post.content.slice(0, 80)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {post.content.slice(0, 120)}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      STATUS_COLORS[post.status]
                    }`}
                  >
                    {STATUS_LABELS[post.status]}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Icon name="Clock" size={11} />
                    {format(new Date(post.created_at), 'd MMM yyyy', { locale: ru })}
                  </span>
                  {post.source_title && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Icon name="Link" size={11} />
                      {post.source_title}
                    </span>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    <Link to="/calendar" state={{ post_id: post.id }}>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <Icon name="CalendarDays" size={12} />
                        Запланировать
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm('Удалить пост?')) deleteMutation.mutate(post.id);
                      }}
                    >
                      <Icon name="Trash2" size={12} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
