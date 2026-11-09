import Link from 'next/link';
import { Icon } from './Icon';

type Tier = 'freemium' | 'premium' | 'vip';

interface Feature {
  label: string;
  included: boolean;
}

interface PricingCardProps {
  name: string;
  priceAfrica: string;
  priceEurope: string;
  period?: string;
  features: Feature[];
  highlight?: boolean;
  tier?: Tier;
  href?: string;
}

const TIER_COLOR: Record<Tier, string> = {
  freemium: 'text-muted-foreground',
  premium: 'text-primary',
  vip: 'text-gold',
};

export function PricingCard({
  name,
  priceAfrica,
  priceEurope,
  period = '/ trimestre',
  features,
  highlight = false,
  tier = 'premium',
  href = '/auth/signup',
}: PricingCardProps) {
  return (
    <div
      className={`rounded-xl border-2 p-6 md:p-7 flex flex-col relative ${
        highlight ? 'border-primary bg-card shadow-sm' : 'border-border bg-background'
      }`}
    >
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-body font-bold px-3 py-1 rounded-full">
          Populaire
        </div>
      )}
      <div
        className={`text-xs font-body font-bold uppercase tracking-wider mb-3 ${TIER_COLOR[tier]}`}
      >
        {name}
      </div>
      <div className="font-headings font-bold text-3xl text-foreground mb-1">{priceAfrica}</div>
      <div className="text-sm text-muted-foreground mb-1">
        ou {priceEurope} {period}
      </div>
      <div className="text-xs text-muted-foreground mb-6">Afrique &amp; diaspora</div>
      <ul className="flex flex-col gap-2.5 flex-1 mb-6">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
            <span className={`mt-0.5 ${f.included ? 'text-success' : 'text-muted-foreground'}`}>
              <Icon name={f.included ? 'check-circle' : 'circle'} size={14} />
            </span>
            <span className={f.included ? '' : 'text-muted-foreground line-through'}>
              {f.label}
            </span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`text-center font-body font-medium py-3 rounded-lg text-sm transition-colors ${
          highlight
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        }`}
      >
        {tier === 'freemium' ? 'Commencer gratuitement' : 'Choisir ce plan'}
      </Link>
    </div>
  );
}
