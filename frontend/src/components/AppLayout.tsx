'use client';

import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { SideBar } from './SideBar';
import { UserAvatar } from './UserAvatar';
import { useAuth } from '@/contexts/AuthContext';

type Tier = 'freemium' | 'premium' | 'vip';

interface AppLayoutProps {
  children: ReactNode;
  pageTitle: string;
  tier?: Tier;
}

export function AppLayout({ children, pageTitle, tier = 'premium' }: AppLayoutProps) {
  const { user } = useAuth();
  const displayName = user?.email.split('@')[0] ?? '';
  return (
    <div className="flex bg-background min-h-screen">
      <SideBar tier={tier} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-card border-b border-border px-4 md:px-8 h-14 flex items-center justify-between gap-3">
          <h1 className="font-headings font-bold text-base md:text-lg text-foreground truncate">
            {pageTitle}
          </h1>
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <button
              type="button"
              className="relative p-2 text-muted-foreground"
              aria-label="Notifications"
            >
              <Icon name="bell" size={18} />
              <span
                className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"
                aria-hidden
              />
            </button>
            <div className="flex items-center gap-2">
              <UserAvatar name={displayName} index={0} className="w-8 h-8" />
              <span className="hidden sm:inline text-sm font-body font-medium text-foreground truncate max-w-[10rem]">
                {displayName}
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 md:px-8 py-4 md:py-6">{children}</main>
      </div>
    </div>
  );
}
