'use client';

import { useTransition } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const LABELS: Record<(typeof routing.locales)[number], string> = {
  fr: 'FR',
  en: 'EN',
};

export function LocaleSwitcher({ className = '' }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function switchTo(next: (typeof routing.locales)[number]) {
    if (next === locale || pending) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div
      className={`inline-flex items-center rounded-full border border-border bg-background/60 p-0.5 text-xs font-body font-bold ${className}`}
      role="group"
      aria-label="Language"
    >
      {routing.locales.map((l) => {
        const isActive = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => switchTo(l)}
            disabled={isActive || pending}
            aria-pressed={isActive}
            className={`px-2.5 py-1 rounded-full transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground disabled:opacity-50'
            }`}
          >
            {LABELS[l]}
          </button>
        );
      })}
    </div>
  );
}
