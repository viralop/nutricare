'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import clsx from 'clsx';
import { Send, ShieldAlert, RotateCcw, Leaf } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { apiData } from '@/lib/api';
import type { ChatReply } from '@/lib/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  blocked?: boolean;
}

export default function AssistantPage() {
  const t = useTranslations('assistant');
  const tc = useTranslations('common');
  const td = useTranslations('disclaimer');
  const locale = useLocale();

  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  async function send(text?: string) {
    const message = (text ?? draft).trim();
    if (!message || busy) return;
    setDraft('');
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setBusy(true);
    try {
      const res = await apiData<ChatReply>('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ message, session_id: sessionId, locale }),
      });
      setSessionId(res.session_id);
      setSuggestions(res.suggestions);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply, blocked: res.blocked }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: tc('error') }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100svh-7.25rem)] max-w-3xl flex-col max-lg:-mb-28 lg:h-[calc(100vh-9.5rem)]">
      <header className="mb-2 flex items-center justify-between gap-3 lg:mb-4">
        <div className="flex items-center gap-2.5 lg:gap-3">
          <span className="anim-float grid h-9 w-9 place-items-center rounded-xl gradient-brand text-white shadow-lg lg:h-12 lg:w-12 lg:rounded-2xl">
            <Leaf className="h-4.5 w-4.5 lg:h-6 lg:w-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-base font-extrabold lg:text-xl">{t('title')}</h1>
            <p className="truncate text-xs text-muted">{t('subtitle')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setMessages([]);
            setSessionId(null);
            setSuggestions([]);
          }}
          aria-label={t('newChat')}
          title={t('newChat')}
          className="grid h-9 w-9 shrink-0 place-items-center self-start rounded-full text-muted ring-1 ring-[var(--border)] transition-colors hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-primary-500/10 dark:hover:text-primary-300 lg:inline-flex lg:h-10 lg:w-auto lg:gap-1.5 lg:self-center lg:px-3.5 lg:text-sm lg:font-semibold"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          <span className="hidden lg:inline">{t('newChat')}</span>
        </button>
      </header>

      {/* Phones: frameless chat area — bubbles and input carry their own surfaces.
          The boxed card only adds noise (and dead space) at small widths. */}
      <Card className="flex min-h-0 flex-1 flex-col p-0 max-lg:!bg-transparent max-lg:!border-0 max-lg:!shadow-none max-lg:rounded-none">
        <div className="relative min-h-0 flex-1 space-y-4 overflow-y-auto px-2 pb-1 scroll-slim lg:p-4" role="log" aria-live="polite">
          {messages.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
              <span className="anim-float grid h-16 w-16 place-items-center rounded-2xl gradient-brand text-white shadow-xl">
                <Leaf className="h-8 w-8" aria-hidden />
              </span>
              {suggestions.length === 0 && (
                <ul className="flex max-w-lg flex-wrap justify-center gap-2">
                  <li>
                    <button
                      type="button"
                      onClick={() => send(locale === 'ar' ? 'هل الأرز مناسب لمرضى السكر؟' : 'Is rice good for diabetics?')}
                      className="surface-2 rounded-full px-3 py-1.5 text-sm font-medium hover:opacity-80"
                    >
                      {locale === 'ar' ? 'هل الأرز مناسب لمرضى السكر؟' : 'Is rice good for diabetics?'}
                    </button>
                  </li>
                </ul>
              )}
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={clsx('flex items-end gap-2 anim-fade-up', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              {m.role === 'assistant' && (
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full gradient-brand text-white shadow-md"
                  aria-hidden
                >
                  <Leaf className="h-4 w-4" />
                </span>
              )}
              <div
                className={clsx(
                  'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line shadow-sm',
                  m.role === 'user'
                    ? 'gradient-brand rounded-ee-md text-white'
                    : m.blocked
                      ? 'bg-red-50 text-red-800 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-200 dark:ring-red-800'
                      : 'surface-2 rounded-es-md ring-1 ring-[var(--border)]',
                )}
              >
                {m.blocked && (
                  <p className="mb-1 flex items-center gap-1.5 font-bold">
                    <ShieldAlert className="h-4 w-4" aria-hidden />
                    {t('blockedTitle')}
                  </p>
                )}
                {m.content}
                {m.role === 'assistant' && !m.blocked && (
                  <p className="mt-2 border-t pt-2 text-[11px] opacity-70" style={{ borderColor: 'var(--border)' }}>
                    {td('short')}
                  </p>
                )}
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex justify-start">
              <div className="surface-2 flex gap-1 rounded-2xl px-4 py-3" aria-label={tc('loading')}>
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="h-2 w-2 animate-bounce rounded-full bg-teal-500"
                    style={{ animationDelay: `${d * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {suggestions.length > 0 && (
          <ul className="flex flex-wrap gap-2 border-t px-4 py-2" style={{ borderColor: 'var(--border)' }}>
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => send(s)}
                  className="surface-2 rounded-full px-3 py-1 text-xs font-medium hover:opacity-80"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}

        <form
          className="flex gap-2 border-t p-3"
          style={{ borderColor: 'var(--border)' }}
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('placeholder')}
            aria-label={t('title')}
            className="surface-2 min-w-0 flex-1 rounded-xl px-3 py-2.5 focus-visible:outline-none"
            style={{ borderColor: 'var(--border)' }}
          />
          <Button type="submit" disabled={busy || !draft.trim()} aria-label={t('send')}>
            <Send className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{t('send')}</span>
          </Button>
        </form>
      </Card>
    </div>
  );
}
