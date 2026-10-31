'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import clsx from 'clsx';
import { Check, LoaderCircle } from 'lucide-react';
import { Button, Card, Input, SectionTitle, Select } from '@/components/ui';
import { apiData } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Condition, User } from '@/lib/types';

export default function ProfilePage() {
  const t = useTranslations('profile');
  const ta = useTranslations('auth');
  const tc = useTranslations('common');
  const { user, refresh } = useAuth();
  const locale = useLocale();

  const [conditions, setConditions] = useState<Condition[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState('moderate');
  const [calorieTarget, setCalorieTarget] = useState('');
  const [waterTarget, setWaterTarget] = useState('2000');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiData<Condition[]>('/conditions', { locale }).then(setConditions).catch(() => {});
  }, [locale]);

  useEffect(() => {
    if (!user?.profile) return;
    setSelected(user.conditions.map((c) => c.slug));
    setAge(String(user.profile.age));
    setGender(user.profile.gender ?? '');
    setHeight(String(user.profile.height_cm));
    setWeight(String(user.profile.weight_kg));
    setActivity(user.profile.activity_level);
    setCalorieTarget(String(user.profile.daily_calorie_target ?? ''));
    setWaterTarget(String(user.profile.daily_water_target_ml));
  }, [user]);

  async function save() {
    setBusy(true);
    setSaved(false);
    try {
      await apiData<User>('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          age: Number(age),
          gender: gender || null,
          height_cm: Number(height),
          weight_kg: Number(weight),
          activity_level: activity,
          daily_calorie_target: calorieTarget ? Number(calorieTarget) : null,
          daily_water_target_ml: Number(waterTarget),
          conditions: selected,
        }),
        locale,
      });
      await refresh();
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  if (!user?.profile) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold">{t('title')}</h1>
        <p className="text-sm text-muted">{t('subtitle')}</p>
      </header>

      {/* Summary */}
      <Card>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={t('bmi')} value={user.profile.bmi ? user.profile.bmi.toFixed(1) : '—'} />
          <Stat label={t('calorieTarget')} value={`${user.profile.daily_calorie_target ?? '—'} kcal`} />
          <Stat label={t('waterTarget')} value={`${user.profile.daily_water_target_ml} ml`} />
          <Stat
            label={t('updateConditions')}
            value={user.conditions.map((c) => c.name).join(' · ') || '—'}
            small
          />
        </div>
      </Card>

      <Card>
        <SectionTitle>{ta('bodyInfo')}</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Input label={ta('age')} type="number" value={age} onChange={(e) => setAge(e.target.value)} />
          <Select label={ta('gender')} value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">{ta('preferNotSay')}</option>
            <option value="male">{ta('male')}</option>
            <option value="female">{ta('female')}</option>
          </Select>
          <Input label={ta('height')} type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
          <Input label={ta('weight')} type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
          <div className="col-span-2">
            <Select label={ta('activityLevel')} value={activity} onChange={(e) => setActivity(e.target.value)}>
              <option value="sedentary">{ta('activity_sedentary')}</option>
              <option value="light">{ta('activity_light')}</option>
              <option value="moderate">{ta('activity_moderate')}</option>
              <option value="active">{ta('activity_active')}</option>
              <option value="very_active">{ta('activity_very_active')}</option>
            </Select>
          </div>
          <Input label={t('calorieTarget')} type="number" value={calorieTarget} onChange={(e) => setCalorieTarget(e.target.value)} hint={t('calorieTargetHint')} />
          <Input label={t('waterTarget')} type="number" value={waterTarget} onChange={(e) => setWaterTarget(e.target.value)} />
        </div>
      </Card>

      <Card>
        <SectionTitle>{t('updateConditions')}</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {conditions.map((c) => (
            <button
              key={c.slug}
              type="button"
              aria-pressed={selected.includes(c.slug)}
              onClick={() =>
                setSelected((prev) =>
                  prev.includes(c.slug) ? prev.filter((s) => s !== c.slug) : [...prev, c.slug],
                )
              }
              className={clsx(
                'rounded-full border px-4 py-2 text-sm font-semibold',
                selected.includes(c.slug)
                  ? 'border-primary-800 bg-primary-800 text-white'
                  : 'surface-2 border-app text-[var(--text)]',
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={busy}>
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : saved ? <Check className="h-4 w-4" aria-hidden /> : null}
          {saved ? t('updated') : busy ? tc('saving') : tc('save')}
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value, small = false }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="surface-2 rounded-xl p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={clsx('mt-0.5 font-extrabold tabular-nums', small ? 'text-sm leading-snug' : 'text-xl')}>{value}</p>
    </div>
  );
}
