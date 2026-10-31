'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Droplets, Plus, Trash2, Sparkles, Clock3, Flame, Candy, Leaf, ScanSearch, HeartPulse, Beef, FlaskConical,
} from 'lucide-react';
import {
  Button, Card, Chip, EmptyState, ErrorBlock, LoadingBlock, PageHeader,
  ProgressBar, ProgressRing, SectionTitle, StatTile, VerdictDot,
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

  const firstName = user.name.split(' ')[0];

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <PageHeader
        title={t('hello', { name: firstName })}
        subtitle={t('title')}
        icon={<HeartPulse className="h-6 w-6" aria-hidden />}
      />

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label={t('calories')}
          value={`${Math.round(summary.totals.energy_kcal ?? 0)} / ${summary.targets.energy_kcal}`}
          icon={<Flame className="h-5 w-5" aria-hidden />}
          tone="amber"
        />
        <StatTile
          label={t('water')}
          value={`${summary.water_ml} / ${summary.targets.water_ml}`}
          icon={<Droplets className="h-5 w-5" aria-hidden />}
          tone="teal"
        />
        <StatTile
          label={t('sugar')}
          value={`${Math.round(summary.totals.sugar_g ?? 0)} / ${summary.targets.sugar_g}`}
          icon={<Candy className="h-5 w-5" aria-hidden />}
          tone="rose"
        />
        <StatTile
          label={t('sodium')}
          value={`${Math.round(summary.totals.sodium_mg ?? 0)} / ${summary.targets.sodium_mg}`}
          icon={<FlaskConical className="h-5 w-5" aria-hidden />}
          tone="violet"
        />
      </div>

      {/* Rings + bars */}
      <Card>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <ProgressRing
            pct={(summary.totals.energy_kcal ?? 0) / summary.targets.energy_kcal * 100}
            label={t('calories')}
            sub={`${tu('kcal')}`}
          />
          <ProgressRing
            pct={summary.water_ml / summary.targets.water_ml * 100}
            label={t('water')}
            sub={`${tu('ml')}`}
          />
          <div className="col-span-2 flex flex-col justify-center gap-4">
            <ProgressBar value={summary.totals.sugar_g ?? 0} target={summary.targets.sugar_g} label={t('sugar')} unit={tu('g')} tone="rose" />
            <ProgressBar value={summary.totals.sodium_mg ?? 0} target={summary.targets.sodium_mg} label={t('sodium')} unit={tu('mg')} tone="violet" />
            <ProgressBar value={summary.totals.sat_fat_g ?? 0} target={summary.targets.sat_fat_g} label={t('satFat')} unit={tu('g')} tone="amber" />
            <ProgressBar value={summary.totals.fiber_g ?? 0} target={30} label={tn('fiber_g')} unit={tu('g')} tone="brand" danger={200} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4 border-app" style={{ borderColor: 'var(--border)' }}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-mint-300 text-white shadow-md">
            <Droplets className="h-5 w-5" aria-hidden />
          </span>
          <span className="me-auto text-sm font-bold">{t('addWater')}</span>
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
              <Link
                href={`/${locale}/analyzer`}
                className="gradient-brand rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-md transition-transform hover:scale-105"
              >
                + {tc('add')}
              </Link>
            }
          >
            {t('todayMeals')}
          </SectionTitle>
          {summary.meals.length === 0 ? (
            <EmptyState emoji="🍽️" text={t('noMeals')} />
          ) : (
            <ul className="space-y-2">
              {summary.meals.map((m) => (
                <li key={m.id} className="surface-2 group flex items-center gap-3 rounded-2xl p-3 ring-1 ring-[var(--border)] transition-shadow hover:shadow-md">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-50 to-mint-50 text-2xl ring-1 ring-primary-100 dark:from-primary-900/30 dark:to-teal-900/20 dark:ring-primary-800" aria-hidden>
                    {m.food.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">
                      {m.food.name}
                      <span className="ms-2 text-xs font-medium text-muted">
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
                    className="rounded-lg p-2 text-red-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 group-hover:opacity-100 dark:hover:bg-red-900/20"
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
              <li
                key={i}
                className="flex items-start gap-3 rounded-2xl gradient-brand-soft p-3.5 text-sm font-medium leading-relaxed ring-1 ring-teal-100 dark:ring-teal-900/40"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl gradient-brand text-white shadow">
                  <Sparkles className="h-4 w-4" aria-hidden />
                </span>
                {r}
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              href={`/${locale}/analyzer`}
              className="surface-2 flex items-center gap-2 rounded-2xl p-3 text-sm font-bold ring-1 ring-[var(--border)] transition-all hover:shadow-md"
            >
              <ScanSearch className="h-5 w-5 text-teal-600" aria-hidden />
              <span className="truncate">{locale === 'ar' ? 'حلّل وجبتك' : 'Analyze a meal'}</span>
            </Link>
            <Link
              href={`/${locale}/education`}
              className="surface-2 flex items-center gap-2 rounded-2xl p-3 text-sm font-bold ring-1 ring-[var(--border)] transition-all hover:shadow-md"
            >
              <Leaf className="h-5 w-5 text-primary-600" aria-hidden />
              <span className="truncate">{locale === 'ar' ? 'اقرأ وتعلم' : 'Read & learn'}</span>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recently analyzed */}
      <Card>
        <SectionTitle
          action={
            <span className="flex items-center gap-1 text-xs font-semibold text-muted">
              <Clock3 className="h-3.5 w-3.5" aria-hidden />
              {t('history')}
            </span>
          }
        >
          {t('recentlyAnalyzed')}
        </SectionTitle>
        {summary.recent_analyses.length === 0 ? (
          <EmptyState emoji="🔎" text={t('noMeals')} />
        ) : (
          <ul className="flex flex-wrap gap-2">
            {summary.recent_analyses.map((a, i) => (
              <li key={`${a.food.slug}-${i}`} className="anim-fade-up">
                <Link
                  href={`/${locale}/analyzer?food=${a.food.slug}`}
                  className="surface-2 flex items-center gap-2 rounded-full py-1.5 pe-3 ps-1.5 text-sm font-bold ring-1 ring-[var(--border)] transition-all hover:shadow-md"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary-50 to-mint-50 text-lg ring-1 ring-primary-100 dark:from-primary-900/40 dark:to-teal-900/30 dark:ring-primary-800" aria-hidden>
                    {a.food.emoji}
                  </span>
                  {a.food.name}
                  <VerdictDot verdict={a.verdict} />
                  <span className="text-xs font-medium text-muted">{tv(a.verdict)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex items-center gap-2">
          <Chip tone="teal">
            <Beef className="h-3 w-3" aria-hidden />
            {Math.round(summary.totals.protein_g ?? 0)} {tu('g')} {tn('protein_g')}
          </Chip>
          <Chip tone="brand">
            {Math.round(summary.totals.carbohydrate_g ?? 0)} {tu('g')} {tn('carbohydrate_g')}
          </Chip>
          <Chip tone="warn">
            {Math.round(summary.totals.total_fat_g ?? 0)} {tu('g')} {tn('total_fat_g')}
          </Chip>
        </div>
      </Card>
    </div>
  );
}
