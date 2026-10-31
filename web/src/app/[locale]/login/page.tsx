'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Leaf, LoaderCircle } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tn = useTranslations('nav');
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
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-800 text-white">
            <Leaf className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-extrabold">{t('welcomeBack')}</h1>
          <p className="text-sm text-muted">{t('loginSubtitle')}</p>
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
                className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300"
              >
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy} className="w-full">
              {busy && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
              {tn('login')}
            </Button>
          </form>

          <div className="mt-5 border-t pt-4 text-center text-sm text-muted" style={{ borderColor: 'var(--border)' }}>
            <p className="mb-1 font-semibold">{tc('demoAccounts')}</p>
            <p dir="ltr" className="tabular-nums">sara@nutricare.test · password1234</p>
            <p dir="ltr" className="tabular-nums">admin@nutricare.test · admin1234!</p>
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
  );
}
