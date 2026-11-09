import Link from 'next/link';

const COLUMNS = [
  {
    title: 'Produit',
    links: [
      { label: 'Fonctionnalités', href: '/#features' },
      { label: 'Tarifs', href: '/#pricing' },
      { label: 'Comment ça marche', href: '/#howto' },
      { label: 'FAQ', href: '/#faq' },
    ],
  },
  {
    title: 'Cérémonies',
    links: [
      { label: 'Mariage', href: '/ceremonies/mariage' },
      { label: 'Baptême', href: '/ceremonies/bapteme' },
      { label: 'Anniversaire', href: '/ceremonies/anniversaire' },
      { label: 'Deuil', href: '/ceremonies/deuil' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: "Centre d'aide", href: '/help' },
      { label: 'Contact', href: '/contact' },
      { label: 'Politique de confidentialité', href: '/legal/privacy' },
      { label: 'CGU', href: '/legal/terms' },
    ],
  },
];

export function Footer({ variant = 'dark' }: { variant?: 'light' | 'dark' }) {
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
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              La plateforme tout-en-un pour les familles africaines — de l&apos;invitation au jour
              J.
            </p>
            <div className="flex gap-2 mt-4">
              {['FR', 'EN', 'DE'].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  className={`text-xs px-3 py-1 rounded-md border border-border ${
                    lang === 'FR'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-primary-foreground'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h4 className="font-body font-bold text-sm mb-3 text-gold">{col.title}</h4>
                <ul className="flex flex-col gap-2">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-sm text-muted-foreground hover:text-primary-foreground transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-col md:flex-row gap-2 md:gap-0 justify-between items-start md:items-center">
          <p className="text-xs text-muted-foreground">© 2025 VipInvitoz. Tous droits réservés.</p>
          <p className="text-xs text-muted-foreground">Fait avec ❤️ pour les familles africaines</p>
        </div>
      </div>
    </footer>
  );
}
