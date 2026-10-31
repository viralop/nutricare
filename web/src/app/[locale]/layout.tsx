import { NextIntlClientProvider } from 'next-intl';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { Almarai, Fraunces } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { routing } from '@/i18n/routing';
import { AuthProvider } from '@/lib/auth';
import '@/app/globals.css';

// Fraunces: expressive Latin display serif. Almarai: clean Arabic companion.
// The variables live on a wrapper div — NOT on <html> — so React never
// re-applies html.className and wipes the next-themes dark/light class.
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' });
const almarai = Almarai({ subsets: ['arabic', 'latin'], weight: ['400', '700', '800'], variable: '--font-almarai' });

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body className="antialiased">
        <div className={`app-fonts ${fraunces.variable} ${almarai.variable}`}>
          <NextIntlClientProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <AuthProvider>{children}</AuthProvider>
            </ThemeProvider>
          </NextIntlClientProvider>
        </div>
      </body>
    </html>
  );
}
