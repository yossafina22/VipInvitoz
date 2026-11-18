import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LocaleSwitcher } from './LocaleSwitcher';

const COLUMNS = [
  {
    titleKey: 'product.title',
    links: [
      { labelKey: 'product.features', href: '/#features' },
      { labelKey: 'product.pricing', href: '/#pricing' },
      { labelKey: 'product.howto', href: '/#howto' },
      { labelKey: 'product.faq', href: '/#faq' },
    ],
  },
  {
    titleKey: 'ceremonies.title',
    links: [
      { labelKey: 'ceremonies.mariage', href: '/ceremonies/mariage' },
      { labelKey: 'ceremonies.bapteme', href: '/ceremonies/bapteme' },
      { labelKey: 'ceremonies.anniversaire', href: '/ceremonies/anniversaire' },
      { labelKey: 'ceremonies.deuil', href: '/ceremonies/deuil' },
    ],
  },
  {
    titleKey: 'support.title',
    links: [
      { labelKey: 'support.help', href: '/help' },
      { labelKey: 'support.contact', href: '/contact' },
      { labelKey: 'support.privacy', href: '/legal/privacy' },
      { labelKey: 'support.terms', href: '/legal/terms' },
    ],
  },
] as const;

export async function Footer({ variant = 'dark' }: { variant?: 'light' | 'dark' }) {
  const t = await getTranslations('footer');
  const bg = variant === 'light' ? 'bg-dark-surface' : 'bg-dark';
  return (
    <footer className={`${bg} text-primary-foreground pt-12 md:pt-16 pb-8 px-4 md:px-10 lg:px-20`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-10 md:gap-16 mb-10 md:mb-12">
          <div className="md:flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-headings font-bold text-sm">V</span>
              </div>
              <span className="font-headings font-bold text-xl">VipInvitoz</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{t('tagline')}</p>
            <div className="mt-4">
              <LocaleSwitcher />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
            {COLUMNS.map((col) => (
              <div key={col.titleKey}>
                <h4 className="font-body font-bold text-sm mb-3 text-gold">
                  {t(`columns.${col.titleKey}`)}
                </h4>
                <ul className="flex flex-col gap-2">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-sm text-muted-foreground hover:text-primary-foreground transition-colors"
                      >
                        {t(`columns.${l.labelKey}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-col md:flex-row gap-2 md:gap-0 justify-between items-start md:items-center">
          <p className="text-xs text-muted-foreground">{t('copyright')}</p>
          <p className="text-xs text-muted-foreground">{t('madeWith')}</p>
        </div>
      </div>
    </footer>
  );
}
