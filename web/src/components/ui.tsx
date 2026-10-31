'use client';

import clsx from 'clsx';
import { CheckCircle2, AlertTriangle, CircleAlert, OctagonX, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Verdict } from '@/lib/types';

// ---------- Layout primitives ----------

export function Card({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('surface rounded-[--radius-card] p-5 shadow-sm', className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-lg font-bold">{children}</h2>
      {action}
    </div>
  );
}

// ---------- Buttons & inputs ----------

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
};

export function Button({ variant = 'primary', size = 'md', className, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2.5',
        variant === 'primary' && 'bg-primary-800 text-white hover:bg-primary-700',
        variant === 'secondary' && 'bg-primary-50 text-primary-900 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-200 dark:hover:bg-primary-900/50',
        variant === 'ghost' && 'surface-2 text-[var(--text)] hover:opacity-80',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-500',
        className,
      )}
      {...rest}
    />
  );
}

export function Input({ label, error, hint, className, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium">{label}</span>}
      <input
        className={clsx(
          'surface-2 w-full rounded-xl border px-3 py-2.5 text-[var(--text)] placeholder:text-[var(--text-muted)] focus-visible:outline-none',
          error && 'border-red-400',
          className,
        )}
        style={{ borderColor: 'var(--border)' }}
        {...rest}
      />
      {error ? (
        <span className="mt-1 block text-sm text-red-500">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function Select({ label, className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium">{label}</span>}
      <select
        className={clsx('surface-2 w-full rounded-xl px-3 py-2.5 text-[var(--text)]', className)}
        style={{ borderColor: 'var(--border)' }}
        {...rest}
      >
        {children}
      </select>
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 py-2 text-start"
    >
      <span className="font-medium">{label}</span>
      <span
        className={clsx(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
            checked ? 'start-[22px]' : 'start-0.5',
          )}
        />
      </span>
    </button>
  );
}

// ---------- Verdict badge: icon + label + color, never color alone ----------

const VERDICT_STYLE: Record<Verdict, { bg: string; text: string; icon: React.ReactNode }> = {
  good: { bg: 'bg-[var(--color-good-soft)] dark:bg-green-900/40', text: 'text-green-800 dark:text-green-300', icon: <CheckCircle2 className="h-5 w-5" aria-hidden /> },
  acceptable: { bg: 'bg-[var(--color-ok-soft)] dark:bg-yellow-900/40', text: 'text-yellow-800 dark:text-yellow-300', icon: <Info className="h-5 w-5" aria-hidden /> },
  moderation: { bg: 'bg-[var(--color-moderate-soft)] dark:bg-orange-900/40', text: 'text-orange-800 dark:text-orange-300', icon: <AlertTriangle className="h-5 w-5" aria-hidden /> },
  not_recommended: { bg: 'bg-[var(--color-bad-soft)] dark:bg-red-900/40', text: 'text-red-800 dark:text-red-300', icon: <OctagonX className="h-5 w-5" aria-hidden /> },
};

export function VerdictBadge({ verdict, large = false }: { verdict: Verdict; large?: boolean }) {
  const t = useTranslations('verdicts');
  const s = VERDICT_STYLE[verdict];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-full font-bold',
        s.bg,
        s.text,
        large ? 'px-4 py-2 text-base' : 'px-3 py-1 text-sm',
      )}
    >
      {s.icon}
      {t(verdict)}
    </span>
  );
}

export function VerdictDot({ verdict }: { verdict: Verdict }) {
  const s = VERDICT_STYLE[verdict];
  return <span className={clsx('inline-flex h-2.5 w-2.5 rounded-full', verdict === 'good' ? 'bg-[var(--color-good)]' : verdict === 'acceptable' ? 'bg-[var(--color-ok)]' : verdict === 'moderation' ? 'bg-[var(--color-moderate)]' : 'bg-[var(--color-bad)]')} aria-hidden />;
}

// ---------- Feedback states ----------

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="loading"
      className={clsx(
        'inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-700 border-t-transparent',
        className,
      )}
    />
  );
}

export function LoadingBlock() {
  const t = useTranslations('common');
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-muted">
      <Spinner />
      <span>{t('loading')}</span>
    </div>
  );
}

export function ErrorBlock({ onRetry }: { onRetry?: () => void }) {
  const t = useTranslations('common');
  return (
    <Card className="text-center">
      <CircleAlert className="mx-auto mb-2 h-8 w-8 text-red-500" aria-hidden />
      <p className="mb-3">{t('error')}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {t('retry')}
        </Button>
      )}
    </Card>
  );
}

// ---------- Charts (dependency-free, RTL-safe) ----------

export function ProgressBar({
  value,
  target,
  label,
  unit,
  danger = 80,
}: {
  value: number;
  target: number;
  label: string;
  unit: string;
  danger?: number;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const over = target > 0 && value / target > danger / 100;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={clsx('tabular-nums', over ? 'font-bold text-red-500' : 'text-muted')}>
          {Math.round(value)} / {Math.round(target)} {unit}
        </span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full surface-2"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemax={Math.round(target)}
        aria-label={label}
      >
        <div
          className={clsx('h-full rounded-full transition-all', over ? 'bg-red-500' : 'bg-primary-600')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Donut ring for water/calorie progress. */
export function ProgressRing({
  pct,
  label,
  sub,
}: {
  pct: number;
  label: string;
  sub: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative grid h-28 w-28 place-items-center rounded-full"
        style={{
          background: `conic-gradient(var(--color-teal-500) ${clamped * 3.6}deg, var(--surface-2) 0deg)`,
        }}
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="surface grid h-[86px] w-[86px] place-items-center rounded-full border-0">
          <span className="text-xl font-extrabold tabular-nums">{Math.round(clamped)}%</span>
        </div>
      </div>
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-xs text-muted">{sub}</span>
    </div>
  );
}

/** Horizontal nutrient bar chart (macros today). */
export function NutrientBars({ items }: { items: { label: string; value: number; unit: string; max: number }[] }) {
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.label}>
          <ProgressBar value={it.value} target={it.max} label={it.label} unit={it.unit} />
        </li>
      ))}
    </ul>
  );
}
