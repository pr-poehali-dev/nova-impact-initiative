import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNews, fetchTrends } from '@/lib/api';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import type { NewsItem } from '@/types';

export default function Trends() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<NewsItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: () => getNews(30),
  });

  const fetchMutation = useMutation({
    mutationFn: fetchTrends,
    onSuccess: (res) => {
      toast.success(`Загружено ${res.fetched} новых новостей`);
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
    onError: () => toast.error('Ошибка загрузки новостей'),
  });

  const items = data?.items || [];
  const trending = items.filter((i) => i.is_trending);
  const regular = items.filter((i) => !i.is_trending);

  const handleCreatePost = (item: NewsItem) => {
    navigate('/create', { state: { news: item } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm mt-1">
            Актуальные новости и тренды из мира ИИ
          </p>
        </div>
        <Button
          onClick={() => fetchMutation.mutate()}
          disabled={fetchMutation.isPending}
          className="gap-2"
        >
          <Icon name="RefreshCw" size={16} className={fetchMutation.isPending ? 'animate-spin' : ''} />
          {fetchMutation.isPending ? 'Загружаю...' : 'Обновить тренды'}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Icon name="Loader2" size={32} className="animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Trending */}
          {trending.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Icon name="Flame" size={14} className="text-orange-400" />
                Горячие тренды
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trending.map((item) => (
                  <NewsCard key={item.id} item={item} onUse={handleCreatePost} hot />
                ))}
              </div>
            </div>
          )}

          {/* Regular news */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <Icon name="Newspaper" size={14} />
              Все новости
            </h2>
            {regular.length === 0 && trending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gradient-card rounded-xl">
                <Icon name="Rss" size={48} className="mb-3 opacity-30" />
                <p className="font-medium">Новостей пока нет</p>
                <p className="text-sm mt-1">Нажмите "Обновить тренды" чтобы загрузить</p>
              </div>
            ) : (
              <div className="space-y-3">
                {regular.map((item) => (
                  <NewsCard key={item.id} item={item} onUse={handleCreatePost} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function NewsCard({
  item,
  onUse,
  hot,
}: {
  item: NewsItem;
  onUse: (item: NewsItem) => void;
  hot?: boolean;
}) {
  return (
    <div
      className={`gradient-card rounded-xl p-4 flex flex-col gap-3 ${
        hot ? 'border border-orange-500/30' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        {hot && (
          <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Icon name="Flame" size={10} className="text-orange-400" />
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">{item.title}</p>
          {item.summary && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.summary}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {item.source_title && (
            <span className="text-xs text-muted-foreground">{item.source_title}</span>
          )}
          {item.published_at && (
            <span className="text-xs text-muted-foreground">
              {format(new Date(item.published_at), 'd MMM', { locale: ru })}
            </span>
          )}
          {item.trend_score > 0 && (
            <span className="text-xs text-orange-400 flex items-center gap-1">
              <Icon name="TrendingUp" size={10} />
              {item.trend_score}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name="ExternalLink" size={12} />
            </a>
          )}
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onUse(item)}>
            <Icon name="PenSquare" size={12} />
            Написать пост
          </Button>
        </div>
      </div>
    </div>
  );
}
