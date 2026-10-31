'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Leaf, LoaderCircle, ShieldCheck, Apple, ScanSearch, HeartPulse } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { AuthControls } from '@/components/ThemeControls';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';

const HIGHLIGHTS = [
  { Icon: ScanSearch, key: 'analyzer' },
  { Icon: Apple, key: 'food' },
  { Icon: HeartPulse, key: 'health' },
] as const;

export default function LoginPage() {
  const t = useTranslations('auth');
  const tn = useTranslations('nav');
  const tApp = useTranslations('app');
  const tc = useTranslations('common');
  const { login } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      router.replace(`/${locale}`);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 422 ? t('loginFailed') : tc('error'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Theme & language controls (visible on both panels) */}
      <AuthControls />

      {/* Hero panel (desktop) */}
      <div className="gradient-brand relative hidden overflow-hidden border-e-[3px] border-gold-400 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pattern-dots absolute inset-0 opacity-50" aria-hidden />
        <div aria-hidden className="absolute -bottom-24 -end-24 h-80 w-80 rounded-full bg-gold-400/15 blur-2xl" />
        <div aria-hidden className="absolute -top-16 -start-16 h-64 w-64 rounded-full bg-teal-500/15 blur-2xl" />

        <div className="relative flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl gradient-gold text-primary-950 shadow-lg">
            <Leaf className="h-7 w-7" aria-hidden />
          </span>
          <div>
            <p className="font-display text-2xl font-extrabold">{tApp('name')}</p>
            <p className="text-sm text-white/70">{tApp('tagline')}</p>
          </div>
        </div>

        <div className="relative space-y-5">
          <h2 className="font-display max-w-md text-3xl font-extrabold leading-snug">
            {t('welcomeBack')} 🌿
          </h2>
          <ul className="space-y-3">
            {HIGHLIGHTS.map(({ Icon, key }) => (
              <li key={key} className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm font-semibold">
                  {key === 'analyzer' ? tn('analyzer') : key === 'food' ? 'Koshari · كبسة · فول' : 'Diabetes · Hypertension · Cholesterol'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-2 text-xs text-white/70">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          Nutrition education — not medical advice.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md anim-fade-up">
          <div className="mb-6 flex flex-col items-center gap-2 text-center lg:hidden">
            <span className="anim-float grid h-16 w-16 place-items-center rounded-3xl gradient-brand text-white shadow-lg">
              <Leaf className="h-8 w-8" aria-hidden />
            </span>
            <h1 className="text-2xl font-extrabold">{t('welcomeBack')}</h1>
            <p className="text-sm text-muted">{t('loginSubtitle')}</p>
          </div>
          <div className="mb-6 hidden text-center lg:block">
            <h1 className="text-3xl font-extrabold">{t('welcomeBack')}</h1>
            <p className="mt-1 text-sm text-muted">{t('loginSubtitle')}</p>
          </div>

          <Card className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <Input
                label={t('email')}
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label={t('password')}
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-800"
                >
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" disabled={busy} className="w-full">
                {busy ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden /> : null}
                {tn('login')}
              </Button>
            </form>

            <div className="mt-5 border-t pt-4 text-center text-sm border-app" style={{ borderColor: 'var(--border)' }}>
              <p className="mb-2 font-bold text-muted">{tc('demoAccounts')}</p>
              <div className="flex flex-wrap justify-center gap-2" dir="ltr">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('sara@nutricare.test');
                    setPassword('password1234');
                  }}
                  className="surface-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-[var(--border)] transition-transform hover:scale-105"
                >
                  👩 sara · password1234
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@nutricare.test');
                    setPassword('admin1234!');
                  }}
                  className="surface-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-[var(--border)] transition-transform hover:scale-105"
                >
                  🛡️ admin · admin1234!
                </button>
              </div>
            </div>
          </Card>

          <p className="mt-4 text-center text-sm">
            {t('noAccount')}{' '}
            <Link href={`/${locale}/register`} className="font-bold text-primary-700 hover:underline dark:text-primary-300">
              {tn('register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
