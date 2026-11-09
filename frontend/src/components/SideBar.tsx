'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './Icon';

type Tier = 'freemium' | 'premium' | 'vip';

interface SideBarProps {
  tier?: Tier;
}

interface NavItem {
  label: string;
  icon: string;
  href: string;
  tier?: Tier;
}

const ITEMS: NavItem[] = [
  { label: 'Tableau de bord', icon: 'calendar-heart', href: '/dashboard' },
  { label: 'Cérémonies', icon: 'calendar', href: '/ceremonies' },
  { label: 'Invités', icon: 'users', href: '/guests' },
  { label: 'Co-organisateurs', icon: 'user-plus', href: '/co-organizers' },
  { label: 'Plan de table', icon: 'table-2', href: '/seating', tier: 'premium' },
  { label: 'Projection live', icon: 'projector', href: '/projection', tier: 'premium' },
  { label: "Livre d'or", icon: 'book-open', href: '/guestbook', tier: 'premium' },
  { label: 'Budget', icon: 'wallet', href: '/budget', tier: 'vip' },
  { label: 'Prestataires', icon: 'users', href: '/vendors', tier: 'vip' },
  { label: 'Orientation', icon: 'navigation', href: '/orientation', tier: 'vip' },
];

const TIER_RANK: Record<Tier, number> = { freemium: 0, premium: 1, vip: 2 };

export function SideBar({ tier = 'premium' }: SideBarProps) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-60 shrink-0 bg-card border-r border-border flex-col">
      <div className="px-5 h-16 flex items-center gap-2 border-b border-border">
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
          <span className="text-primary-foreground font-headings font-bold text-sm">V</span>
        </div>
        <span className="font-headings font-bold text-lg text-foreground">VipInvitoz</span>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {ITEMS.map((item) => {
          const locked = item.tier ? TIER_RANK[tier] < TIER_RANK[item.tier] : false;
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-body transition-colors ${
                active
                  ? 'bg-secondary text-primary font-bold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              } ${locked ? 'opacity-60' : ''}`}
            >
              <Icon name={item.icon} size={16} />
              <span className="flex-1">{item.label}</span>
              {locked && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-gold">
                  {item.tier === 'vip' ? 'VIP' : 'PRO'}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-border flex flex-col gap-1">
        <Link
          href="/subscription"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-body text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Icon name="crown" size={16} />
          <span>Abonnement</span>
        </Link>
        <Link
          href="/account"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-body text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Icon name="settings" size={16} />
          <span>Paramètres</span>
        </Link>
      </div>
    </aside>
  );
}
