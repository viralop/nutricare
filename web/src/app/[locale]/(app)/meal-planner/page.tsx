'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import clsx from 'clsx';
import { RefreshCcw, Clock3, Coins, CalendarDays, ArrowRightLeft, Sunrise, Sun, MoonStar, Apple, Info } from 'lucide-react';
import { Button, Card, Chip, ErrorBlock, LoadingBlock, PageHeader, SectionTitle } from '@/components/ui';
import { apiData } from '@/lib/api';
import type { MealPlanDay, Recipe } from '@/lib/types';

const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

const SLOT_ICONS: Record<string, React.ReactNode> = {
  breakfast: <Sunrise className="h-4 w-4" aria-hidden />,
  lunch: <Sun className="h-4 w-4" aria-hidden />,
  dinner: <MoonStar className="h-4 w-4" aria-hidden />,
  snack: <Apple className="h-4 w-4" aria-hidden />,
};

export default function MealPlannerPage() {
  const t = useTranslations('planner');
  const tr = useTranslations('recipes');
  const tc = useTranslations('common');
  const tu = useTranslations('units');
  const locale = useLocale();

  const [days, setDays] = useState<MealPlanDay | null>(null);
  const [weekStart, setWeekStart] = useState<string>('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [swapFor, setSwapFor] = useState<number | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('');

  const load = useCallback(() => {
    apiData<{ week_start: string; days: MealPlanDay }>('/meal-plan', { locale })
      .then((res) => {
        setDays(res.days);
        setWeekStart(res.week_start);
        const first = Object.keys(res.days)[0] ?? '';
        setSelectedDay((prev) => (prev && res.days[prev] ? prev : first));
      })
      .catch(() => setError(true));
  }, [locale]);

  useEffect(() => {
    load();
    apiData<Recipe[]>('/recipes', { locale }).then(setRecipes).catch(() => setRecipes([]));
  }, [load, locale]);

  async function regenerate() {
    setBusy(true);
    try {
      const res = await apiData<{ week_start: string; days: MealPlanDay }>('/meal-plan/regenerate', {
        method: 'POST',
        locale,
      });
      setDays(res.days);
      setWeekStart(res.week_start);
    } finally {
      setBusy(false);
    }
  }

  async function replace(entryId: number, recipeId: number) {
    await apiData(`/meal-plan/entries/${entryId}/replace`, {
      method: 'POST',
      body: JSON.stringify({ recipe_id: recipeId }),
      locale,
    });
    setSwapFor(null);
    load();
  }

  const dayKeys = useMemo(() => Object.keys(days ?? {}).sort(), [days]);
  const dayLabel = (iso: string) =>
    new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(new Date(`${iso}T00:00:00`));

  if (error) return <ErrorBlock onRetry={load} />;
  if (!days) return <LoadingBlock />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        icon={<CalendarDays className="h-6 w-6" aria-hidden />}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={regenerate}
            disabled={busy}
          >
            <RefreshCcw className={clsx('h-4 w-4', busy && 'animate-spin')} aria-hidden />
            {t('regenerate')}
          </Button>
        }
      />

      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
        {dayKeys.map((iso) => (
          <button
            key={iso}
            role="tab"
            aria-selected={selectedDay === iso}
            onClick={() => setSelectedDay(iso)}
            className={clsx(
              'shrink-0 rounded-full px-4 py-2 text-sm font-bold',
              selectedDay === iso ? 'bg-primary-800 text-white' : 'surface-2 text-[var(--text)]',
            )}
          >
            {dayLabel(iso)}
          </button>
        ))}
      </div>

      {/* Day plan */}
      <div className="grid gap-4 md:grid-cols-2">
        {SLOTS.map((slot) => {
          const entry = (days[selectedDay] ?? []).find((e) => e.meal_slot === slot);
          if (!entry) return null;
          return (
            <Card key={slot} hover className="anim-fade-up">
              <div className="mb-3 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-primary-600 to-teal-400 text-white shadow" aria-hidden>
                  {SLOT_ICONS[slot]}
                </span>
                <p className="text-sm font-extrabold text-teal-700 dark:text-teal-300">{t(slot)}</p>
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-extrabold leading-snug">{entry.recipe.title}</h3>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted tabular-nums">
                    <span className="flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                      {entry.recipe.minutes} {t('minutes')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Coins className="h-3.5 w-3.5 text-yellow-500" aria-hidden />
                      {t(`cost_${entry.recipe.cost_level}`)}
                    </span>
                    <span className="rounded-full bg-primary-50 px-2 py-0.5 font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                      {Math.round(entry.recipe.nutrition_per_serving.energy_kcal ?? 0)} {tu('kcal')}
                    </span>
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setSwapFor(swapFor === entry.id ? null : entry.id)}>
                  <ArrowRightLeft className="h-4 w-4" aria-hidden />
                  {t('swap')}
                </Button>
              </div>

              {swapFor === entry.id && (
                <div className="mt-3 max-h-56 space-y-1 overflow-y-auto rounded-xl surface-2 p-2">
                  <p className="px-2 py-1 text-xs font-bold text-muted">{t('swapTitle')}</p>
                  {recipes
                    .filter((r) => r.meal_type === slot)
                    .map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => replace(entry.id, r.id)}
                        className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-start text-sm hover:bg-primary-50 dark:hover:bg-primary-900/30"
                      >
                        <span className="truncate font-medium">{r.title}</span>
                        <span className="shrink-0 text-xs text-muted tabular-nums">
                          {Math.round(r.nutrition_per_serving.energy_kcal ?? 0)} {tu('kcal')}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <p className="flex items-center gap-2 rounded-2xl gradient-brand-soft p-3 text-xs font-medium ring-1 ring-teal-100 dark:ring-teal-900/40">
        <Info className="h-4 w-4 shrink-0 text-teal-600" aria-hidden />
        {t('estimateNote')} · {tc('serving')}: {weekStart}
      </p>

      <SectionTitle
        action={
          <Link href={`/${locale}/recipes`} className="text-sm font-bold text-primary-700 hover:underline dark:text-primary-300">
            {tc('seeAll')} · {tr('title')}
          </Link>
        }
      >
        {tr('title')}
      </SectionTitle>
    </div>
  );
}
