import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { getPosts, getSchedule, schedulePost, cancelSchedule } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Platform, ScheduledPost } from '@/types';

const PLATFORMS: { id: Platform; label: string; icon: string; color: string }[] = [
  { id: 'telegram', label: 'Telegram', icon: 'Send', color: 'text-blue-400' },
  { id: 'vk', label: 'ВКонтакте', icon: 'Users', color: 'text-blue-500' },
  { id: 'instagram', label: 'Instagram', icon: 'Camera', color: 'text-pink-400' },
  { id: 'dzen', label: 'Яндекс Дзен', icon: 'BookOpen', color: 'text-orange-400' },
];

const PLATFORM_COLORS: Record<Platform, string> = {
  telegram: 'bg-blue-500',
  vk: 'bg-blue-600',
  instagram: 'bg-pink-500',
  dzen: 'bg-orange-500',
};

export default function Calendar() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const preselectedPostId = location.state?.post_id as number | undefined;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedPost, setSelectedPost] = useState<string>(
    preselectedPostId ? String(preselectedPostId) : ''
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['telegram']);
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const monthKey = format(currentMonth, 'yyyy-MM');

  const { data: scheduleData } = useQuery({
    queryKey: ['schedule', monthKey],
    queryFn: () => getSchedule(monthKey),
    refetchInterval: 30000,
  });

  const { data: postsData } = useQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
  });

  const scheduleMutation = useMutation({
    mutationFn: schedulePost,
    onSuccess: () => {
      toast.success('Пост запланирован');
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setShowScheduleForm(false);
    },
    onError: () => toast.error('Ошибка планирования'),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSchedule,
    onSuccess: () => {
      toast.success('Публикация отменена');
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
    onError: () => toast.error('Ошибка отмены'),
  });

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const scheduleItems = scheduleData?.items || [];
  const posts = postsData?.posts || [];
  const draftPosts = posts.filter((p) => p.status === 'draft' || p.status === 'scheduled');

  const getItemsForDay = (day: Date): ScheduledPost[] =>
    scheduleItems.filter((item) => isSameDay(new Date(item.scheduled_at), day));

  const selectedDayItems = selectedDay ? getItemsForDay(selectedDay) : [];

  const handleSchedule = () => {
    if (!selectedDay || !selectedPost || selectedPlatforms.length === 0) return;
    const [h, m] = selectedTime.split(':');
    const scheduledAt = new Date(selectedDay);
    scheduledAt.setHours(Number(h), Number(m), 0, 0);

    scheduleMutation.mutate({
      post_id: Number(selectedPost),
      platforms: selectedPlatforms,
      scheduled_at: scheduledAt.toISOString(),
    });
  };

  const togglePlatform = (p: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const firstDayOfWeek = startOfMonth(currentMonth).getDay();
  const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2 gradient-card rounded-xl p-5">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <Icon name="ChevronLeft" size={18} />
          </button>
          <h2 className="font-semibold text-foreground capitalize">
            {format(currentMonth, 'LLLL yyyy', { locale: ru })}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <Icon name="ChevronRight" size={18} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
            <div key={d} className="text-center text-xs text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: paddingDays }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const items = getItemsForDay(day);
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={day.toISOString()}
                onClick={() => {
                  setSelectedDay(day);
                  setShowScheduleForm(true);
                }}
                className={`relative aspect-square flex flex-col items-center justify-start p-1 rounded-lg text-sm transition-colors ${
                  isSelected
                    ? 'bg-primary text-white'
                    : isToday
                    ? 'bg-primary/20 text-primary'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <span className="text-xs">{format(day, 'd')}</span>
                {items.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                    {items.slice(0, 3).map((item) => (
                      <span
                        key={item.id}
                        className={`w-1.5 h-1.5 rounded-full ${PLATFORM_COLORS[item.platform]}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Schedule form */}
        {showScheduleForm && selectedDay && (
          <div className="gradient-card rounded-xl p-4 space-y-4 border border-primary/30">
            <h3 className="font-semibold text-foreground text-sm">
              Запланировать на {format(selectedDay, 'd MMMM', { locale: ru })}
            </h3>

            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Пост</p>
              <Select value={selectedPost} onValueChange={setSelectedPost}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Выберите пост..." />
                </SelectTrigger>
                <SelectContent>
                  {draftPosts.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.title || p.content.slice(0, 50)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Время публикации</p>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground"
              />
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Платформы</p>
              <div className="flex flex-col gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border ${
                      selectedPlatforms.includes(p.id)
                        ? 'bg-primary/20 border-primary text-foreground'
                        : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon name={p.icon} size={14} className={selectedPlatforms.includes(p.id) ? p.color : ''} />
                    {p.label}
                    {selectedPlatforms.includes(p.id) && (
                      <Icon name="Check" size={12} className="ml-auto text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full gap-2"
              onClick={handleSchedule}
              disabled={scheduleMutation.isPending || !selectedPost || selectedPlatforms.length === 0}
            >
              <Icon name="CalendarCheck" size={16} />
              {scheduleMutation.isPending ? 'Планирую...' : 'Запланировать'}
            </Button>
          </div>
        )}

        {/* Day schedule */}
        {selectedDay && selectedDayItems.length > 0 && (
          <div className="gradient-card rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-foreground text-sm">
              Публикации {format(selectedDay, 'd MMMM', { locale: ru })}
            </h3>
            {selectedDayItems.map((item) => {
              const platform = PLATFORMS.find((p) => p.id === item.platform);
              return (
                <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                  <Icon name={platform?.icon || 'Send'} size={16} className={platform?.color} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{platform?.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(item.scheduled_at), 'HH:mm')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        item.status === 'published'
                          ? 'bg-green-500/20 text-green-400'
                          : item.status === 'failed'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {item.status === 'published' ? '✓' : item.status === 'failed' ? '✗' : '⏳'}
                    </span>
                    {item.status === 'pending' && (
                      <button
                        onClick={() => cancelMutation.mutate(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Icon name="X" size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
