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
      className="surface-2 grid h-9 w-9 place-items-center rounded-full"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {mounted && theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
      className="surface-2 flex h-9 items-center gap-1 rounded-full px-3 text-sm font-semibold"
      onClick={() => router.replace(pathname, { locale: locale === 'ar' ? 'en' : 'ar' })}
    >
      <Languages className="h-4 w-4" />
      {locale === 'ar' ? 'EN' : 'ع'}
    </button>
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
        <div className="flex items-center gap-3 text-muted">
          <Leaf className="h-6 w-6 animate-pulse text-primary-600" />
          {tc('loading')}
        </div>
      </div>
    );
  }

  const navItems = user.role === 'admin'
    ? [...NAV, { href: '/admin', key: 'admin', Icon: ShieldCheck } as const]
    : [...NAV];

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label={tApp('name')}>
      <Link href={'/'} className="mb-4 flex items-center gap-2 px-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-800 text-white">
          <Leaf className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-lg font-extrabold leading-none">{tApp('name')}</span>
          <span className="block text-xs text-muted">{tApp('tagline')}</span>
        </span>
      </Link>
      {navItems.map(({ href, key, Icon }) => (
        <Link
          key={key}
          href={href === '' ? '/' : href}
          className={clsx(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors',
            isActive(href)
              ? 'bg-primary-800 text-white'
              : 'text-[var(--text)] hover:bg-primary-50 dark:hover:bg-primary-900/30',
          )}
          aria-current={isActive(href) ? 'page' : undefined}
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden />
          {t(key)}
        </Link>
      ))}
      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={() => logout().then(() => router.replace('/login'))}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <LogOut className="h-5 w-5" aria-hidden />
          {t('logout')}
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="surface fixed inset-y-0 start-0 z-30 hidden w-64 border-y-0 border-s-0 lg:block">
        {sidebar}
      </aside>

      {/* Main column */}
      <div className="lg:ms-64">
        <header className="surface sticky top-0 z-20 flex items-center justify-between gap-3 border-x-0 border-t-0 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{user.name}</p>
            <p className="truncate text-xs text-muted">
              {user.conditions.map((c) => c.name).join(' · ')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 lg:pb-10">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        className="surface fixed inset-x-0 bottom-0 z-30 flex justify-around border-x-0 border-b-0 py-1 lg:hidden"
        aria-label="primary"
      >
        {navItems.slice(0, 5).map(({ href, key, Icon }) => (
          <Link
            key={key}
            href={href === '' ? '/' : href}
            className={clsx(
              'flex min-w-14 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] font-medium',
              isActive(href) ? 'text-primary-700 dark:text-primary-300' : 'text-muted',
            )}
            aria-current={isActive(href) ? 'page' : undefined}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {t(key)}
          </Link>
        ))}
        <Link
          href={'/profile'}
          className={clsx(
            'flex min-w-14 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] font-medium',
            isActive('/profile') ? 'text-primary-700 dark:text-primary-300' : 'text-muted',
          )}
        >
          <HeartPulse className="h-5 w-5" aria-hidden />
          {t('profile')}
        </Link>
      </nav>
    </div>
  );
}
