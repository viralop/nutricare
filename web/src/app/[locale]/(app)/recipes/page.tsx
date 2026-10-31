'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import clsx from 'clsx';
import { Clock3, Coins, UtensilsCrossed, Users } from 'lucide-react';
import { Card, Chip, ErrorBlock, LoadingBlock, PageHeader } from '@/components/ui';
import { apiData } from '@/lib/api';
import type { NutrientKey, Recipe } from '@/lib/types';

const FILTERS = ['all', 'breakfast', 'lunch', 'dinner', 'snack'] as const;

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const t = useTranslations('recipes');
  const tp = useTranslations('planner');
  const tc = useTranslations('common');
  const tu = useTranslations('units');
  const tn = useTranslations('nutrients');
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Recipe | null>(null);

  async function loadDetail() {
    setOpen(true);
    if (!detail) {
      setDetail(await apiData<Recipe>(`/recipes/${recipe.slug}`, { locale }));
    }
  }

  const n = recipe.nutrition_per_serving;
  const rows: [NutrientKey, string][] = [
    ['energy_kcal', tu('kcal')],
    ['carbohydrate_g', tu('g')],
    ['protein_g', tu('g')],
    ['sat_fat_g', tu('g')],
    ['sodium_mg', tu('mg')],
    ['fiber_g', tu('g')],
  ];

  // Total ingredient weight → what one serving actually weighs.
  const totalG = detail?.ingredients?.reduce((sum, ing) => sum + ing.quantity_g, 0) ?? null;
  const servingG = totalG !== null ? Math.round(totalG / Math.max(1, recipe.servings)) : null;

  return (
    <Card hover className="h-full">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-extrabold leading-snug">{recipe.title}</h3>
        <Chip tone="teal">{t(recipe.meal_type)}</Chip>
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted tabular-nums">
        <span className="flex items-center gap-1">
          <Clock3 className="h-3.5 w-3.5 text-amber-500" aria-hidden />
          {recipe.minutes} min
        </span>
        <span className="flex items-center gap-1">
          <Coins className="h-3.5 w-3.5 text-yellow-500" aria-hidden />
          {tp(`cost_${recipe.cost_level}`)}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-teal-500" aria-hidden />
          {t('serves', { n: recipe.servings })}
        </span>
      </p>

      <ul className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        {rows.slice(0, 3).map(([key, unit]) => (
          <li key={key} className="surface-2 rounded-xl p-2 ring-1 ring-[var(--border)]">
            <span className="block font-extrabold tabular-nums">
              {Math.round(n[key] ?? 0)} {unit}
            </span>
            <span className="mt-0.5 block text-[10px] font-semibold text-muted">{tn(key)}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => (open ? setOpen(false) : loadDetail())}
        className="mt-3 text-sm font-bold text-primary-700 hover:underline dark:text-primary-300"
        aria-expanded={open}
      >
        {open ? tc('close') : tc('view')}
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          {detail?.ingredients && (
            <div>
              <p className="mb-1 flex items-center justify-between text-sm font-bold">
                <span>{t('ingredients')}</span>
                {totalG !== null && (
                  <span className="text-xs font-semibold text-muted tabular-nums">
                    {t('totalWeight', { g: Math.round(totalG) })}
                  </span>
                )}
              </p>
              <ul className="list-inside list-disc text-sm">
                {detail.ingredients.map((ing, i) => (
                  <li key={i}>
                    <span className="font-semibold">{ing.name}</span> — {ing.quantity_g} {tu('g')}
                    {ing.note ? ` (${ing.note})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <p className="mb-1 text-sm font-bold">{t('steps')}</p>
            <ol className="list-inside list-decimal space-y-1 text-sm">
              {(detail?.steps ?? recipe.steps).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold">
              {t('nutritionPerServing')}
              {servingG !== null && (
                <span className="ms-1 font-semibold text-muted">
                  ({t('servingAbout', { g: servingG })})
                </span>
              )}
            </p>
            <ul className="grid grid-cols-3 gap-2 text-center text-xs">
              {rows.map(([key, unit]) => (
                <li key={key} className="surface-2 rounded-lg p-2 ring-1 ring-[var(--border)]">
                  <span className="block font-extrabold tabular-nums">
                    {Math.round(n[key] ?? 0)} {unit}
                  </span>
                  <span className="mt-0.5 block text-[10px] font-semibold text-muted">{tn(key)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function RecipesPage() {
  const t = useTranslations('recipes');
  const locale = useLocale();

  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');

  useEffect(() => {
    apiData<Recipe[]>('/recipes', { locale })
      .then(setRecipes)
      .catch(() => setError(true));
  }, [locale]);

  if (error) return <ErrorBlock onRetry={() => window.location.reload()} />;
  if (!recipes) return <LoadingBlock />;

  const shown = filter === 'all' ? recipes : recipes.filter((r) => r.meal_type === filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        icon={<UtensilsCrossed className="h-6 w-6" aria-hidden />}
      />

      <div className="flex flex-wrap gap-2" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={clsx(
              'rounded-full px-4 py-1.5 text-sm font-bold',
              filter === f ? 'bg-primary-800 text-white' : 'surface-2 text-[var(--text)]',
            )}
          >
            {f === 'all' ? t('filterAll') : t(f)}
          </button>
        ))}
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {shown.map((r) => (
          <li key={r.slug}>
            <RecipeCard recipe={r} />
          </li>
        ))}
      </ul>
    </div>
  );
}
