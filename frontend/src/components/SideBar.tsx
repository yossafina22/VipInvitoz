'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { usePathname } from '@/i18n/navigation';
import { Icon } from './Icon';

type Tier = 'freemium' | 'premium' | 'vip';

interface SideBarProps {
  tier?: Tier;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  labelKey: string;
  icon: string;
  href: string;
  tier?: Tier;
}

const ITEMS: NavItem[] = [
  { labelKey: 'dashboard', icon: 'calendar-heart', href: '/dashboard' },
  { labelKey: 'ceremonies', icon: 'calendar', href: '/ceremonies' },
  { labelKey: 'guests', icon: 'users', href: '/guests' },
  { labelKey: 'coOrganizers', icon: 'user-plus', href: '/co-organizers' },
  { labelKey: 'seating', icon: 'table-2', href: '/seating', tier: 'premium' },
  { labelKey: 'projection', icon: 'projector', href: '/projection', tier: 'premium' },
  { labelKey: 'guestbook', icon: 'book-open', href: '/guestbook', tier: 'premium' },
  { labelKey: 'budget', icon: 'wallet', href: '/budget', tier: 'vip' },
  { labelKey: 'vendors', icon: 'users', href: '/vendors', tier: 'vip' },
  { labelKey: 'orientation', icon: 'navigation', href: '/orientation', tier: 'vip' },
];

const TIER_RANK: Record<Tier, number> = { freemium: 0, premium: 1, vip: 2 };

export function SideBar({ tier = 'premium', mobileOpen = false, onMobileClose }: SideBarProps) {
  const pathname = usePathname();
  const t = useTranslations('sidebar');

  // Lock body scroll while the drawer is open on mobile.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label={t('closeMenuLabel')}
          onClick={onMobileClose}
          className="md:hidden fixed inset-0 z-40 bg-black/50"
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50 w-72 md:w-60 shrink-0
          bg-card border-r border-border flex flex-col
          transform transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="px-5 h-16 flex items-center justify-between gap-2 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-headings font-bold text-sm">V</span>
            </div>
            <span className="font-headings font-bold text-lg text-foreground truncate">
              VipInvitoz
            </span>
          </div>
          {/* Mobile close button */}
          <button
            type="button"
            onClick={onMobileClose}
            aria-label={t('closeMenuLabel')}
            className="md:hidden p-1 text-muted-foreground hover:text-foreground shrink-0"
          >
            <Icon name="x" size={20} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {ITEMS.map((item) => {
            const locked = item.tier ? TIER_RANK[tier] < TIER_RANK[item.tier] : false;
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onMobileClose?.()}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-body transition-colors ${
                  active
                    ? 'bg-secondary text-primary font-bold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                } ${locked ? 'opacity-60' : ''}`}
              >
                <Icon name={item.icon} size={16} />
                <span className="flex-1">{t(item.labelKey)}</span>
                {locked && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-gold">
                    {item.tier === 'vip' ? 'VIP' : 'PRO'}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
