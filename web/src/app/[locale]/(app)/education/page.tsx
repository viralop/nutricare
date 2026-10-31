'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import clsx from 'clsx';
import { ExternalLink, Clock3, BookOpen } from 'lucide-react';
import { Card, ErrorBlock, LoadingBlock, PageHeader } from '@/components/ui';
import { apiData } from '@/lib/api';
import type { Article } from '@/lib/types';

const CATEGORIES = ['all', 'diabetes', 'hypertension', 'cholesterol', 'heart', 'obesity', 'labels', 'cooking', 'myths'] as const;

function categoryEmoji(category: string): string {
  const map: Record<string, string> = {
    diabetes: '🩸', hypertension: '🧂', cholesterol: '🥑', heart: '❤️',
    obesity: '⚖️', labels: '🏷️', cooking: '🍳', myths: '💡', general: '🌿',
  };
  return map[category] ?? '🌿';
}

function ArticleBody({ body }: { body: string }) {
  // Minimal, safe markdown rendering for our seeded content: **bold**, lists, paragraphs.
  const blocks = body.split('\n');
  return (
    <div className="space-y-3 text-sm leading-7">
      {blocks.map((line, i) => {
        if (line.trim() === '') return null;
        if (line.startsWith('- ')) {
          return (
            <li key={i} className="ms-5 list-disc">
              {renderInline(line.slice(2))}
            </li>
          );
        }
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );

  function renderInline(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, j) =>
      p.startsWith('**') && p.endsWith('**') ? <strong key={j}>{p.slice(2, -2)}</strong> : <span key={j}>{p}</span>,
    );
  }
}

export default function EducationPage() {
  const t = useTranslations('education');
  const tc = useTranslations('common');
  const locale = useLocale();

  const [articles, setArticles] = useState<Article[] | null>(null);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('all');
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [openBody, setOpenBody] = useState<Article | null>(null);

  useEffect(() => {
    apiData<Article[]>('/articles', { locale })
      .then(setArticles)
      .catch(() => setError(true));
  }, [locale]);

  async function open(slug: string) {
    if (openSlug === slug) {
      setOpenSlug(null);
      return;
    }
    setOpenSlug(slug);
    setOpenBody(null);
    setOpenBody(await apiData<Article>(`/articles/${slug}`, { locale }));
  }

  if (error) return <ErrorBlock onRetry={() => window.location.reload()} />;
  if (!articles) return <LoadingBlock />;

  const shown = category === 'all' ? articles : articles.filter((a) => a.category === category);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        icon={<BookOpen className="h-6 w-6" aria-hidden />}
      />

      <div className="flex flex-wrap gap-2" role="tablist">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={category === c}
            onClick={() => setCategory(c)}
            className={clsx(
              'rounded-full px-3.5 py-1.5 text-sm font-bold',
              category === c ? 'bg-primary-800 text-white' : 'surface-2 text-[var(--text)]',
            )}
          >
            {t(`categories.${c}`)}
          </button>
        ))}
      </div>

      <ul className="space-y-4">
        {shown.map((a, idx) => (
          <li key={a.slug} className="anim-fade-up" style={{ animationDelay: `${idx * 60}ms` }}>
            <Card hover>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary-50 to-mint-50 ring-1 ring-primary-100 dark:from-primary-900/40 dark:to-teal-900/30 dark:ring-primary-800" aria-hidden>
                    {categoryEmoji(a.category)}
                  </span>
                  <div>
                    <h3 className="text-lg font-extrabold leading-snug">{a.title}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden />
                      {t('readTime', { n: a.read_minutes })} · {t(`categories.${a.category}`)}
                    </p>
                  </div>
                </div>
              </div>
              {a.excerpt && <p className="mt-2 text-sm leading-relaxed text-muted">{a.excerpt}</p>}

              <button
                type="button"
                onClick={() => open(a.slug)}
                aria-expanded={openSlug === a.slug}
                className="mt-3 text-sm font-bold text-primary-700 hover:underline dark:text-primary-300"
              >
                {openSlug === a.slug ? tc('close') : t('readMore')}
              </button>

              {openSlug === a.slug && (
                <div className="mt-4 space-y-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                  {openBody ? <ArticleBody body={openBody.body ?? ''} /> : <LoadingBlock />}
                  <div>
                    <p className="mb-1 text-sm font-bold">{t('sources')}</p>
                    <ul className="space-y-1 text-xs">
                      {a.sources.map((s) => (
                        <li key={s.url}>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-teal-700 hover:underline dark:text-teal-300"
                          >
                            <ExternalLink className="h-3 w-3" aria-hidden />
                            {s.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
