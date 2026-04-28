import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSocialAccounts, updateSocialAccount } from '@/lib/api';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import type { Platform, SocialAccount } from '@/types';

const PLATFORM_INFO: Record<
  Platform,
  { label: string; icon: string; color: string; fields: { key: string; label: string; placeholder: string; type?: string }[] }
> = {
  telegram: {
    label: 'Telegram',
    icon: 'Send',
    color: 'text-blue-400',
    fields: [
      { key: 'bot_token', label: 'Bot Token', placeholder: '1234567890:AABBccDDee...', type: 'password' },
      { key: 'channel_id', label: 'ID канала', placeholder: '@mychannel или -100123456789' },
    ],
  },
  vk: {
    label: 'ВКонтакте',
    icon: 'Users',
    color: 'text-blue-500',
    fields: [
      { key: 'access_token', label: 'Access Token', placeholder: 'vk1.a.xxx...', type: 'password' },
      { key: 'group_id', label: 'ID группы', placeholder: '123456789' },
    ],
  },
  instagram: {
    label: 'Instagram',
    icon: 'Camera',
    color: 'text-pink-400',
    fields: [
      { key: 'access_token', label: 'Access Token', placeholder: 'EAABxx...', type: 'password' },
      { key: 'ig_user_id', label: 'ID аккаунта', placeholder: '17841400123456789' },
    ],
  },
  dzen: {
    label: 'Яндекс Дзен',
    icon: 'BookOpen',
    color: 'text-orange-400',
    fields: [
      { key: 'oauth_token', label: 'OAuth Token', placeholder: 'y0_xxx...', type: 'password' },
      { key: 'channel_id', label: 'ID канала', placeholder: 'xxx-yyy-zzz' },
    ],
  },
};

export default function Settings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});
  const [openPlatform, setOpenPlatform] = useState<Platform | null>('telegram');

  const { data } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: getSocialAccounts,
  });

  const updateMutation = useMutation({
    mutationFn: ({ platform, data }: { platform: string; data: Record<string, string | boolean> }) =>
      updateSocialAccount(platform, data),
    onSuccess: () => {
      toast.success('Настройки сохранены');
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: () => toast.error('Ошибка сохранения'),
  });

  const accounts = data?.accounts || [];

  const getAccount = (platform: Platform): SocialAccount | undefined =>
    accounts.find((a) => a.platform === platform);

  const handleSave = (platform: Platform) => {
    const fields = formData[platform] || {};
    updateMutation.mutate({
      platform,
      data: { ...fields, is_connected: true },
    });
  };

  const handleDisconnect = (platform: Platform) => {
    updateMutation.mutate({ platform, data: { is_connected: false } });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <p className="text-muted-foreground text-sm">
          Подключите API ключи для публикации в социальные сети
        </p>
      </div>

      {/* AI info */}
      <div className="gradient-card rounded-xl p-4 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Icon name="Sparkles" size={18} className="text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">ИИ для генерации текста подключён</p>
            <p className="text-xs text-muted-foreground">Посты генерируются автоматически — ничего настраивать не нужно</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 ml-auto" />
        </div>
      </div>

      {/* Social platforms */}
      {(Object.keys(PLATFORM_INFO) as Platform[]).map((platform) => {
        const info = PLATFORM_INFO[platform];
        const account = getAccount(platform);
        const isOpen = openPlatform === platform;

        return (
          <div
            key={platform}
            className={`gradient-card rounded-xl overflow-hidden border ${
              account?.is_connected ? 'border-green-500/30' : 'border-border'
            }`}
          >
            <button
              className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
              onClick={() => setOpenPlatform(isOpen ? null : platform)}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  account?.is_connected ? 'bg-green-500/20' : 'bg-muted'
                }`}
              >
                <Icon name={info.icon} size={18} className={account?.is_connected ? 'text-green-400' : info.color} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground text-sm">{info.label}</p>
                <p className="text-xs text-muted-foreground">
                  {account?.is_connected
                    ? account.account_name || 'Подключено'
                    : 'Не подключено'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {account?.is_connected && (
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                )}
                <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-muted-foreground" />
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-3 border-t border-border pt-4">
                {info.fields.map((field) => (
                  <div key={field.key}>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      {field.label}
                    </label>
                    <Input
                      type={field.type || 'text'}
                      placeholder={field.placeholder}
                      value={formData[platform]?.[field.key] || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [platform]: { ...prev[platform], [field.key]: e.target.value },
                        }))
                      }
                    />
                  </div>
                ))}

                <div className="flex gap-2 pt-1">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => handleSave(platform)}
                    disabled={updateMutation.isPending}
                  >
                    <Icon name="Save" size={14} />
                    Сохранить
                  </Button>
                  {account?.is_connected && (
                    <Button
                      variant="outline"
                      className="gap-2 text-destructive hover:text-destructive"
                      onClick={() => handleDisconnect(platform)}
                      disabled={updateMutation.isPending}
                    >
                      <Icon name="Unlink" size={14} />
                      Отключить
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}