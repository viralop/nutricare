'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import clsx from 'clsx';
import {
  Search, ArrowRightLeft, BadgeCheck, TriangleAlert, CircleAlert,
  Plus, Check, Camera,
} from 'lucide-react';
import {
  Button, Card, ErrorBlock, LoadingBlock, SectionTitle, Select, VerdictBadge, VerdictDot,
} from '@/components/ui';
import { api, apiData, ApiError } from '@/lib/api';
import type { Analysis, Food, NutrientKey, Verdict } from '@/lib/types';
import { useAuth } from '@/lib/auth';

const NUTRIENT_ROWS: NutrientKey[] = [
  'energy_kcal', 'carbohydrate_g', 'sugar_g', 'protein_g', 'total_fat_g', 'sat_fat_g', 'sodium_mg', 'fiber_g',
];

function nutrientUnit(key: NutrientKey): string {
  return key === 'energy_kcal' ? 'kcal' : key === 'sodium_mg' ? 'mg' : 'g';
}

function fmt(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return String(Math.round(v * 10) / 10);
}

export default function AnalyzerPage() {
  const t = useTranslations('analyzer');
  const tn = useTranslations('nutrients');
  const tu = useTranslations('units');
  const tc = useTranslations('common');
  const tv = useTranslations('verdicts');
  const tp = useTranslations('planner');
  const { user } = useAuth();
  const locale = useLocale();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [basis, setBasis] = useState<'serving' | '100g'>('serving');

  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [comparison, setComparison] = useState<{ food: Food; assessment: { verdict: Verdict } }[] | null>(null);
  const [comparing, setComparing] = useState(false);

  const [added, setAdded] = useState(false);
  const [slot, setSlot] = useState('lunch');

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) return;
      setSearching(true);
      setSearchError(false);
      try {
        const res = await apiData<{ data: Food[] }>(`/foods?q=${encodeURIComponent(q.trim())}&per_page=12`, { locale });
        setResults(res.data ?? res);
      } catch {
        setSearchError(true);
      } finally {
        setSearching(false);
      }
    },
    [locale],
  );

  useEffect(() => {
    // Initial empty search shows the full catalog for browsing.
    apiData<{ data: Food[] }>(`/foods?per_page=12`, { locale })
      .then((res) => setResults(res.data ?? res))
      .catch(() => setSearchError(true));
  }, [locale]);

  async function analyze(slug: string) {
    setAnalyzing(true);
    setAdded(false);
    try {
      const res = await apiData<Analysis>('/foods/analyze', {
        method: 'POST',
        body: JSON.stringify({ slug }),
        locale,
      });
      setAnalysis(res);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setAnalyzing(false);
    }
  }

  async function runCompare() {
    if (!compareA || !compareB || compareA === compareB) return;
    setComparing(true);
    try {
      const res = await apiData<{ food: Food; assessment: { verdict: Verdict } }[]>('/foods/compare', {
        method: 'POST',
        body: JSON.stringify({ slugs: [compareA, compareB] }),
        locale,
      });
      setComparison(res);
    } finally {
      setComparing(false);
    }
  }

  async function addToToday() {
    if (!analysis) return;
    try {
      await api('/meal-logs', {
        method: 'POST',
        body: JSON.stringify({ food_id: analysis.food.id, meal_slot: slot }),
      });
      setAdded(true);
    } catch {
      setAdded(false);
    }
  }

  const nutrientBasis = useMemo(() => (basis === 'serving' ? analysis?.food.per_serving : analysis?.food.per_100g), [analysis, basis]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold">{t('title')}</h1>
        <p className="text-sm text-muted">{t('subtitle')}</p>
      </header>

      {!user && (
        <p className="rounded-xl bg-mint-50 p-3 text-sm text-teal-700 dark:bg-teal-900/30 dark:text-teal-200">
          <CircleAlert className="inline h-4 w-4 me-1" aria-hidden />
          {t('guestNote')}
        </p>
      )}

      {/* Search */}
      <Card>
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            search(query);
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-muted ltr:left-3 rtl:right-3" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={tc('search')}
              className="surface-2 w-full rounded-xl py-2.5 ps-10 pe-3 focus-visible:outline-none"
              style={{ borderColor: 'var(--border)' }}
            />
          </div>
          <Button type="submit" disabled={searching}>
            <Search className="h-4 w-4" aria-hidden />
            {tc('search')}
          </Button>
        </form>
      </Card>

      {/* Analysis result */}
      {(analysis || analyzing) && (
        <Card>
          {analyzing || !analysis ? (
            <LoadingBlock />
          ) : (
            <div className="space-y-5">
              {/* Food header + verdict */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-mint-50 text-3xl dark:bg-teal-900/30" aria-hidden>
                    {analysis.food.emoji}
                  </span>
                  <div>
                    <h2 className="text-xl font-extrabold">{analysis.food.name}</h2>
                    <p className="text-sm text-muted">
                      {tc('serving')}: {analysis.food.serving_label} ({fmt(analysis.food.serving_size_g)} g)
                    </p>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold text-muted">{tv('label')}</p>
                  <VerdictBadge verdict={analysis.assessment.verdict} large />
                </div>
              </div>

              {/* Data confidence */}
              <p
                className={clsx(
                  'rounded-xl p-3 text-sm',
                  analysis.food.source.is_estimated
                    ? 'bg-orange-50 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
                    : 'bg-mint-50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200',
                )}
              >
                {analysis.food.source.is_estimated ? (
                  <>
                    <TriangleAlert className="inline h-4 w-4 me-1" aria-hidden />
                    {t('estimatedNote')}
                  </>
                ) : (
                  <>
                    <BadgeCheck className="inline h-4 w-4 me-1" aria-hidden />
                    {t('verifiedNote')}
                  </>
                )}
                <span className="ms-2 opacity-80">
                  ({t(`source_${analysis.food.source.type}`)} · {analysis.food.source.reference})
                </span>
              </p>

              {/* Nutrition facts — database values */}
              <div>
                <SectionTitle
                  action={
                    <div className="flex rounded-xl surface-2 p-1 text-sm">
                      {(['serving', '100g'] as const).map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setBasis(b)}
                          aria-pressed={basis === b}
                          className={clsx('rounded-lg px-3 py-1 font-semibold', basis === b ? 'bg-primary-800 text-white' : 'text-muted')}
                        >
                          {b === 'serving' ? tc('perServing') : tc('per100g')}
                        </button>
                      ))}
                    </div>
                  }
                >
                  {t('nutritionFacts')}
                </SectionTitle>
                <ul className="grid grid-cols-2 gap-x-6 sm:grid-cols-4">
                  {NUTRIENT_ROWS.map((key) => (
                    <li key={key} className="border-b py-2.5 border-app" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-xs text-muted">{tn(key)}</p>
                      <p className="text-lg font-bold tabular-nums">
                        {nutrientBasis?.[key] === null || nutrientBasis?.[key] === undefined ? (
                          <span title={t('noDataNote')} className="text-muted">— {t('noDataNote')}</span>
                        ) : (
                          <>
                            {fmt(nutrientBasis?.[key])} <span className="text-xs font-normal text-muted">{tu(nutrientUnit(key))}</span>
                          </>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Per-condition reasons */}
              <div>
                <SectionTitle>{t('whyVerdict')}</SectionTitle>
                <div className="grid gap-3 md:grid-cols-2">
                  {analysis.assessment.assessments.map((a) => (
                    <div key={a.condition} className="surface-2 rounded-xl p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="font-bold">{a.condition_name}</p>
                        <span className="flex items-center gap-1.5 text-sm font-semibold">
                          <VerdictDot verdict={a.verdict} />
                          {tv(a.verdict)}
                        </span>
                      </div>
                      <ul className="list-inside list-disc space-y-1.5 text-sm leading-relaxed text-[var(--text)]">
                        {a.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                      {a.warnings?.map((w, i) => (
                        <p key={i} role="alert" className="mt-2 rounded-lg bg-red-50 p-2 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
                          <CircleAlert className="inline h-4 w-4 me-1" aria-hidden />
                          {w}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
                {analysis.assessment.warnings.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1 flex items-center gap-1.5 text-sm font-bold text-red-600">
                      <TriangleAlert className="h-4 w-4" aria-hidden />
                      {t('warnings')}
                    </p>
                    <ul className="list-inside list-disc text-sm text-red-700 dark:text-red-300">
                      {analysis.assessment.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Alternatives */}
              <div>
                <SectionTitle>{t('alternatives')}</SectionTitle>
                {analysis.alternatives.length === 0 ? (
                  <p className="text-sm text-muted">{t('noAlternatives')}</p>
                ) : (
                  <ul className="grid gap-3 md:grid-cols-2">
                    {analysis.alternatives.map((alt) => (
                      <li key={alt.food.slug} className="surface-2 rounded-xl p-4">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-2xl" aria-hidden>{alt.food.emoji}</span>
                          <div>
                            <p className="font-bold">{alt.food.name}</p>
                            <p className="text-xs text-muted">
                              {fmt(alt.food.per_serving.energy_kcal)} {tu('kcal')} {tc('perServing')}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed">
                          <span className="font-semibold">{t('swapWhy')}: </span>
                          {alt.reason}
                        </p>
                        {alt.suggested_serving && (
                          <p className="mt-1 text-xs text-muted">
                            {t('suggestedServing')}: {alt.suggested_serving}
                          </p>
                        )}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-xs text-muted tabular-nums" dir="ltr">
                            {alt.delta.energy_kcal !== undefined && (
                              <>Δ {tu('kcal')}: {alt.delta.energy_kcal > 0 ? '+' : ''}{fmt(alt.delta.energy_kcal)} </>
                            )}
                            {alt.delta.sodium_mg !== undefined && (
                              <>Δ {tu('mg')}: {alt.delta.sodium_mg > 0 ? '+' : ''}{fmt(alt.delta.sodium_mg)}</>
                            )}
                          </span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => analyze(alt.food.slug)}>
                              {tc('view')}
                            </Button>
                            {user && (
                              <Button size="sm" variant="ghost" aria-label={tc('compare')} onClick={() => setCompareB(alt.food.slug)}>
                                <ArrowRightLeft className="h-4 w-4" aria-hidden />
                              </Button>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Add to today */}
              {user && (
                <div className="flex flex-wrap items-end gap-3 rounded-xl surface-2 p-4">
                  <div className="min-w-40">
                    <Select label={t('chooseSlot')} value={slot} onChange={(e) => setSlot(e.target.value)}>
                      <option value="breakfast">{tp('breakfast')}</option>
                      <option value="lunch">{tp('lunch')}</option>
                      <option value="dinner">{tp('dinner')}</option>
                      <option value="snack">{tp('snack')}</option>
                    </Select>
                  </div>
                  <Button onClick={addToToday}>
                    {added ? <Check className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
                    {added ? t('added') : t('addToDay')}
                  </Button>
                </div>
              )}

              <p className="text-xs text-muted">{analysis.disclaimer}</p>
            </div>
          )}
        </Card>
      )}

      {/* Compare */}
      <Card>
        <SectionTitle>{t('compareTitle')}</SectionTitle>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Select
              label={`A — ${t('comparePick')}`}
              value={compareA ?? analysis?.food.slug ?? ''}
              onChange={(e) => setCompareA(e.target.value)}
            >
              {(results ?? []).map((f) => (
                <option key={f.slug} value={f.slug}>{f.name}</option>
              ))}
            </Select>
          </div>
          <div className="flex-1">
            <Select label="B" value={compareB ?? ''} onChange={(e) => setCompareB(e.target.value)}>
              <option value="">—</option>
              {(results ?? []).map((f) => (
                <option key={f.slug} value={f.slug}>{f.name}</option>
              ))}
            </Select>
          </div>
          <Button variant="secondary" disabled={!compareA || !compareB || comparing} onClick={runCompare}>
            <ArrowRightLeft className="h-4 w-4" aria-hidden />
            {tc('compare')}
          </Button>
        </div>

        {comparing && <LoadingBlock />}
        {comparison && !comparing && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-md text-sm">
              <thead>
                <tr className="text-start">
                  <th className="p-2 text-start">—</th>
                  {comparison.map((c) => (
                    <th key={c.food.slug} className="p-2 text-start">
                      <span className="me-1" aria-hidden>{c.food.emoji}</span>
                      {c.food.name}
                      <span className="ms-2 block text-xs font-normal">
                        <VerdictDot verdict={c.assessment.verdict} /> {tv(c.assessment.verdict)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 font-semibold">{tc('serving')}</td>
                  {comparison.map((c) => (
                    <td key={c.food.slug} className="p-2">
                      {c.food.serving_label} ({fmt(c.food.serving_size_g)} g)
                    </td>
                  ))}
                </tr>
                {NUTRIENT_ROWS.map((key) => (
                  <tr key={key} className="border-t border-app" style={{ borderColor: 'var(--border)' }}>
                    <td className="p-2 font-semibold">{tn(key)}</td>
                    {comparison.map((c) => (
                      <td key={c.food.slug} className="p-2 tabular-nums">
                        {fmt(c.food.per_serving[key])} {tu(nutrientUnit(key))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Photo analysis — deferred with the AI provider */}
      <Card className="opacity-80">
        <p className="flex items-center gap-2 font-bold">
          <Camera className="h-5 w-5" aria-hidden />
          {t('imageTab')}
        </p>
        <p className="mt-1 text-sm text-muted">{t('imageComingSoon')}</p>
      </Card>

      {/* Results list */}
      {results !== null && results.length > 0 && (
        <div>
          <SectionTitle>
            {results.length} {tc('results')}
          </SectionTitle>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((food) => (
              <li key={food.slug}>
                <button
                  type="button"
                  onClick={() => analyze(food.slug)}
                  className="surface h-full w-full rounded-xl p-3 text-start transition-transform hover:-translate-y-0.5"
                >
                  <span className="mb-1 block text-3xl" aria-hidden>{food.emoji}</span>
                  <span className="block font-bold leading-snug">{food.name}</span>
                  <span className="mt-1 block text-xs text-muted tabular-nums">
                    {fmt(food.per_serving.energy_kcal)} {tu('kcal')} · {fmt(food.per_serving.sugar_g)} {tu('g')} {tn('sugar_g')}
                  </span>
                  {food.source.is_estimated && (
                    <span className="mt-1 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" title={t('estimatedNote')}>
                      ~
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
