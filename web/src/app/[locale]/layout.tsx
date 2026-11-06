import { NextIntlClientProvider } from 'next-intl';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { Atkinson_Hyperlegible, Gloock, Readex_Pro, Spline_Sans_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { routing } from '@/i18n/routing';
import { AuthProvider } from '@/lib/auth';
import '@/app/globals.css';

// The Apothecary: Gloock sets the label headings, Atkinson Hyperlegible
// (designed for medical readability) carries the body, Readex Pro is the
// Arabic voice, Spline Sans Mono sets the measured doses.
// Variables live on a wrapper div — NOT <html> — so next-themes' class sticks.
const gloock = Gloock({ subsets: ['latin'], weight: ['400'], variable: '--font-gloock' });
const atkinson = Atkinson_Hyperlegible({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-atkinson' });
const readex = Readex_Pro({ subsets: ['arabic', 'latin'], variable: '--font-readex' });
const dosemono = Spline_Sans_Mono({ subsets: ['latin'], variable: '--font-dosemono' });

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
        <div className={`app-fonts ${gloock.variable} ${atkinson.variable} ${readex.variable} ${dosemono.variable}`}>
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
