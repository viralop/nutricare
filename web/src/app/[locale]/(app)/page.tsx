'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Droplets, Plus, Trash2, Sparkles, Clock3 } from 'lucide-react';
import {
  Button, Card, ErrorBlock, LoadingBlock, ProgressBar, ProgressRing, SectionTitle, VerdictDot,
} from '@/components/ui';
import { api, apiData } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { DashboardSummary } from '@/lib/types';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tn = useTranslations('nutrients');
  const tu = useTranslations('units');
  const tc = useTranslations('common');
  const tv = useTranslations('verdicts');
  const tp = useTranslations('planner');
  const { user } = useAuth();
  const locale = useLocale();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState(false);
  const [busyWater, setBusyWater] = useState(false);

  const load = useCallback(() => {
    apiData<DashboardSummary>('/dashboard/summary', { locale })
      .then(setSummary)
      .catch(() => setError(true));
  }, [locale]);

  useEffect(load, [load]);

  async function addWater(amountMl: number) {
    setBusyWater(true);
    try {
      await api('/water-logs', {
        method: 'POST',
        body: JSON.stringify({ amount_ml: amountMl }),
      });
      load();
    } finally {
      setBusyWater(false);
    }
  }

  async function removeMeal(id: number) {
    await api(`/meal-logs/${id}`, { method: 'DELETE' });
    load();
  }

  if (error) return <ErrorBlock onRetry={load} />;
  if (!summary || !user) return <LoadingBlock />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold">{t('hello', { name: user.name.split(' ')[0] })}</h1>
        <p className="text-sm text-muted">{t('title')}</p>
      </header>

      {/* Progress rings */}
      <Card>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <ProgressRing
            pct={(summary.totals.energy_kcal ?? 0) / summary.targets.energy_kcal * 100}
            label={t('calories')}
            sub={`${tu('kcal')} · ${t('ofTarget', { target: summary.targets.energy_kcal })}`}
          />
          <ProgressRing
            pct={summary.water_ml / summary.targets.water_ml * 100}
            label={t('water')}
            sub={`${summary.water_ml} / ${summary.targets.water_ml} ${tu('ml')}`}
          />
          <div className="col-span-2 flex flex-col justify-center gap-3 px-2">
            <ProgressBar value={summary.totals.sugar_g ?? 0} target={summary.targets.sugar_g} label={t('sugar')} unit={tu('g')} />
            <ProgressBar value={summary.totals.sodium_mg ?? 0} target={summary.targets.sodium_mg} label={t('sodium')} unit={tu('mg')} />
            <ProgressBar value={summary.totals.sat_fat_g ?? 0} target={summary.targets.sat_fat_g} label={t('satFat')} unit={tu('g')} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <Droplets className="h-5 w-5 text-teal-600" aria-hidden />
          <span className="me-auto text-sm font-semibold">{t('addWater')}</span>
          {[250, 500].map((ml) => (
            <Button key={ml} size="sm" variant="secondary" disabled={busyWater} onClick={() => addWater(ml)}>
              <Plus className="h-4 w-4" aria-hidden />
              {ml} {tu('ml')}
            </Button>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's meals */}
        <Card>
          <SectionTitle
            action={
              <Link href={`/${locale}/analyzer`} className="text-sm font-bold text-primary-700 hover:underline dark:text-primary-300">
                + {tc('add')}
              </Link>
            }
          >
            {t('todayMeals')}
          </SectionTitle>
          {summary.meals.length === 0 ? (
            <p className="text-sm text-muted">{t('noMeals')}</p>
          ) : (
            <ul className="space-y-2">
              {summary.meals.map((m) => (
                <li key={m.id} className="surface-2 flex items-center gap-3 rounded-xl p-3">
                  <span className="text-2xl" aria-hidden>{m.food.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {m.food.name}
                      <span className="ms-2 text-xs text-muted">
                        {tp(m.slot)} × {m.quantity_servings}
                      </span>
                    </p>
                    <p className="text-xs text-muted tabular-nums">
                      {Math.round((m.food.per_serving.energy_kcal ?? 0) * m.quantity_servings)} {tu('kcal')} ·{' '}
                      {Math.round((m.food.per_serving.sodium_mg ?? 0) * m.quantity_servings)} {tu('mg')} {tn('sodium_mg')}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`${tc('delete')} ${m.food.name}`}
                    onClick={() => removeMeal(m.id)}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recommendations */}
        <Card>
          <SectionTitle>{t('recommendations')}</SectionTitle>
          <ul className="space-y-2">
            {summary.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2 rounded-xl bg-mint-50 p-3 text-sm leading-relaxed dark:bg-teal-900/20">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
                {r}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Recently analyzed */}
      <Card>
        <SectionTitle>{t('recentlyAnalyzed')}</SectionTitle>
        {summary.recent_analyses.length === 0 ? (
          <p className="text-sm text-muted">{t('noMeals')}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {summary.recent_analyses.map((a, i) => (
              <li key={`${a.food.slug}-${i}`}>
                <Link
                  href={`/${locale}/analyzer?food=${a.food.slug}`}
                  className="surface-2 flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium hover:opacity-80"
                >
                  <span aria-hidden>{a.food.emoji}</span>
                  {a.food.name}
                  <VerdictDot verdict={a.verdict} />
                  <span className="text-xs text-muted">{tv(a.verdict)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
          <Clock3 className="h-3.5 w-3.5" aria-hidden />
          {t('history')}
        </p>
      </Card>
    </div>
  );
}
