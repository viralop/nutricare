'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import clsx from 'clsx';
import { Clock3, Coins } from 'lucide-react';
import { Card, ErrorBlock, LoadingBlock } from '@/components/ui';
import { apiData } from '@/lib/api';
import type { NutrientKey, Recipe } from '@/lib/types';

const FILTERS = ['all', 'breakfast', 'lunch', 'dinner', 'snack'] as const;

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const t = useTranslations('recipes');
  const tp = useTranslations('planner');
  const tc = useTranslations('common');
  const tu = useTranslations('units');
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

  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-extrabold leading-snug">{recipe.title}</h3>
        <span className="shrink-0 rounded-full bg-mint-50 px-2.5 py-0.5 text-xs font-bold text-teal-700 dark:bg-teal-900/30 dark:text-teal-200">
          {t(recipe.meal_type)}
        </span>
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted tabular-nums">
        <span className="flex items-center gap-1">
          <Clock3 className="h-3.5 w-3.5" aria-hidden />
          {recipe.minutes} min
        </span>
        <span className="flex items-center gap-1">
          <Coins className="h-3.5 w-3.5" aria-hidden />
          {tp(`cost_${recipe.cost_level}`)}
        </span>
        <span>{t('serves', { n: recipe.servings })}</span>
      </p>

      <ul className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        {rows.slice(0, 3).map(([key, unit]) => (
          <li key={key} className="surface-2 rounded-lg p-2">
            <span className="block font-bold tabular-nums">
              {Math.round(n[key] ?? 0)} {unit}
            </span>
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
              <p className="mb-1 text-sm font-bold">{t('ingredients')}</p>
              <ul className="list-inside list-disc text-sm">
                {detail.ingredients.map((ing, i) => (
                  <li key={i}>
                    {ing.name} — {ing.quantity_g} g{ing.note ? ` (${ing.note})` : ''}
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
            <p className="mb-1 text-sm font-bold">{t('nutritionPerServing')}</p>
            <ul className="grid grid-cols-3 gap-2 text-center text-xs">
              {rows.map(([key, unit]) => (
                <li key={key} className="surface-2 rounded-lg p-2 tabular-nums">
                  {Math.round(n[key] ?? 0)} {unit}
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
      <header>
        <h1 className="text-2xl font-extrabold">{t('title')}</h1>
        <p className="text-sm text-muted">{t('subtitle')}</p>
      </header>

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
