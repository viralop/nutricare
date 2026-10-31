'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth';
import { Button, Card, ErrorBlock, Input, LoadingBlock, PageHeader, SectionTitle, StatTile } from '@/components/ui';
import { Users, Apple, BadgeCheck, TriangleAlert, CookingPot, BookOpen, ScanSearch, ShieldCheck, Flame } from 'lucide-react';
import { api, apiData } from '@/lib/api';
import type { Food, NutrientKey } from '@/lib/types';

interface Stats {
  users: number;
  foods: number;
  verified_foods: number;
  estimated_foods: number;
  recipes: number;
  articles: number;
  analyses: number;
  top_foods: { total: number; food: Food }[];
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  locale: string;
  created_at: string | null;
  conditions: { slug: string; name: string }[];
}

const TABS = ['tab_foods', 'tab_users', 'tab_articles', 'tab_feedback'] as const;

const NUTRIENTS: NutrientKey[] = [
  'energy_kcal', 'carbohydrate_g', 'sugar_g', 'protein_g', 'total_fat_g', 'sat_fat_g', 'sodium_mg', 'fiber_g',
];

function unitOf(k: NutrientKey) {
  return k === 'energy_kcal' ? 'kcal' : k === 'sodium_mg' ? 'mg' : 'g';
}

function EditFoodModal({ food, onClose, onSaved }: { food: Food; onClose: () => void; onSaved: () => void }) {
  const tc = useTranslations('common');
  const t = useTranslations('admin');
  const tn = useTranslations('nutrients');
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const k of NUTRIENTS) init[k] = food.per_100g[k] === null ? '' : String(food.per_100g[k]);
    return init;
  });
  const [serving, setServing] = useState(String(food.serving_size_g));
  const [verified, setVerified] = useState(food.source.is_verified);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        serving_size_g: Number(serving),
        is_verified: verified,
      };
      for (const k of NUTRIENTS) payload[k] = values[k] === '' ? null : Number(values[k]);
      await api(`/admin/foods/${food.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      onSaved();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={t('editFood')}>
      <Card className="max-h-[85vh] w-full max-w-lg overflow-y-auto">
        <SectionTitle action={<Button size="sm" variant="ghost" onClick={onClose}>{tc('close')}</Button>}>
          {t('editFood')} — {food.name}
        </SectionTitle>
        <p className="mb-3 text-xs text-muted">{tc('per100g')}</p>
        <div className="grid grid-cols-2 gap-3">
          {NUTRIENTS.map((k) => (
            <Input
              key={k}
              label={`${tn(k)} (${unitOf(k)})`}
              type="number"
              step="0.1"
              value={values[k]}
              onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
            />
          ))}
          <Input label={`${tc('serving')} (g)`} type="number" value={serving} onChange={(e) => setServing(e.target.value)} />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="h-4 w-4" />
          {t('verify')}
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{tc('cancel')}</Button>
          <Button onClick={save} disabled={busy}>{busy ? tc('saving') : tc('save')}</Button>
        </div>
      </Card>
    </div>
  );
}

export default function AdminPage() {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const { user } = useAuth();
  const locale = useLocale();

  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>('tab_foods');
  const [foods, setFoods] = useState<Food[]>([]);
  const [foodQuery, setFoodQuery] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [feedback, setFeedback] = useState<{ id: number; message: string; user: { name?: string }; status: string }[]>([]);
  const [editing, setEditing] = useState<Food | null>(null);

  const loadStats = useCallback(() => {
    apiData<Stats>('/admin/stats', { locale }).then(setStats).catch(() => setError(true));
  }, [locale]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (tab === 'tab_foods') {
      apiData<{ data: Food[] }>(`/admin/foods?q=${encodeURIComponent(foodQuery)}&per_page=30`, { locale })
        .then((res) => setFoods(res.data ?? res))
        .catch(() => {});
    } else if (tab === 'tab_users') {
      apiData<{ data: AdminUser[] }>('/admin/users?per_page=30', { locale })
        .then((res) => setUsers(res.data ?? []))
        .catch(() => setUsers([]));
    } else if (tab === 'tab_feedback') {
      apiData<{ id: number; message: string; user: { name?: string }; status: string }[]>('/admin/feedback', { locale })
        .then((res) => setFeedback(Array.isArray(res) ? res : []))
        .catch(() => setFeedback([]));
    }
  }, [tab, foodQuery, locale]);

  if (!user || user.role !== 'admin') {
    return <ErrorBlock />;
  }
  if (error) return <ErrorBlock onRetry={loadStats} />;
  if (!stats) return <LoadingBlock />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        icon={<ShieldCheck className="h-6 w-6" aria-hidden />}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t('usersCount')} value={stats.users} icon={<Users className="h-5 w-5" aria-hidden />} tone="sky" />
        <StatTile label={t('foodsCount')} value={stats.foods} icon={<Apple className="h-5 w-5" aria-hidden />} tone="brand" />
        <StatTile label={t('verifiedCount')} value={stats.verified_foods} icon={<BadgeCheck className="h-5 w-5" aria-hidden />} tone="teal" />
        <StatTile label={t('estimatedCount')} value={stats.estimated_foods} icon={<TriangleAlert className="h-5 w-5" aria-hidden />} tone="amber" />
        <StatTile label={t('recipesCount')} value={stats.recipes} icon={<CookingPot className="h-5 w-5" aria-hidden />} tone="rose" />
        <StatTile label={t('articlesCount')} value={stats.articles} icon={<BookOpen className="h-5 w-5" aria-hidden />} tone="violet" />
        <StatTile label={t('analysesCount')} value={stats.analyses} icon={<ScanSearch className="h-5 w-5" aria-hidden />} tone="brand" />
      </div>

      <Card>
        <SectionTitle>{t('topFoods')}</SectionTitle>
        {stats.top_foods.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {stats.top_foods.map((f, i) => (
              <li
                key={f.food.slug}
                className="surface-2 flex items-center gap-2 rounded-full py-1.5 pe-3 ps-1.5 text-sm font-bold ring-1 ring-[var(--border)]"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full gradient-brand text-[11px] font-extrabold text-white" aria-hidden>
                  #{i + 1}
                </span>
                <span aria-hidden>{f.food.emoji}</span>
                {f.food.name}
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700 tabular-nums dark:bg-primary-900/40 dark:text-primary-300">
                  {f.total}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">—</p>
        )}
      </Card>

      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition-all ${tab === key ? 'gradient-brand text-white shadow-md' : 'surface-2 ring-1 ring-[var(--border)]'}`}
          >
            {t(key)}
          </button>
        ))}
      </div>

      {tab === 'tab_foods' && (
        <Card>
          <Input
            placeholder={tc('search')}
            value={foodQuery}
            onChange={(e) => setFoodQuery(e.target.value)}
            aria-label={tc('search')}
          />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-lg text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-start">{tc('view')}</th>
                  <th className="p-2 text-start">kcal/100g</th>
                  <th className="p-2 text-start">Na/100g</th>
                  <th className="p-2 text-start">{t('verify')}</th>
                  <th className="p-2 text-start" />
                </tr>
              </thead>
              <tbody>
                {foods.map((f) => (
                  <tr key={f.slug} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="p-2">
                      {f.emoji} {f.name} {f.source.is_estimated && <span title="~">≈</span>}
                    </td>
                    <td className="p-2 tabular-nums">{f.per_100g.energy_kcal ?? '—'}</td>
                    <td className="p-2 tabular-nums">{f.per_100g.sodium_mg ?? '—'}</td>
                    <td className="p-2">{f.source.is_verified ? '✓' : '—'}</td>
                    <td className="p-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(f)}>
                        {t('editFood')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'tab_users' && (
        <Card>
          <ul className="space-y-2">
            {users.map((u) => (
              <li key={u.id} className="surface-2 flex flex-wrap items-center justify-between gap-2 rounded-xl p-3">
                <div>
                  <p className="font-bold">
                    {u.name} <span className="text-xs text-muted">({u.role})</span>
                  </p>
                  <p className="text-xs text-muted" dir="ltr">{u.email}</p>
                </div>
                <p className="text-xs text-muted">
                  {t('users_conditions')}: {u.conditions.map((c) => c.name).join(', ') || '—'}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === 'tab_articles' && (
        <Card>
          <p className="text-sm text-muted">
            {t('articlesCount')}: {stats.articles} — {tc('comingSoon')}
          </p>
        </Card>
      )}

      {tab === 'tab_feedback' && (
        <Card>
          {feedback.length === 0 ? (
            <p className="text-sm text-muted">{t('notFound')}</p>
          ) : (
            <ul className="space-y-2">
              {feedback.map((f) => (
                <li key={f.id} className="surface-2 rounded-xl p-3">
                  <p className="text-sm">{f.message}</p>
                  <p className="mt-1 text-xs text-muted">
                    {f.user?.name ?? '—'} · {f.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {editing && <EditFoodModal food={editing} onClose={() => setEditing(null)} onSaved={loadStats} />}
    </div>
  );
}
