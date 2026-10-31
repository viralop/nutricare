'use client';

import clsx from 'clsx';
import { CheckCircle2, AlertTriangle, CircleAlert, OctagonX, Info, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Verdict } from '@/lib/types';

// ---------- Layout primitives ----------

export function Card({
  children,
  className,
  hover = false,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={clsx('surface rounded-2xl p-5', hover && 'card-hover', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="font-display flex items-center gap-2.5 text-lg font-extrabold">
        <span className="h-5 w-1.5 rounded-full gradient-gold" aria-hidden />
        {children}
      </h2>
      {action}
    </div>
  );
}

/** Decorative page header: petrol gradient, gold hairline, display serif. */
export function PageHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header className="anim-fade-up relative overflow-hidden rounded-2xl gradient-brand border-b-[3px] border-gold-400 p-5 text-white shadow-lg">
      <div className="pattern-dots absolute inset-0 opacity-50" aria-hidden />
      <div aria-hidden className="absolute -bottom-10 -end-10 h-36 w-36 rounded-full bg-gold-400/15 blur-2xl" />
      <div className="relative flex items-center gap-4">
        {icon && (
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/12 ring-1 ring-gold-300/40 backdrop-blur-sm">
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-display truncate text-2xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-white/80">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}

// ---------- Buttons & inputs ----------

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ variant = 'primary', size = 'md', className, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2.5',
        size === 'lg' && 'px-6 py-3 text-base',
        variant === 'primary' &&
          'gradient-brand text-white shadow-md hover:shadow-lg hover:shadow-gold-500/25 hover:brightness-110',
        variant === 'secondary' &&
          'bg-primary-50 text-primary-900 ring-1 ring-primary-200 hover:bg-primary-100 dark:bg-primary-900/25 dark:text-primary-200 dark:ring-primary-800',
        variant === 'ghost' && 'surface-2 text-[var(--text)] ring-1 ring-[var(--border)] hover:brightness-95 dark:hover:brightness-110',
        variant === 'danger' && 'bg-gradient-to-br from-red-600 to-red-500 text-white shadow-md hover:brightness-110',
        className,
      )}
      {...rest}
    />
  );
}

