import type { Metadata } from 'next';
import { DM_Sans, PT_Serif } from 'next/font/google';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale, getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import './globals.css';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { routing } from '@/i18n/routing';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body-dm',
  display: 'swap',
});

const ptSerif = PT_Serif({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-headings-pt',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VipInvitoz — Vos cérémonies, organisées avec cœur',
  description:
    "De l'invitation IA au jour J — mariage, baptême, anniversaire ou deuil. L'app africaine tout-en-un pour les familles d'Afrique et de la diaspora.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${dmSans.variable} ${ptSerif.variable}`}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
