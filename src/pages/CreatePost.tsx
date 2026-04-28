import { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generatePost, createPost, uploadMedia } from '@/lib/api';
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

export default function CreatePost() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const newsItem = location.state?.news as NewsItem | undefined;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState(newsItem?.title || '');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['telegram']);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; preview: string; base64: string }[]>([]);
  const [postId, setPostId] = useState<number | null>(null);

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
      toast.success('Пост сгенерирован');
    },
    onError: () => toast.error('Ошибка генерации. Проверьте настройки API'),
  });

  const saveMutation = useMutation({
    mutationFn: async (status: 'draft' | 'scheduled') => {
      const post = await createPost({ title, content, status });
      setPostId(post.post.id);

      for (const file of uploadedFiles) {
        await uploadMedia(post.post.id, file.base64, file.name);
      }

      return post;
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      if (status === 'scheduled') {
        navigate('/calendar', { state: { post_id: postId } });
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

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = (ev.target?.result as string).split(',')[1];
        setUploadedFiles((prev) => [
          ...prev,
          { name: file.name, preview: ev.target?.result as string, base64 },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
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

      {/* Topic & Generate */}
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

        {/* Platform selector */}
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

      {/* Media upload */}
      <div className="gradient-card rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Icon name="Images" size={16} className="text-primary" />
          Карусель изображений
        </h2>
        <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer">
          <Icon name="Upload" size={24} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Загрузите референсы для карусели
          </span>
          <span className="text-xs text-muted-foreground">PNG, JPG, GIF до 10MB</span>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>

        {uploadedFiles.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {uploadedFiles.map((file, i) => (
              <div key={i} className="relative group">
                <img
                  src={file.preview}
                  alt={file.name}
                  className="w-20 h-20 object-cover rounded-lg border border-border"
                />
                <button
                  onClick={() => removeFile(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive rounded-full hidden group-hover:flex items-center justify-center"
                >
                  <Icon name="X" size={10} className="text-white" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 rounded-b-lg px-1 py-0.5">
                  <p className="text-xs text-white truncate">{i + 1}</p>
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
