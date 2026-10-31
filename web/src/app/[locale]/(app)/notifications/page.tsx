'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import clsx from 'clsx';
import { Bell, Droplets, CalendarCheck, Lightbulb, BarChart3, UtensilsCrossed, Info } from 'lucide-react';
import { Card, Chip, ErrorBlock, LoadingBlock, PageHeader, SectionTitle, Toggle } from '@/components/ui';
import { apiData } from '@/lib/api';
import type { NotificationPrefs } from '@/lib/types';

const PREF_KEYS = ['water_reminders', 'meal_reminders', 'daily_tips', 'weekly_summary', 'plan_reminders'] as const;

const ICONS: Record<string, React.ReactNode> = {
  water: <Droplets className="h-5 w-5 text-white" aria-hidden />,
  meal: <UtensilsCrossed className="h-5 w-5 text-white" aria-hidden />,
  tip: <Lightbulb className="h-5 w-5 text-white" aria-hidden />,
  summary: <BarChart3 className="h-5 w-5 text-white" aria-hidden />,
  plan: <CalendarCheck className="h-5 w-5 text-white" aria-hidden />,
};

const ICON_BG: Record<string, string> = {
  water: 'from-teal-500 to-mint-300',
  meal: 'from-primary-600 to-primary-400',
  tip: 'from-amber-400 to-yellow-300',
  summary: 'from-violet-500 to-fuchsia-400',
  plan: 'from-sky-500 to-cyan-400',
};

interface NotificationItem {
  type: string;
  title: string;
  body: string;
}

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const tc = useTranslations('common');
  const locale = useLocale();

  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [feed, setFeed] = useState<NotificationItem[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      apiData<NotificationPrefs>('/notifications/preferences'),
      apiData<NotificationItem[]>('/notifications', { locale }),
    ])
      .then(([p, f]) => {
        setPrefs(p);
        setFeed(f);
      })
      .catch(() => setError(true));
  }, [locale]);

  useEffect(load, [load]);

  async function update(patch: Partial<NotificationPrefs>) {
    if (!prefs) return;
    const next = { ...prefs, ...patch };
    setPrefs(next); // optimistic
    try {
      await apiData('/notifications/preferences', { method: 'PUT', body: JSON.stringify(patch) });
    } catch {
      load();
    }
  }

  if (error) return <ErrorBlock onRetry={load} />;
  if (!prefs || !feed) return <LoadingBlock />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        icon={<Bell className="h-6 w-6" aria-hidden />}
      />

      <Card className="anim-fade-up">
        <SectionTitle>{t('feed')}</SectionTitle>
        <ul className="space-y-2">
          {feed.map((n, i) => (
            <li key={i} className="surface-2 flex items-start gap-3 rounded-2xl p-3.5 ring-1 ring-[var(--border)] transition-shadow hover:shadow-md">
              <span className={clsx('grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br shadow-md', ICON_BG[n.type] ?? 'from-primary-600 to-teal-400')}>
                {ICONS[n.type] ?? <Bell className="h-5 w-5 text-white" aria-hidden />}
              </span>
              <div>
                <p className="font-extrabold">{n.title}</p>
                <p className="mt-0.5 text-sm text-muted">{n.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
          <Info className="h-3.5 w-3.5" aria-hidden />
          {t('pushNote')}
        </p>
      </Card>

      <Card>
        <SectionTitle>{t('preferences')}</SectionTitle>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {PREF_KEYS.map((key) => (
            <Toggle
              key={key}
              label={t(key)}
              checked={prefs[key]}
              onChange={(v) => update({ [key]: v } as Partial<NotificationPrefs>)}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
