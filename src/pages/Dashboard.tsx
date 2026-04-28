import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getPosts, getSchedule } from '@/lib/api';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Platform } from '@/types';

const PLATFORM_LABELS: Record<Platform, string> = {
  telegram: 'Telegram',
  vk: 'ВКонтакте',
  instagram: 'Instagram',
  dzen: 'Яндекс Дзен',
};

const PLATFORM_COLORS: Record<Platform, string> = {
  telegram: 'text-blue-400',
  vk: 'text-blue-500',
  instagram: 'text-pink-400',
  dzen: 'text-orange-400',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  scheduled: 'Запланирован',
  published: 'Опубликован',
  failed: 'Ошибка',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-500/20 text-blue-400',
  published: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
};

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: getDashboardStats,
    refetchInterval: 30000,
  });

  const { data: postsData } = useQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
  });

  const { data: scheduleData } = useQuery({
    queryKey: ['schedule'],
    queryFn: () => getSchedule(),
    refetchInterval: 30000,
  });

  const recentPosts = postsData?.posts?.slice(0, 5) || [];
  const upcomingSchedule = scheduleData?.items
    ?.filter((s) => s.status === 'pending')
    ?.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    ?.slice(0, 5) || [];

  const statCards = [
    {
      label: 'Всего постов',
      value: stats?.total_posts ?? '—',
      icon: 'FileText',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Запланировано',
      value: stats?.scheduled_posts ?? '—',
      icon: 'Clock',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
    {
      label: 'Опубликовано сегодня',
      value: stats?.published_today ?? '—',
      icon: 'CheckCircle',
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Платформ подключено',
      value: stats?.connected_platforms ?? '—',
      icon: 'Globe',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="gradient-card rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                <Icon name={card.icon} size={20} className={card.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent posts */}
        <div className="gradient-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Последние посты</h2>
            <Link to="/posts" className="text-sm text-primary hover:underline">
              Все посты
            </Link>
          </div>
          {recentPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Icon name="FileText" size={32} className="mb-2 opacity-40" />
              <p className="text-sm">Постов пока нет</p>
              <Link to="/create" className="text-sm text-primary mt-2 hover:underline">
                Создать первый пост
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {post.title || post.content.slice(0, 60)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(post.created_at), 'd MMM, HH:mm', { locale: ru })}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[post.status]}`}>
                    {STATUS_LABELS[post.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming schedule */}
        <div className="gradient-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Предстоящие публикации</h2>
            <Link to="/calendar" className="text-sm text-primary hover:underline">
              Календарь
            </Link>
          </div>
          {upcomingSchedule.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Icon name="CalendarDays" size={32} className="mb-2 opacity-40" />
              <p className="text-sm">Нет запланированных постов</p>
              <Link to="/calendar" className="text-sm text-primary mt-2 hover:underline">
                Запланировать пост
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSchedule.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0`}>
                    <Icon name="Send" size={14} className={PLATFORM_COLORS[item.platform]} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {PLATFORM_LABELS[item.platform]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(item.scheduled_at), 'd MMM, HH:mm', { locale: ru })}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                    Ожидает
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="gradient-card rounded-xl p-5">
        <h2 className="font-semibold text-foreground mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Найти тренды', icon: 'TrendingUp', path: '/trends', color: 'text-orange-400' },
            { label: 'Создать пост', icon: 'PenSquare', path: '/create', color: 'text-blue-400' },
            { label: 'Запланировать', icon: 'CalendarDays', path: '/calendar', color: 'text-green-400' },
            { label: 'Настройки API', icon: 'Settings', path: '/settings', color: 'text-purple-400' },
          ].map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-center"
            >
              <Icon name={action.icon} size={24} className={action.color} />
              <span className="text-sm text-foreground">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
