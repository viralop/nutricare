'use client';

import clsx from 'clsx';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import {
  LayoutDashboard, ScanSearch, MessageCircleHeart, CalendarDays, UtensilsCrossed,
  BookOpenCheck, HeartPulse, Bell, Settings, ShieldCheck, LogOut, Leaf,
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
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gold-400 text-primary-950">
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
    <nav className="rail-petrol flex h-full flex-col gap-1 overflow-y-auto p-4 scroll-slim" aria-label={tApp('name')}>
      {/* Brand */}
      <Link href="/" className="group mb-5 flex items-center gap-3 rounded-2xl p-2">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-400 text-primary-950">
          <Leaf className="h-6 w-6" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="font-display block text-xl font-extrabold leading-tight text-white">{tApp('name')}</span>
          <span className="block truncate text-[11px] font-medium text-white/55">{tApp('tagline')}</span>
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
                ? 'bg-gold-400 text-primary-950'
                : 'text-white/80 hover:bg-white/10 hover:text-white hover:ps-4',
            )}
            aria-current={active ? 'page' : undefined}
          >
            {!active && href !== '' && (
              <span
                aria-hidden
                className={clsx(
                  'absolute start-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-gold-400/70 transition-opacity',
                  pathname.startsWith(href) ? 'opacity-100' : 'opacity-0',
                )}
              />
            )}
            <Icon className={clsx('h-5 w-5 shrink-0', !active && 'text-gold-300/90')} aria-hidden />
            {t(key)}
          </Link>
        );
      })}

      {/* User card */}
      <div className="mt-auto pt-4">
        <div className="mb-2 flex items-center gap-3 rounded-2xl bg-white/8 p-3 ring-1 ring-white/10">
          <Avatar name={user.name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-white">{user.name}</p>
            <p className="truncate text-[11px] text-white/55">
              {user.conditions.map((c) => c.name).join(' · ')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => logout().then(() => router.replace('/login'))}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/15 hover:text-red-200"
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden />
          {t('logout')}
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar — petrol rail (midnight navy in dark mode) */}
      <aside className="rail-petrol fixed inset-y-0 start-0 z-30 hidden w-64 border-e border-black/20 lg:block">
        {sidebar}
      </aside>

      {/* Main column */}
      <div className="lg:ms-64">
        <header className="surface-flat sticky top-0 z-20 flex items-center justify-between gap-3 border-x-0 border-t-0 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3 lg:hidden">
            <Avatar name={user.name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">{user.name}</p>
              <p className="truncate text-[11px] text-muted">
                {user.conditions.map((c) => c.name).join(' · ')}
              </p>
            </div>
          </div>
          <div className="hidden min-w-0 lg:block" />
          {/* Language & theme live in Settings now; gear stays for quick access */}
          <Link
            href="/settings"
            aria-label={t('settings')}
            title={t('settings')}
            className="surface-2 grid h-9 w-9 place-items-center rounded-full ring-1 ring-[var(--border)] transition-transform hover:scale-105"
          >
            <Settings className="h-4 w-4 text-primary-700 dark:text-primary-300" aria-hidden />
          </Link>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 lg:pb-12">{children}</main>
      </div>

      {/* Mobile floating bottom navigation — icons only (labels via aria-label/title) */}
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
                'grid min-w-12 place-items-center rounded-xl p-2.5 transition-all',
                active ? 'text-primary-900 dark:text-primary-200' : 'text-muted',
              )}
              aria-label={t(key)}
              aria-current={active ? 'page' : undefined}
              title={t(key)}
            >
              <span
                className={clsx(
                  'grid h-9 w-9 place-items-center rounded-xl transition-all',
                  active ? 'bg-gold-400 text-primary-950 scale-110' : '',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
            </Link>
          );
        })}
        <Link
          href="/profile"
          className={clsx(
            'grid min-w-12 place-items-center rounded-xl p-2.5 transition-all',
            isActive('/profile') ? 'text-primary-900 dark:text-primary-200' : 'text-muted',
          )}
          aria-label={t('profile')}
          title={t('profile')}
        >
          <span
            className={clsx(
              'grid h-9 w-9 place-items-center rounded-xl transition-all',
              isActive('/profile') && 'bg-gold-400 text-primary-950 scale-110',
            )}
          >
            <HeartPulse className="h-5 w-5" aria-hidden />
          </span>
        </Link>
      </nav>
    </div>
  );
}
