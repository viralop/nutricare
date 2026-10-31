'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import clsx from 'clsx';
import { Leaf, LoaderCircle, Plus, X } from 'lucide-react';
import { Button, Card, Input, Select } from '@/components/ui';
import { useAuth, type RegisterPayload } from '@/lib/auth';
import { apiData, ApiError } from '@/lib/api';
import type { Condition } from '@/lib/types';

const STEPS = 3;

export default function RegisterPage() {
  const t = useTranslations('auth');
  const tn = useTranslations('nav');
  const tc = useTranslations('common');
  const { register } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // step 1 — account
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // step 2 — body
  const [age, setAge] = useState('30');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('170');
  const [weight, setWeight] = useState('75');
  const [activity, setActivity] = useState('moderate');

  // step 3 — health
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyDraft, setAllergyDraft] = useState('');

  useEffect(() => {
    apiData<Condition[]>('/conditions', { locale })
      .then((list) => setConditions(list))
      .catch(() => setConditions([]));
  }, [locale]);

  const stepValid = useMemo(() => {
    if (step === 1) {
      return name.trim().length >= 2 && /.+@.+\..+/.test(email) && password.length >= 8 && password === confirm;
    }
    if (step === 2) {
      return Number(age) >= 10 && Number(height) >= 100 && Number(weight) >= 30;
    }
    return true;
  }, [step, name, email, password, confirm, age, height, weight]);

  function toggleCondition(slug: string) {
    setSelected((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  function addAllergy() {
    const v = allergyDraft.trim();
    if (v && !allergies.includes(v)) setAllergies([...allergies, v]);
    setAllergyDraft('');
  }

  async function submit() {
    const payload: RegisterPayload = {
      name: name.trim(),
      email: email.trim(),
      password,
      password_confirmation: confirm,
      locale,
      profile: {
        age: Number(age),
        gender: gender || null,
        height_cm: Number(height),
        weight_kg: Number(weight),
        activity_level: activity,
        allergies,
        dietary_preferences: [],
        food_restrictions: [],
        conditions: selected,
      },
    };
    setBusy(true);
    setError(null);
    try {
      await register(payload);
      router.replace(`/${locale}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const first = Object.values(err.errors)[0]?.[0];
        setError(first ?? tc('error'));
      } else {
        setError(tc('error'));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-10">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-800 text-white">
          <Leaf className="h-7 w-7" />
        </span>
        <h1 className="text-2xl font-extrabold">{t('createAccount')}</h1>
        <p className="text-sm text-muted">{t('registerSubtitle')}</p>
      </div>

      <Card className="p-6">
        {/* Stepper */}
        <div className="mb-6 flex items-center gap-2" aria-hidden>
          {Array.from({ length: STEPS }, (_, i) => i + 1).map((s) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <span
                className={clsx(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold',
                  s <= step ? 'bg-primary-800 text-white' : 'surface-2 text-muted',
                )}
              >
                {s}
              </span>
              {s < STEPS && (
                <span className={clsx('h-1 flex-1 rounded-full', s < step ? 'bg-primary-700' : 'surface-2')} />
              )}
            </div>
          ))}
        </div>
        <p className="mb-4 text-sm font-semibold text-muted">
          {t('step')} {step} {t('of')} {STEPS} — {step === 1 ? t('accountInfo') : step === 2 ? t('bodyInfo') : t('healthInfo')}
        </p>

        {step === 1 && (
          <div className="space-y-4">
            <Input label={t('name')} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            <Input label={t('email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <Input label={t('password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" hint={t('passwordRule')} />
            <Input label={t('confirmPassword')} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('age')} type="number" min={10} max={110} value={age} onChange={(e) => setAge(e.target.value)} />
            <Select label={`${t('gender')} (${tc('optional')})`} value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">{t('preferNotSay')}</option>
              <option value="male">{t('male')}</option>
              <option value="female">{t('female')}</option>
            </Select>
            <Input label={t('height')} type="number" min={100} max={230} value={height} onChange={(e) => setHeight(e.target.value)} />
            <Input label={t('weight')} type="number" min={30} max={300} value={weight} onChange={(e) => setWeight(e.target.value)} />
            <div className="col-span-2">
              <Select label={t('activityLevel')} value={activity} onChange={(e) => setActivity(e.target.value)}>
                <option value="sedentary">{t('activity_sedentary')}</option>
                <option value="light">{t('activity_light')}</option>
                <option value="moderate">{t('activity_moderate')}</option>
                <option value="active">{t('activity_active')}</option>
                <option value="very_active">{t('activity_very_active')}</option>
              </Select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <p className="mb-1 text-sm font-medium">{t('conditions')}</p>
              <p className="mb-3 text-xs text-muted">{t('conditionsHint')}</p>
              <div className="flex flex-wrap gap-2">
                {conditions.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    aria-pressed={selected.includes(c.slug)}
                    onClick={() => toggleCondition(c.slug)}
                    className={clsx(
                      'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                      selected.includes(c.slug)
                        ? 'border-primary-800 bg-primary-800 text-white'
                        : 'surface-2 border-app text-[var(--text)]',
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1 text-sm font-medium">
                {t('allergies')} <span className="text-muted">({tc('optional')})</span>
              </p>
              <p className="mb-2 text-xs text-muted">{t('allergiesHint')}</p>
              <div className="flex gap-2">
                <Input
                  value={allergyDraft}
                  onChange={(e) => setAllergyDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAllergy();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={addAllergy} aria-label={tc('add')}>
                  <Plus className="h-4 w-4" aria-hidden />
                </Button>
              </div>
              {allergies.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {allergies.map((a) => (
                    <li key={a} className="flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                      {a}
                      <button type="button" onClick={() => setAllergies(allergies.filter((x) => x !== a))} aria-label={`${tc('delete')} ${a}`}>
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-between gap-3">
          <Button type="button" variant="ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
            {tc('back')}
          </Button>
          {step < STEPS ? (
            <Button type="button" disabled={!stepValid} onClick={() => setStep((s) => s + 1)}>
              {t('next')}
            </Button>
          ) : (
            <Button type="button" disabled={busy} onClick={submit}>
              {busy && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
              {t('finish')}
            </Button>
          )}
        </div>
      </Card>

      <p className="mt-4 text-center text-sm">
        {t('haveAccount')}{' '}
        <Link href={`/${locale}/login`} className="font-bold text-primary-700 hover:underline dark:text-primary-300">
          {tn('login')}
        </Link>
      </p>
    </div>
  );
}
