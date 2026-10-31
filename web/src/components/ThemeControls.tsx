'use client';

import clsx from 'clsx';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Languages, Monitor, Moon, Sun } from 'lucide-react';
import { useRouter, usePathname } from '@/i18n/navigation';

/** Compact language pill (EN / ع). */
export function LangToggle({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common');
  return (
    <button
      type="button"
      aria-label={t('language')}
      title={t('language')}
      className={clsx(
        'surface-2 flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-extrabold ring-1 ring-[var(--border)] transition-all hover:scale-105',
        className,
      )}
      onClick={() => router.replace(pathname, { locale: locale === 'ar' ? 'en' : 'ar' })}
    >
      <Languages className="h-4 w-4 text-teal-600" aria-hidden />
      {locale === 'ar' ? 'EN' : 'ع'}
    </button>
  );
}

/**
 * Segmented theme switcher: system / light / dark.
 * Renders a stable skeleton until mounted to avoid hydration mismatch.
 */
export function ThemeSwitcher({ withSystem = true, className }: { withSystem?: boolean; className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const t = useTranslations('common');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const options = [
    ...(withSystem ? [{ value: 'system', label: t('system'), Icon: Monitor }] : []),
    { value: 'light', label: t('light'), Icon: Sun },
    { value: 'dark', label: t('dark'), Icon: Moon },
  ] as const;

  const current = theme ?? 'system';

  return (
    <div
      role="radiogroup"
      aria-label={t('theme')}
      className={clsx(
        'surface-2 flex h-9 items-center gap-0.5 rounded-full p-1 ring-1 ring-[var(--border)]',
        className,
      )}
    >
      {options.map(({ value, label, Icon }) => {
        const active = mounted && (current === value || (value === 'system' && current === 'system'));
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={clsx(
              'grid h-7 w-7 place-items-center rounded-full transition-all',
              active
                ? 'gradient-brand scale-105 text-white shadow'
                : 'text-muted hover:text-[var(--text)]',
            )}
          >
            <Icon className={clsx('h-4 w-4', value === 'light' && !active && 'text-amber-500', value === 'dark' && !active && 'text-indigo-500')} aria-hidden />
            {/* hidden live label for screen readers */}
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Floating controls for auth pages (top corner). */
export function AuthControls() {
  return (
    <div className="fixed top-4 z-50 flex items-center gap-2 ltr:right-4 rtl:left-4">
      <LangToggle />
      <ThemeSwitcher />
    </div>
  );
}
