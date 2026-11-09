import type { ReactNode } from 'react';
import Link from 'next/link';
import { Image } from './Image';
import { UserAvatar } from './UserAvatar';
import { WaxPattern } from './WaxPattern';
import { NavBar } from './NavBar';

interface AuthShellProps {
  active: 'signup' | 'login';
  title: string;
  subtitle: string;
  children: ReactNode;
}

const STATS = [
  { val: '20', label: 'invités offerts' },
  { val: '6', label: 'modifications IA' },
  { val: '0 FCFA', label: 'pour commencer' },
];

export function AuthShell({ active, title, subtitle, children }: AuthShellProps) {
  return (
    <div className="bg-background font-body min-h-screen flex flex-col">
      <NavBar activePage="" />
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        <div className="relative hidden lg:flex bg-dark-surface overflow-hidden flex-col justify-between p-10 xl:p-16">
          <WaxPattern opacity={0.08} />
          <div className="relative z-10">
            <div className="text-xs uppercase tracking-widest text-gold font-bold mb-6">
              VipInvitoz
            </div>
            <h2 className="font-headings font-bold text-3xl xl:text-4xl text-primary-foreground leading-tight mb-4">
              Votre cérémonie commence ici.
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Créez votre compte en 2 minutes et générez votre première invitation dès
              aujourd&apos;hui — gratuitement.
            </p>
          </div>
          <div className="relative z-10">
            <Image
              ar="4:3"
              src="/banani/auth.jpg"
              prompt="Famille africaine joyeuse célébrant un mariage, lumières dorées et terracotta"
              className="w-full rounded-xl"
            />
          </div>
          <div className="relative z-10 flex gap-6 mt-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-headings font-bold text-2xl text-gold">{s.val}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center px-4 py-10 sm:px-8 md:px-12 lg:px-16 xl:px-20 bg-background">
          <div className="mx-auto w-full max-w-md">
            <div className="flex bg-muted rounded-xl p-1 mb-6 md:mb-8 w-full">
              <Link
                href="/auth/signup"
                className={`flex-1 text-sm font-body text-center py-2 rounded-lg transition-colors ${
                  active === 'signup'
                    ? 'bg-card font-bold text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                Créer un compte
              </Link>
              <Link
                href="/auth/login"
                className={`flex-1 text-sm font-body text-center py-2 rounded-lg transition-colors ${
                  active === 'login' ? 'bg-card font-bold text-foreground' : 'text-muted-foreground'
                }`}
              >
                Se connecter
              </Link>
            </div>
            <h1 className="font-headings font-bold text-2xl md:text-3xl text-foreground mb-2">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground mb-6 md:mb-8">{subtitle}</p>
            {children}
            <div className="flex items-center gap-3 mt-8 p-4 bg-secondary rounded-xl border border-border">
              <div className="flex -space-x-2 shrink-0">
                {(['Fatou Diop', 'Aïcha Sow', 'Mariama Fall'] as const).map((n, i) => (
                  <UserAvatar key={i} index={i} name={n} className="w-8 h-8 border-2 border-card" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Rejoignez 50 000+ familles qui utilisent VipInvitoz
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
