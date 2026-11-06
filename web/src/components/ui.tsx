'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { CheckCircle2, AlertTriangle, CircleAlert, OctagonX, Info, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Food, Verdict } from '@/lib/types';

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
      <h2 className="text-base font-extrabold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}

/** Typographic page header: tinted icon chip, bold title, hairline. No banner. */
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
    <header className="anim-fade-up flex items-center gap-3 border-b border-[var(--border)] pb-3.5">
      {icon && (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-500/10 text-primary-600 ring-1 ring-primary-500/15 dark:bg-primary-500/15 dark:text-primary-400 dark:ring-primary-500/20">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="font-display truncate text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm leading-snug text-muted">{subtitle}</p>}
      </div>
      {action}
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
          'bg-primary-500 text-white shadow-sm hover:bg-primary-700 hover:scale-[1.02]',
        variant === 'secondary' &&
          'bg-transparent text-primary-700 ring-1.5 ring-primary-500 hover:bg-primary-50 dark:text-primary-300 dark:ring-primary-500/60 dark:hover:bg-primary-500/10',
        variant === 'ghost' && 'surface-2 text-[var(--text)] ring-1 ring-[var(--border)] hover:brightness-95 dark:hover:brightness-110',
        variant === 'danger' && 'bg-red-600 text-white shadow-sm hover:bg-red-500',
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
          'surface-2 w-full rounded-xl border px-3.5 py-3.5 text-[var(--text)] placeholder:text-[var(--text-muted)] transition-shadow focus-visible:border-primary-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/20',
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
        className={clsx('surface-2 w-full rounded-xl border border-[var(--border)] px-3.5 py-3.5 text-[var(--text)] focus-visible:border-primary-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/20', className)}
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
  good: { cls: 'bg-green-100 text-green-700 ring-1 ring-green-300 dark:bg-green-900/40 dark:text-green-300 dark:ring-green-800', icon: <CheckCircle2 className="h-5 w-5" aria-hidden /> },
  acceptable: { cls: 'bg-sky-100 text-sky-700 ring-1 ring-sky-300 dark:bg-sky-900/40 dark:text-sky-300 dark:ring-sky-800', icon: <Info className="h-5 w-5" aria-hidden /> },
  moderation: { cls: 'bg-amber-100 text-amber-700 ring-1 ring-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-800', icon: <AlertTriangle className="h-5 w-5" aria-hidden /> },
  not_recommended: { cls: 'bg-red-100 text-red-700 ring-1 ring-red-300 dark:bg-red-900/40 dark:text-red-300 dark:ring-red-800', icon: <OctagonX className="h-5 w-5" aria-hidden /> },
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

/** Verdict banner: functional color block with icon — no decoration. */
export function VerdictBanner({ verdict, label }: { verdict: Verdict; label: string }) {
  const t = useTranslations('verdicts');
  const s = VERDICT_STYLE[verdict];
  return (
    <div className={clsx('flex items-center gap-4 rounded-xl p-4', s.cls)}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white/50 dark:bg-black/20">
        {s.icon}
      </span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">{label}</p>
        <p className="text-lg font-extrabold">{t(verdict)}</p>
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
    brand: 'bg-primary-700',
    teal: 'bg-teal-600',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    violet: 'bg-violet-500',
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
        className="h-2 w-full overflow-hidden rounded-full surface-2 ring-1 ring-inset ring-[var(--border)]"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemax={Math.round(target)}
        aria-label={label}
      >
        <div
          className={clsx('h-full rounded-full transition-all duration-500', over ? 'bg-red-500' : tones[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Donut ring — the center carries the real numbers (value / target),
    falling back to a percentage when no value is given. */
export function ProgressRing({
  pct,
  label,
  sub,
  value,
  target,
}: {
  pct: number;
  label: string;
  sub: string;
  value?: number | string;
  target?: number | string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative grid h-28 w-28 place-items-center rounded-full"
        style={{
          background: `conic-gradient(var(--color-gold-500) ${clamped * 3.6}deg, var(--surface-2) ${clamped * 3.6}deg)`,
        }}
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="grid h-[88px] w-[88px] place-items-center rounded-full ring-4"
          style={{ background: 'var(--surface)', ['--tw-ring-color' as string]: 'var(--bg)' }}
        >
          {value !== undefined ? (
            <span className="leading-none">
              <span className="font-display block text-xl font-extrabold tabular-nums text-primary-800 dark:text-primary-300">
                {value}
              </span>
              {target !== undefined && (
                <span className="mt-1 block text-[10px] font-semibold tabular-nums text-muted">
                  of {target} {sub}
                </span>
              )}
            </span>
          ) : (
            <span className="font-display text-xl font-extrabold tabular-nums text-primary-800 dark:text-primary-300">
              {Math.round(clamped)}%
            </span>
          )}
        </div>
      </div>
      <span className="text-sm font-bold">{label}</span>
    </div>
  );
}

/** Compact stat tile: label, serif value, tinted icon chip. */
export function StatTile({
  label,
  value,
  target,
  icon,
  tone = 'brand',
}: {
  label: string;
  value: string | number;
  target?: string | number;
  icon?: React.ReactNode;
  tone?: 'brand' | 'gold' | 'teal' | 'amber' | 'rose' | 'violet' | 'sky';
}) {
  const tones = {
    brand: 'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300',
    gold: 'bg-gold-100 text-gold-700 dark:bg-gold-500/15 dark:text-gold-300',
    teal: 'bg-teal-500/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  } as const;
  return (
    <div className="surface-2 rounded-xl p-4 ring-1 ring-[var(--border)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted">{label}</p>
          <p className="font-display mt-0.5 text-lg font-extrabold leading-snug tabular-nums sm:text-xl">
            {value}
            {target !== undefined && (
              <span className="ms-1 text-xs font-semibold text-muted">/ {target}</span>
            )}
          </p>
        </div>
        {icon && (
          <span className={clsx('grid h-9 w-9 shrink-0 place-items-center rounded-lg', tones[tone])}>
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}

/** Quiet empty-state block — icon (line icon preferred) with a short explanation. */
export function EmptyState({ emoji, text, icon }: { emoji?: string; text: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      {icon ? (
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-500/10 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400" aria-hidden>
          {icon}
        </span>
      ) : (
        <span className="text-3xl opacity-70" aria-hidden>
          {emoji}
        </span>
      )}
      <p className="max-w-xs text-sm text-muted">{text}</p>
    </div>
  );
}

/**
 * Food photo tile: real Commons image with graceful emoji fallback.
 * Sizing comes from the caller via className (h-11 w-11, h-16 w-16, …).
 */
export function FoodImage({
  food,
  className,
  emojiClass = 'text-2xl',
}: {
  food: Pick<Food, 'emoji' | 'image_url' | 'name'>;
  className?: string;
  emojiClass?: string;
}) {
  const [failed, setFailed] = useState(false);
  const tile =
    'grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary-50 to-mint-50 ring-1 ring-primary-100 dark:from-primary-900/40 dark:to-teal-900/30 dark:ring-primary-800';
  if (!food.image_url || failed) {
    return (
      <span className={clsx(tile, className)} aria-hidden>
        <span className={emojiClass}>{food.emoji}</span>
      </span>
    );
  }
  return (
    <span className={clsx(tile, className)}>
      {/* Remote Commons thumbnails: plain img keeps the emoji fallback simple. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={food.image_url}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

export { Sparkles };
