'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Droplets, Plus, Trash2, Sparkles, Clock3, ScanSearch, UtensilsCrossed, Search, Leaf, Drumstick,
} from 'lucide-react';
import {
  Button, Card, Chip, EmptyState, ErrorBlock, FoodImage, LoadingBlock,
  ProgressBar, ProgressRing, SectionTitle, VerdictDot,
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
  const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState(false);
  const [busyWater, setBusyWater] = useState(false);
  const [waterBeat, setWaterBeat] = useState(0);

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
      setWaterBeat((n) => n + 1);
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
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('greetingMorning', { name: firstName })
    : hour < 17 ? t('greetingAfternoon', { name: firstName })
    : t('greetingEvening', { name: firstName });

  return (
    <div className="space-y-6">
      {/* Hero greeting over a clean salad photograph (slow drift). */}
      <section
        className="anim-fade-up surface relative min-h-44 overflow-hidden rounded-2xl"
        aria-label={t('title')}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/Vegetable_Salad_%28Unsplash%29.jpg/960px-Vegetable_Salad_%28Unsplash%29.jpg"
          alt=""
          aria-hidden
          className="hero-drift absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgb(6 78 59 / 0.92) 20%, rgb(6 78 59 / 0.45) 70%, rgb(6 78 59 / 0.2))' }}
        />
        <div className="relative flex min-h-44 flex-col justify-end gap-1.5 p-5">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-white">{greeting}</h1>
          <p className="text-sm font-medium text-white/80">{t('title')}</p>
          {user.conditions.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {user.conditions.slice(0, 3).map((c) => (
                <span key={c.slug} className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold text-white ring-1 ring-white/25">
                  {c.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Rings + bars */}
      <Card>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <ProgressRing
            pct={(summary.totals.energy_kcal ?? 0) / summary.targets.energy_kcal * 100}
            label={t('calories')}
            sub={`${tu('kcal')}`}
            value={fmt(summary.totals.energy_kcal ?? 0)}
            target={fmt(summary.targets.energy_kcal)}
          />
          <div key={waterBeat} className={waterBeat > 0 ? 'water-pulse' : undefined}>
            <ProgressRing
              pct={summary.water_ml / summary.targets.water_ml * 100}
              label={t('water')}
              sub={`${tu('ml')}`}
              value={fmt(summary.water_ml)}
              target={fmt(summary.targets.water_ml)}
            />
          </div>
          <div className="col-span-2 flex flex-col justify-center gap-4">
            <ProgressBar value={summary.totals.sugar_g ?? 0} target={summary.targets.sugar_g} label={t('sugar')} unit={tu('g')} tone="rose" />
            <ProgressBar value={summary.totals.sodium_mg ?? 0} target={summary.targets.sodium_mg} label={t('sodium')} unit={tu('mg')} tone="violet" />
            <ProgressBar value={summary.totals.sat_fat_g ?? 0} target={summary.targets.sat_fat_g} label={t('satFat')} unit={tu('g')} tone="amber" />
            <ProgressBar value={summary.totals.fiber_g ?? 0} target={30} label={tn('fiber_g')} unit={tu('g')} tone="brand" danger={200} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4 border-app" style={{ borderColor: 'var(--border)' }}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
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
            <EmptyState icon={<UtensilsCrossed className="h-6 w-6" aria-hidden />} text={t('noMeals')} />
          ) : (
            <ul className="space-y-2">
              {summary.meals.map((m) => (
                <li key={m.id} className="surface-2 group flex items-center gap-3 rounded-2xl p-3 ring-1 ring-[var(--border)] transition-shadow hover:shadow-md">
                  <FoodImage food={m.food} className="h-11 w-11" />
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
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
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
          <EmptyState icon={<Search className="h-6 w-6" aria-hidden />} text={t('noMeals')} />
        ) : (
          <ul className="flex flex-wrap gap-2">
            {summary.recent_analyses.map((a, i) => (
              <li key={`${a.food.slug}-${i}`} className="anim-fade-up">
                <Link
                  href={`/${locale}/analyzer?food=${a.food.slug}`}
                  className="surface-2 flex items-center gap-2 rounded-full py-1.5 pe-3 ps-1.5 text-sm font-bold ring-1 ring-[var(--border)] transition-all hover:shadow-md"
                >
                  <FoodImage food={a.food} className="h-8 w-8 rounded-full" emojiClass="text-base" />
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
            <Drumstick className="h-3 w-3" aria-hidden />
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
