'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { Check, Languages, LoaderCircle, Monitor, Moon, Sun, Settings as SettingsIcon } from 'lucide-react';
import clsx from 'clsx';
import { Button, Card, Input, PageHeader, SectionTitle } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRouter } from '@/i18n/navigation';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();

  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function sendFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!feedback.trim()) return;
    setSending(true);
    try {
      await api('/feedback', { method: 'POST', body: JSON.stringify({ message: feedback.trim() }) });
      setSent(true);
      setFeedback('');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        icon={<SettingsIcon className="h-6 w-6" aria-hidden />}
      />

      <Card>
        <SectionTitle>{t('languageRegion')}</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {(['en', 'ar'] as const).map((l) => (
            <Button
              key={l}
              variant={locale === l ? 'primary' : 'ghost'}
              onClick={() => router.replace('/settings', { locale: l })}
            >
              <Languages className="h-4 w-4" aria-hidden />
              {l === 'en' ? tc('english') : tc('arabic')}
            </Button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>{t('appearance')}</SectionTitle>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('appearance')}>
          {(
            [
              { value: 'light', label: tc('light'), Icon: Sun, hint: '☀️' },
              { value: 'dark', label: tc('dark'), Icon: Moon, hint: '🌙' },
              { value: 'system', label: tc('system'), Icon: Monitor, hint: '💻' },
            ] as const
          ).map(({ value, label, Icon }) => {
            const active = (theme ?? 'system') === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(value)}
                className={
                  active
                    ? 'gradient-brand card-hover rounded-2xl p-4 text-center text-white shadow-md'
                    : 'surface-2 card-hover rounded-2xl p-4 text-center ring-1 ring-[var(--border)]'
                }
              >
                <Icon className={clsx('mx-auto mb-1.5 h-6 w-6', active ? 'text-white' : 'text-teal-600')} aria-hidden />
                <span className="block text-sm font-extrabold">{label}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted">{tc('system')} → {tc('theme')}</p>
      </Card>

      <Card>
        <SectionTitle>{t('feedback')}</SectionTitle>
        <form onSubmit={sendFeedback} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t('feedbackPlaceholder')}
              aria-label={t('feedback')}
            />
          </div>
          <Button type="submit" disabled={sending || feedback.trim().length < 5}>
            {sending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : sent ? <Check className="h-4 w-4" aria-hidden /> : null}
            {sent ? t('feedbackSent') : t('feedback')}
          </Button>
        </form>
      </Card>

      <Card>
        <SectionTitle>{t('account')}</SectionTitle>
        <p className="text-sm text-muted">{user?.email}</p>
        <p className="mt-4 text-xs text-muted">
          <strong>{t('dangerZone')}:</strong> {t('dangerNote')}
        </p>
      </Card>
    </div>
  );
}
