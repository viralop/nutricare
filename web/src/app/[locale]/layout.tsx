import { NextIntlClientProvider } from 'next-intl';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { Plus_Jakarta_Sans, Readex_Pro } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { routing } from '@/i18n/routing';
import { AuthProvider } from '@/lib/auth';
import '@/app/globals.css';

// Plus Jakarta Sans: clean geometric Latin sans. Readex Pro: Arabic-first
// companion from the same family spirit (designed for LTR + RTL).
// The variables live on a wrapper div — NOT on <html> — so React never
// re-applies html.className and wipes the next-themes dark/light class.
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });
const readex = Readex_Pro({ subsets: ['arabic', 'latin'], variable: '--font-readex' });

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
        <div className={`app-fonts ${jakarta.variable} ${readex.variable}`}>
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
