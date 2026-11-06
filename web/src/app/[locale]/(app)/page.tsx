'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Droplets, Plus, Trash2, ScanSearch, Search, UtensilsCrossed,
} from 'lucide-react';
import {
  Button, Card, ErrorBlock, FoodImage, LoadingBlock, SectionTitle, VerdictDot,
} from '@/components/ui';
import { api, apiData } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { DashboardSummary } from '@/lib/types';


export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tu = useTranslations('units');
  const tc = useTranslations('common');
  const tp = useTranslations('planner');
  const { user } = useAuth();
  const locale = useLocale();
  const dateTag = new Date().toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', day: 'numeric' });

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

  const energy = Math.round(summary.totals.energy_kcal ?? 0);
  const energyTarget = Math.round(summary.targets.energy_kcal);
  const energyLeft = Math.max(0, energyTarget - energy);
  const energySteps = Math.max(8, Math.min(24, Math.round(energyTarget / 100)));
  const takenSteps = Math.min(energySteps, Math.round(energy / energyTarget * energySteps));

  const waterPct = Math.min(1, summary.water_ml / summary.targets.water_ml);
  const waterSteps = 8;
  const waterTaken = Math.round(waterPct * waterSteps);

  return (
    <div className="space-y-4">
      {/* Patient label */}
      <Card className="anim-fade-up">
        <div className="flex items-baseline justify-between gap-2 border-b pb-2" style={{ borderColor: 'var(--border-soft)' }}>
          <h1 className="font-display truncate text-xl font-normal">{greeting}</h1>
          <span className="font-mono-dose shrink-0 text-[10px] tracking-widest text-muted uppercase" dir="ltr">
            {dateTag}
          </span>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {user.conditions.slice(0, 4).map((c) => (
            <span key={c.slug} className="rounded-full border px-2.5 py-0.5 text-[11px] font-bold" style={{ borderColor: 'var(--border)' }}>
              {c.name}
            </span>
          ))}
        </div>
      </Card>

      {/* Today's doses */}
      <Card className="anim-fade-up">
        <div className="flex items-baseline justify-between gap-2 border-b pb-2" style={{ borderColor: 'var(--border-soft)' }}>
          <h2 className="font-display text-base font-normal">{t('dosesTitle')}</h2>
          <span className="text-[10px] tracking-widest text-muted uppercase">{t('patientTag')}</span>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-[13px] font-bold">{t('energyDose', { n: energyTarget })}</span>
          <span className="font-mono-dose text-xs font-semibold">
            {energy} {tc('takenWord')} · {energyLeft} {tc('leftWord')}
          </span>
        </div>
        <div className="dose-scale mt-2.5" role="img" aria-label={`${energy} of ${energyTarget} kcal`}>
          {Array.from({ length: energySteps }, (_, i) => (
            <span key={i} className={`dose-step ${i < takenSteps ? (takenSteps >= energySteps * 0.85 ? 'warn' : 'take') : ''}`} />
          ))}
        </div>
        <div className="font-mono-dose mt-1.5 flex justify-between text-[9.5px] text-muted">
          <span>0</span><span>{t('divideNote')}</span><span>{energyTarget}</span>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <span
            key={waterBeat}
            className={`relative block h-[76px] w-[46px] overflow-hidden rounded-xl border-[1.5px] ${waterBeat > 0 ? 'water-pulse' : ''}`}
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            role="img"
            aria-label={`${t('water')} ${summary.water_ml} of ${summary.targets.water_ml} ml`}
          >
            <span aria-hidden className="absolute left-1/2 top-[-1px] h-[9px] w-[20px] -translate-x-1/2 rounded-t-sm" style={{ background: 'var(--ink)' }} />
            <span aria-hidden className="absolute inset-x-0 bottom-0" style={{ height: `${waterPct * 100}%`, background: 'rgb(183 84 27 / 0.72)' }} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold">{t('waterDose', { n: summary.targets.water_ml })}</div>
            <div className="font-mono-dose mt-0.5 text-xs">{summary.water_ml} ml · {t('ofDose', { pct: Math.round(waterPct * 100) })}</div>
            <div className="dose-scale mt-2">
              {Array.from({ length: waterSteps }, (_, i) => (
                <span key={i} className={`dose-step h-[16px] ${i < waterTaken ? 'take' : ''}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {[250, 500].map((ml) => (
            <Button key={ml} variant="ghost" size="sm" disabled={busyWater} onClick={() => addWater(ml)} className="font-mono-dose !py-2.5">
              <Plus className="h-4 w-4" aria-hidden />
              {t('takeGlass', { ml })}
            </Button>
          ))}
        </div>
      </Card>

      {/* Meals taken */}
      <Card className="anim-fade-up">
        <div className="mb-1 flex items-baseline justify-between gap-2 border-b pb-2" style={{ borderColor: 'var(--border-soft)' }}>
          <h2 className="font-display text-base font-normal">{t('mealsTaken')}</h2>
          <Link href={`/${locale}/analyzer`} className="text-xs font-bold text-primary-600 hover:underline dark:text-primary-300">
            + {tc('add')}
          </Link>
        </div>
        {summary.meals.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-500/10 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
              <UtensilsCrossed className="h-6 w-6" aria-hidden />
            </span>
            <p className="max-w-xs text-sm text-muted">{t('noMeals')}</p>
          </div>
        ) : (
          <ul>
            {summary.meals.map((m) => {
              const stampOk = (m.food.per_serving.sugar_g ?? 0) < 8;
              return (
                <li key={m.id} className="group flex items-center gap-3 border-b border-dashed py-3 last:border-b-0" style={{ borderColor: 'var(--border-soft)' }}>
                  <FoodImage food={m.food} className="h-9 w-9 rounded-lg" emojiClass="text-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold">{m.food.name}</p>
                    <p className="font-mono-dose text-[11px] text-muted">
                      {Math.round((m.food.per_serving.energy_kcal ?? 0) * m.quantity_servings)} {tu('kcal')} · {tp(m.slot)}
                    </p>
                  </div>
                  <span className={`stamp ${stampOk ? 'stamp-ok' : 'stamp-warn'} shrink-0`}>{stampOk ? tc('takenWord') : tc('cautionWord')}</span>
                  <button
                    type="button"
                    aria-label={`${tc('delete')} ${m.food.name}`}
                    onClick={() => removeMeal(m.id)}
                    className="rounded-lg p-1.5 text-[#a93226] opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Within-dose tiles */}
      <div className="grid grid-cols-3 gap-2.5">
        {([
          [t('sugar'), `0 ${tu('g')}`, `50 ${tu('g')}`, 'withinDose'],
          [t('sodium'), `0 ${tu('mg')}`, `2,300 ${tu('mg')}`, 'withinDose'],
          [t('veg'), '3 / 5', '', 'portions'],
        ] as const).map(([label, value, limit, kind]) => (
          <div key={label} className="surface-2 border p-2.5 text-[10.5px] text-muted" style={{ borderColor: 'var(--border-soft)' }} dir="ltr">
            {label}
            <b className="font-mono-dose mt-0.5 block text-sm" style={{ color: 'var(--ink)' }}>{value}</b>
            {limit ? <span>{t('ofLimit', { n: limit })} — <span className="font-bold text-[#1d5b3f]">{t(kind === 'withinDose' ? 'withinDose' : 'portionsTaken')}</span></span> : null}
          </div>
        ))}
      </div>

      {/* Pharmacist's note */}
      <Card className="anim-fade-up">
        <SectionTitle>{t('pharmNoteTitle')}</SectionTitle>
        <ul className="space-y-2.5">
          {summary.recommendations.slice(0, 3).map((r, i) => (
            <li key={i} className="surface-2 border p-3 text-[13px] italic leading-relaxed" style={{ borderColor: 'var(--border-soft)', color: 'var(--ink)' }} dir="auto">
              {r}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2.5">
          <Link href={`/${locale}/analyzer`} className="flex flex-1 items-center justify-center gap-2 rounded-[9px] py-3 text-[13px] font-bold text-[#f5efe0]" style={{ background: '#1d5b3f' }}>
            <ScanSearch className="h-4 w-4" aria-hidden />
            {t('analyzeFood')}
          </Link>
          <Link href={`/${locale}/assistant`} className="flex flex-1 items-center justify-center gap-2 rounded-[9px] border-[1.5px] py-3 text-[13px] font-bold" style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}>
            <Droplets className="h-4 w-4" aria-hidden />
            {t('askPharmacist')}
          </Link>
        </div>
      </Card>

      {/* Recently analyzed */}
      {summary.recent_analyses.length > 0 && (
        <Card className="anim-fade-up">
          <SectionTitle
            action={<span className="text-[10px] tracking-widest text-muted uppercase">{t('history')}</span>}
          >
            {t('recentlyAnalyzed')}
          </SectionTitle>
          <ul className="flex flex-wrap gap-2">
            {summary.recent_analyses.map((a, i) => (
              <li key={`${a.food.slug}-${i}`}>
                <Link
                  href={`/${locale}/analyzer?food=${a.food.slug}`}
                  className="surface-2 flex items-center gap-2 rounded-full py-1.5 pe-3 ps-1.5 text-[13px] font-bold"
                  style={{ borderColor: 'var(--border-soft)' }}
                >
                  <FoodImage food={a.food} className="h-7 w-7 rounded-full" emojiClass="text-sm" />
                  {a.food.name}
                  <VerdictDot verdict={a.verdict} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Hidden a11y search anchor for screen readers */}
      <span className="sr-only"><Search aria-hidden />{tc('search')}</span>
    </div>
  );
}
