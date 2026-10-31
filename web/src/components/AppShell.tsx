'use client';

import clsx from 'clsx';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, ScanSearch, MessageCircleHeart, CalendarDays, UtensilsCrossed,
  BookOpenCheck, HeartPulse, Bell, Settings, ShieldCheck, LogOut, Moon, Sun, Languages, Leaf,
} from 'lucide-react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth';

const NAV = [
  { href: '', key: 'dashboard', Icon: LayoutDashboard },
  { href: '/analyzer', key: 'analyzer', Icon: ScanSearch },
  { href: '/assistant', key: 'assistant', Icon: MessageCircleHeart },
  { href: '/meal-planner', key: 'mealPlanner', Icon: CalendarDays },
  { href: '/recipes', key: 'recipes', Icon: UtensilsCrossed },
  { href: '/education', key: 'education', Icon: BookOpenCheck },
  { href: '/profile', key: 'profile', Icon: HeartPulse },
  { href: '/notifications', key: 'notifications', Icon: Bell },
  { href: '/settings', key: 'settings', Icon: Settings },
] as const;

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('common');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <button
      type="button"
      aria-label={t('theme')}
      className="surface-2 grid h-9 w-9 place-items-center rounded-full ring-1 ring-[var(--border)] transition-transform hover:scale-105"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {mounted && theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
    </button>
  );
}

function LangToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common');
  return (
    <button
      type="button"
      aria-label={t('language')}
      className="surface-2 flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-extrabold ring-1 ring-[var(--border)] transition-transform hover:scale-105"
      onClick={() => router.replace(pathname, { locale: locale === 'ar' ? 'en' : 'ar' })}
    >
      <Languages className="h-4 w-4 text-teal-600" />
      {locale === 'ar' ? 'EN' : 'ع'}
    </button>
  );
}

/** Gradient avatar circle with user initials. */
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      aria-hidden
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary-700 to-teal-500 text-sm font-extrabold text-white shadow-md ring-2 ring-white/40"
    >
      {initials}
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('nav');
  const tApp = useTranslations('app');
  const tc = useTranslations('common');
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Auth guard: client-side redirect while keeping pages client-rendered.
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  // i18n pathname is locale-less (e.g. "/analyzer").
  const isActive = (href: string) =>
    href === '' ? pathname === '/' : pathname.startsWith(href);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="anim-float grid h-16 w-16 place-items-center rounded-3xl gradient-brand text-white shadow-lg">
            <Leaf className="h-8 w-8" aria-hidden />
          </span>
          <span className="text-sm font-semibold text-muted">{tc('loading')}</span>
        </div>
      </div>
    );
  }

  const navItems = user.role === 'admin'
    ? [...NAV, { href: '/admin', key: 'admin', Icon: ShieldCheck } as const]
    : [...NAV];

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto p-4 scroll-slim" aria-label={tApp('name')}>
      {/* Brand */}
      <Link href="/" className="group mb-5 flex items-center gap-3 rounded-2xl p-2">
        <span className="grid h-11 w-11 place-items-center rounded-2xl gradient-brand text-white shadow-lg transition-transform group-hover:scale-105">
          <Leaf className="h-6 w-6" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-xl font-extrabold leading-tight">{tApp('name')}</span>
          <span className="block truncate text-[11px] font-medium text-muted">{tApp('tagline')}</span>
        </span>
      </Link>

      {navItems.map(({ href, key, Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={key}
            href={href === '' ? '/' : href}
            className={clsx(
              'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
              active
                ? 'gradient-brand text-white shadow-md'
                : 'text-[var(--text)] hover:bg-primary-50 hover:ps-4 dark:hover:bg-primary-900/25',
            )}
            aria-current={active ? 'page' : undefined}
          >
            {!active && href !== '' && (
              <span
                aria-hidden
                className={clsx(
                  'absolute start-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-teal-500 transition-opacity',
                  pathname.startsWith(href) ? 'opacity-100' : 'opacity-0',
                )}
              />
            )}
            <Icon className={clsx('h-5 w-5 shrink-0', !active && 'text-teal-600 dark:text-teal-400')} aria-hidden />
            {t(key)}
          </Link>
        );
      })}

      {/* User card */}
      <div className="mt-auto pt-4">
        <div className="surface-2 mb-2 flex items-center gap-3 rounded-2xl p-3 ring-1 ring-[var(--border)]">
          <Avatar name={user.name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold">{user.name}</p>
            <p className="truncate text-[11px] text-muted">
              {user.conditions.map((c) => c.name).join(' · ')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => logout().then(() => router.replace('/login'))}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden />
          {t('logout')}
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen">
      {/* Decorative ambient blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 end-0 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl dark:bg-teal-500/5" />
        <div className="absolute bottom-0 -start-32 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl dark:bg-primary-500/5" />
      </div>

      {/* Desktop sidebar */}
      <aside className="surface-flat fixed inset-y-0 start-0 z-30 hidden w-64 border-y-0 border-s-0 shadow-lg lg:block">
        {sidebar}
      </aside>

      {/* Main column */}
      <div className="lg:ms-64">
        <header className="surface-flat sticky top-0 z-20 flex items-center justify-between gap-3 border-x-0 border-t-0 px-4 py-3 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3 lg:hidden">
            <Avatar name={user.name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">{user.name}</p>
              <p className="truncate text-[11px] text-muted">
                {user.conditions.map((c) => c.name).join(' · ')}
              </p>
            </div>
          </div>
          {/* Desktop spacer keeps toggles at the end */}
          <div className="hidden min-w-0 lg:block" />
          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 lg:pb-12">{children}</main>
      </div>

      {/* Mobile floating bottom navigation */}
      <nav
        className="fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-2xl shadow-xl ring-1 ring-[var(--border)] lg:hidden"
        style={{ background: 'color-mix(in srgb, var(--surface) 88%, transparent)', backdropFilter: 'blur(12px)' }}
        aria-label="primary"
      >
        {navItems.slice(0, 5).map(({ href, key, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={key}
              href={href === '' ? '/' : href}
              className={clsx(
                'flex min-w-14 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-bold transition-all',
                active ? 'text-primary-700 dark:text-primary-300' : 'text-muted',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={clsx(
                  'grid h-8 w-8 place-items-center rounded-xl transition-all',
                  active && 'gradient-brand text-white shadow-md',
                )}
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              {t(key)}
            </Link>
          );
        })}
        <Link
          href="/profile"
          className={clsx(
            'flex min-w-14 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-bold transition-all',
            isActive('/profile') ? 'text-primary-700 dark:text-primary-300' : 'text-muted',
          )}
        >
          <span
            className={clsx(
              'grid h-8 w-8 place-items-center rounded-xl transition-all',
              isActive('/profile') && 'gradient-brand text-white shadow-md',
            )}
          >
            <HeartPulse className="h-[18px] w-[18px]" aria-hidden />
          </span>
          {t('profile')}
        </Link>
      </nav>
    </div>
  );
}