export function Input({ label, error, hint, className, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-semibold">{label}</span>}
      <input
        className={clsx(
          'surface-2 w-full rounded-xl border px-3 py-2.5 text-[var(--text)] placeholder:text-[var(--text-muted)] transition-shadow focus-visible:outline-none',
          error ? 'border-red-400' : 'border-[var(--border)]',
          className,
        )}
        {...rest}
      />
      {error ? (
        <span className="mt-1 block text-sm font-medium text-red-500">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function Select({ label, className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-semibold">{label}</span>}
      <select
        className={clsx('surface-2 w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-[var(--text)]', className)}
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
      className="flex w-full items-center justify-between gap-4 py-2.5 text-start"
    >
      <span className="font-semibold">{label}</span>
      <span
        className={clsx(
          'relative h-6 w-11 shrink-0 rounded-full transition-all',
          checked ? 'gradient-brand shadow-inner' : 'bg-slate-300 dark:bg-slate-600',
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

/** Small rounded label chip. tone maps to a colored bg/text pair. */
export function Chip({
  tone = 'brand',
  children,
  className,
}: {
  tone?: 'brand' | 'teal' | 'good' | 'warn' | 'bad' | 'neutral';
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    brand: 'bg-primary-50 text-primary-800 ring-primary-200 dark:bg-primary-900/30 dark:text-primary-200 dark:ring-primary-800',
    teal: 'bg-mint-50 text-teal-700 ring-teal-200 dark:bg-teal-900/30 dark:text-teal-200 dark:ring-teal-800',
    good: 'bg-[var(--color-good-soft)] text-green-800 ring-green-200 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-800',
    warn: 'bg-[var(--color-moderate-soft)] text-orange-800 ring-orange-200 dark:bg-orange-900/30 dark:text-orange-200 dark:ring-orange-800',
    bad: 'bg-[var(--color-bad-soft)] text-red-800 ring-red-200 dark:bg-red-900/30 dark:text-red-200 dark:ring-red-800',
    neutral: 'surface-2 text-[var(--text-muted)] ring-[var(--border)]',
  } as const;
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ---------- Verdict badge: icon + label + color, never color alone ----------

const VERDICT_STYLE: Record<Verdict, { cls: string; icon: React.ReactNode }> = {
  good: { cls: 'bg-gradient-to-br from-green-100 to-emerald-50 text-green-800 ring-1 ring-green-300 dark:from-green-900/50 dark:to-emerald-900/30 dark:text-green-300 dark:ring-green-700', icon: <CheckCircle2 className="h-5 w-5" aria-hidden /> },
  acceptable: { cls: 'bg-gradient-to-br from-yellow-100 to-amber-50 text-yellow-800 ring-1 ring-yellow-300 dark:from-yellow-900/40 dark:to-amber-900/20 dark:text-yellow-200 dark:ring-yellow-700', icon: <Info className="h-5 w-5" aria-hidden /> },
  moderation: { cls: 'bg-gradient-to-br from-orange-100 to-amber-50 text-orange-800 ring-1 ring-orange-300 dark:from-orange-900/50 dark:to-amber-900/25 dark:text-orange-200 dark:ring-orange-700', icon: <AlertTriangle className="h-5 w-5" aria-hidden /> },
  not_recommended: { cls: 'bg-gradient-to-br from-red-100 to-rose-50 text-red-800 ring-1 ring-red-300 dark:from-red-900/50 dark:to-rose-900/30 dark:text-red-200 dark:ring-red-700', icon: <OctagonX className="h-5 w-5" aria-hidden /> },
};

export function VerdictBadge({ verdict, large = false }: { verdict: Verdict; large?: boolean }) {
  const t = useTranslations('verdicts');
  const s = VERDICT_STYLE[verdict];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-full font-bold shadow-sm',
        s.cls,
        large ? 'px-5 py-2.5 text-base' : 'px-3 py-1 text-sm',
      )}
    >
      {s.icon}
      {t(verdict)}
    </span>
  );
}

/** Big gradient hero banner for the analyzer verdict. */
export function VerdictBanner({ verdict, label }: { verdict: Verdict; label: string }) {
  const t = useTranslations('verdicts');
  const s = VERDICT_STYLE[verdict];
  return (
    <div className={clsx('relative overflow-hidden rounded-2xl p-5 shadow-md', s.cls)}>
      <div className="pattern-dots absolute inset-0 opacity-40" aria-hidden />
      <div className="relative flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/40 dark:bg-black/20">
          {s.icon}
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide opacity-80">{label}</p>
          <p className="text-xl font-extrabold">{t(verdict)}</p>
        </div>
      </div>
    </div>
  );
}

export function VerdictDot({ verdict }: { verdict: Verdict }) {
  const color =
    verdict === 'good' ? 'bg-[var(--color-good)]'
    : verdict === 'acceptable' ? 'bg-[var(--color-ok)]'
    : verdict === 'moderation' ? 'bg-[var(--color-moderate)]'
    : 'bg-[var(--color-bad)]';
  return <span className={clsx('inline-flex h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-black/40', color)} aria-hidden />;
}

// ---------- Feedback states ----------

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="loading"
      className={clsx('inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent', className)}
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
      <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-red-50 dark:bg-red-900/30">
        <CircleAlert className="h-7 w-7 text-red-500" aria-hidden />
      </span>
      <p className="mb-4 font-semibold">{t('error')}</p>
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
  tone = 'brand',
}: {
  value: number;
  target: number;
  label: string;
  unit: string;
  danger?: number;
  tone?: 'brand' | 'teal' | 'rose' | 'amber' | 'violet';
}) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const over = target > 0 && value / target > danger / 100;
  const tones = {
    brand: 'from-primary-600 to-primary-400',
    teal: 'from-teal-600 to-mint-300',
    rose: 'from-rose-500 to-pink-400',
    amber: 'from-amber-500 to-yellow-400',
    violet: 'from-violet-500 to-fuchsia-400',
  } as const;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className={clsx('tabular-nums', over ? 'font-extrabold text-red-500' : 'text-muted')}>
          {Math.round(value)} / {Math.round(target)} {unit}
        </span>
      </div>
      <div
        className="h-3 w-full overflow-hidden rounded-full surface-2 ring-1 ring-inset ring-[var(--border)]"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemax={Math.round(target)}
        aria-label={label}
      >
        <div
          className={clsx(
            'h-full rounded-full bg-gradient-to-r transition-all duration-500',
            over ? 'from-red-500 to-rose-400' : tones[tone],
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Donut ring with gradient track and glow — water/calorie progress. */
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
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative grid h-28 w-28 place-items-center rounded-full shadow-inner"
        style={{
          background: `conic-gradient(#c98f2e 0deg, #0e5045 ${clamped * 3.6}deg, var(--surface-2) ${clamped * 3.6}deg)`,
        }}
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="grid h-[88px] w-[88px] place-items-center rounded-full shadow"
          style={{ background: 'var(--surface)' }}
        >
          <span className="font-display bg-gradient-to-br from-primary-800 to-gold-500 bg-clip-text text-xl font-extrabold tabular-nums text-transparent">
            {Math.round(clamped)}%
          </span>
        </div>
      </div>
      <span className="text-sm font-bold">{label}</span>
      <span className="text-xs text-muted tabular-nums">{sub}</span>
    </div>
  );
}

/** Compact gradient stat tile with icon — dashboard/admin grids. */
export function StatTile({
  label,
  value,
  icon,
  tone = 'brand',
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  tone?: 'brand' | 'gold' | 'teal' | 'amber' | 'rose' | 'violet' | 'sky';
}) {
  const tones = {
    brand: 'from-primary-800 to-teal-500',
    gold: 'from-gold-400 to-gold-600',
    teal: 'from-teal-600 to-primary-400',
    amber: 'from-amber-500 to-yellow-400',
    rose: 'from-rose-500 to-pink-400',
    violet: 'from-violet-500 to-fuchsia-400',
    sky: 'from-sky-500 to-cyan-400',
  } as const;
  return (
    <div className="surface-2 relative overflow-hidden rounded-2xl p-4 ring-1 ring-[var(--border)]">
      <div className={clsx('absolute -top-8 -end-8 h-20 w-20 rounded-full bg-gradient-to-br opacity-15 blur-xl', tones[tone])} aria-hidden />
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted">{label}</p>
          <p className="font-display mt-0.5 truncate text-2xl font-extrabold tabular-nums">{value}</p>
        </div>
        {icon && (
          <span className={clsx('grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md', tones[tone])}>
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}

/** Decorative empty-state block. */
export function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <span className="anim-float text-4xl" aria-hidden>
        {emoji}
      </span>
      <p className="max-w-xs text-sm text-muted">{text}</p>
    </div>
  );
}

export { Sparkles };
