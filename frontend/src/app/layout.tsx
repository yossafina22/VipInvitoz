import type { Metadata } from 'next';
import { DM_Sans, PT_Serif } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthProvider } from '@/contexts/AuthContext';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${dmSans.variable} ${ptSerif.variable}`}>
      <body>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
