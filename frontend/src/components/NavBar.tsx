'use client';

import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from './Icon';
import { LocaleSwitcher } from './LocaleSwitcher';
import { useAuth } from '@/contexts/AuthContext';

const LINKS = [
  { labelKey: 'home', key: 'accueil', href: '/' },
  { labelKey: 'features', key: 'features', href: '/#features' },
  { labelKey: 'howto', key: 'howto', href: '/#howto' },
  { labelKey: 'pricing', key: 'pricing', href: '/#pricing' },
] as const;

interface NavBarProps {
  activePage?: string;
  variant?: 'light' | 'dark';
}

export function NavBar({ activePage = 'accueil', variant = 'light' }: NavBarProps) {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();
  const t = useTranslations('nav');
  const isDark = variant === 'dark';
  const bg = isDark ? 'bg-dark-surface' : 'bg-background';
  const textColor = isDark ? 'text-primary-foreground' : 'text-foreground';
  const linkColor = isDark ? 'text-gold-light' : 'text-muted-foreground';
  const borderColor = isDark ? 'border-dark' : 'border-border';

  return (
    <nav className={`${bg} border-b ${borderColor} relative z-20`}>
      <div className="max-w-7xl mx-auto px-4 md:px-10 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-headings font-bold text-sm">V</span>
          </div>
          <span className={`font-headings font-bold text-lg md:text-xl ${textColor}`}>
            VipInvitoz
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {LINKS.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              className={`text-sm font-body transition-colors ${
                l.key === activePage
                  ? 'text-primary font-bold border-b-2 border-primary pb-0.5'
                  : `${linkColor} hover:text-primary`
              }`}
            >
              {t(l.labelKey)}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <LocaleSwitcher />
          {loading ? null : user ? (
            <Link
              href="/dashboard"
              className="text-sm font-body font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md"
            >
              {t('dashboard')}
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className={`text-sm font-body font-medium ${textColor} px-4 py-2 rounded-md border ${borderColor}`}
              >
                {t('login')}
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm font-body font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md"
              >
                {t('signup')}
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`md:hidden p-2 ${textColor}`}
          aria-expanded={open}
          aria-label={t('menuLabel')}
        >
          <Icon name={open ? 'x' : 'menu'} size={22} />
        </button>
      </div>

      {open && (
        <div className={`md:hidden ${bg} border-t ${borderColor} px-4 py-4 flex flex-col gap-2`}>
          {LINKS.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`text-base font-body py-2 ${
                l.key === activePage ? 'text-primary font-bold' : linkColor
              }`}
            >
              {t(l.labelKey)}
            </Link>
          ))}
          <div className="h-px bg-border my-2" />
          <div className="flex justify-center">
            <LocaleSwitcher />
          </div>
          {loading ? null : user ? (
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="w-full text-center text-sm font-body font-medium bg-primary text-primary-foreground px-4 py-3 rounded-md"
            >
              {t('dashboard')}
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className={`w-full text-center text-sm font-body font-medium ${textColor} px-4 py-3 rounded-md border ${borderColor}`}
              >
                {t('login')}
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setOpen(false)}
                className="w-full text-center text-sm font-body font-medium bg-primary text-primary-foreground px-4 py-3 rounded-md"
              >
                {t('signup')}
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
