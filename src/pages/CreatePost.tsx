import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generatePost, generateImages, createPost, uploadMedia } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import type { Platform, NewsItem } from '@/types';

const PLATFORMS: { id: Platform; label: string; icon: string; color: string }[] = [
  { id: 'telegram', label: 'Telegram', icon: 'Send', color: 'text-blue-400' },
  { id: 'vk', label: 'ВКонтакте', icon: 'Users', color: 'text-blue-500' },
  { id: 'instagram', label: 'Instagram', icon: 'Camera', color: 'text-pink-400' },
  { id: 'dzen', label: 'Яндекс Дзен', icon: 'BookOpen', color: 'text-orange-400' },
];

const IMAGE_COUNTS = [1, 2, 3, 5];

export default function CreatePost() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const newsItem = location.state?.news as NewsItem | undefined;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState(newsItem?.title || '');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['telegram']);
  const [imageCount, setImageCount] = useState(3);
  const [generatedImages, setGeneratedImages] = useState<{ url: string; prompt: string }[]>([]);
  const [savedPostId, setSavedPostId] = useState<number | null>(null);

  const generateMutation = useMutation({
    mutationFn: () =>
      generatePost({
        news_id: newsItem?.id,
        topic: topic || undefined,
        platform: selectedPlatforms[0],
      }),
    onSuccess: (res) => {
      setContent(res.content);
      setTitle(res.title);
      setGeneratedImages([]);
      toast.success('Пост сгенерирован');
    },
    onError: () => toast.error('Ошибка генерации. Проверьте настройки API'),
  });

  const imagesMutation = useMutation({
    mutationFn: () =>
      generateImages({
        content,
        post_id: savedPostId || undefined,
        count: imageCount,
      }),
    onSuccess: (res) => {
      if (res.images.length > 0) {
        setGeneratedImages(res.images);
        toast.success(`Сгенерировано ${res.images.length} изображений`);
      }
      if (res.errors.length > 0) {
        toast.error(`${res.errors.length} изображений не удалось создать`);
      }
    },
    onError: () => toast.error('Ошибка генерации изображений'),
  });

  const saveMutation = useMutation({
    mutationFn: async (status: 'draft' | 'scheduled') => {
      const post = await createPost({ title, content, status });
      setSavedPostId(post.post.id);
      return post;
    },
    onSuccess: (post, status) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      if (status === 'scheduled') {
        navigate('/calendar', { state: { post_id: post.post.id } });
      } else {
        toast.success('Пост сохранён как черновик');
        navigate('/posts');
      }
    },
    onError: () => toast.error('Ошибка сохранения'),
  });

  const togglePlatform = (p: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const removeImage = (index: number) => {
    setGeneratedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const charCount = content.length;
  const charLimit = selectedPlatforms.includes('instagram') ? 2200 : 4096;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {newsItem && (
        <div className="gradient-card rounded-xl p-4 border border-orange-500/30">
          <div className="flex items-start gap-3">
            <Icon name="Flame" size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">На основе тренда:</p>
              <p className="text-sm text-muted-foreground mt-0.5">{newsItem.title}</p>
            </div>
          </div>
        </div>
      )}

      {/* Topic & Generate text */}
      <div className="gradient-card rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Icon name="Sparkles" size={16} className="text-primary" />
          Генерация через ИИ
        </h2>
        <div className="flex gap-3">
          <Input
            placeholder="Тема или ключевые слова для поста..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || (!topic && !newsItem)}
            className="gap-2 whitespace-nowrap"
          >
            <Icon
              name="Wand2"
              size={16}
              className={generateMutation.isPending ? 'animate-pulse' : ''}
            />
            {generateMutation.isPending ? 'Генерирую...' : 'Сгенерировать'}
          </Button>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Адаптировать для платформы:</p>
          <div className="flex gap-2 flex-wrap">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                  selectedPlatforms.includes(p.id)
                    ? 'bg-primary/20 border-primary text-foreground'
                    : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name={p.icon} size={13} className={selectedPlatforms.includes(p.id) ? p.color : ''} />
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="gradient-card rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Icon name="PenLine" size={16} className="text-primary" />
          Редактор поста
        </h2>
        <Input
          placeholder="Заголовок поста (опционально)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="relative">
          <Textarea
            placeholder="Текст поста..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-48 resize-none"
          />
          <span
            className={`absolute bottom-3 right-3 text-xs ${
              charCount > charLimit ? 'text-red-400' : 'text-muted-foreground'
            }`}
          >
            {charCount}/{charLimit}
          </span>
        </div>
      </div>

      {/* AI Image generation */}
      <div className="gradient-card rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Icon name="Images" size={16} className="text-primary" />
            Карусель изображений
          </h2>
          <span className="text-xs text-muted-foreground">ИИ генерирует по контексту поста</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Количество:</span>
            <div className="flex gap-1">
              {IMAGE_COUNTS.map((n) => (
                <button
                  key={n}
                  onClick={() => setImageCount(n)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    imageCount === n
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => imagesMutation.mutate()}
            disabled={imagesMutation.isPending || !content}
            variant="outline"
            className="flex-1 gap-2"
          >
            {imagesMutation.isPending ? (
              <>
                <Icon name="Loader2" size={16} className="animate-spin" />
                Генерирую {imageCount} изображений...
              </>
            ) : (
              <>
                <Icon name="Wand2" size={16} className="text-primary" />
                Сгенерировать изображения
              </>
            )}
          </Button>
        </div>

        {!content && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Сначала сгенерируйте или напишите текст поста
          </p>
        )}

        {imagesMutation.isPending && (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: imageCount }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-muted animate-pulse flex flex-col items-center justify-center gap-2"
              >
                <Icon name="ImageOff" size={20} className="text-muted-foreground/40" />
                <span className="text-xs text-muted-foreground/40">Генерирую...</span>
              </div>
            ))}
          </div>
        )}

        {generatedImages.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {generatedImages.map((img, i) => (
              <div key={i} className="relative group aspect-square">
                <img
                  src={img.url}
                  alt={`Изображение ${i + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-border"
                />
                <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                  <p className="text-xs text-white text-center line-clamp-4">{img.prompt}</p>
                  <button
                    onClick={() => removeImage(i)}
                    className="w-7 h-7 bg-destructive rounded-full flex items-center justify-center mt-1"
                  >
                    <Icon name="Trash2" size={12} className="text-white" />
                  </button>
                </div>
                <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">{i + 1}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => saveMutation.mutate('draft')}
          disabled={saveMutation.isPending || !content}
          className="gap-2"
        >
          <Icon name="Save" size={16} />
          Сохранить черновик
        </Button>
        <Button
          onClick={() => saveMutation.mutate('scheduled')}
          disabled={saveMutation.isPending || !content}
          className="gap-2"
        >
          <Icon name="CalendarDays" size={16} />
          Запланировать
        </Button>
      </div>
    </div>
  );
}
