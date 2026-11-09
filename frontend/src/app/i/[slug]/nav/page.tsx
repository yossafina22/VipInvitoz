'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Icon } from '@/components/Icon';

interface GuestAction {
  href: string;
  icon: string;
  title: string;
  desc: string;
  cta: string;
}

const ACTIONS: Omit<GuestAction, 'href'>[] = [
  {
    icon: 'calendar-heart',
    title: 'Mon invitation',
    desc: 'Programme, horaires, lieux',
    cta: 'Voir',
  },
  {
    icon: 'check-circle',
    title: 'Confirmer ma présence',
    desc: 'RSVP + accompagnants',
    cta: 'Répondre',
  },
  {
    icon: 'navigation',
    title: 'Itinéraire',
    desc: 'Comment venir le jour J',
    cta: 'Ouvrir',
  },
  {
    icon: 'camera',
    title: 'Envoyer une photo',
    desc: 'Projection en direct pendant la fête',
    cta: 'Participer',
  },
  {
    icon: 'book-open',
    title: "Livre d'or",
    desc: 'Laissez un mot, un vocal ou une vidéo',
    cta: 'Écrire',
  },
  {
    icon: 'qr-code',
    title: 'Mon QR check-in',
    desc: "À présenter à l'entrée",
    cta: 'Afficher',
  },
];

export default function GuestNavPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? 'ceremony';

  const links: GuestAction[] = [
    { ...ACTIONS[0]!, href: `/i/${slug}` },
    { ...ACTIONS[1]!, href: `/i/${slug}#rsvp` },
    { ...ACTIONS[2]!, href: `/i/${slug}/directions` },
    { ...ACTIONS[3]!, href: `/i/${slug}/contribute` },
    { ...ACTIONS[4]!, href: `/i/${slug}/guestbook` },
    { ...ACTIONS[5]!, href: `/i/${slug}/qr` },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="bg-gradient-to-b from-secondary to-background px-4 pt-6 pb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full mb-4">
          <Icon name="sparkles" size={12} />
          Invitation familiale
        </div>
        <h1 className="font-headings font-bold text-2xl sm:text-3xl text-foreground mb-2">
          Aïssatou & Moussa
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          Vous êtes cordialement invité·e à notre mariage
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-foreground">
          <div className="flex items-center gap-1.5">
            <Icon name="calendar" size={13} className="text-primary" />
            <span className="font-body font-bold">25 nov. 2026</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Icon name="map-pin" size={13} className="text-primary" />
            <span className="font-body font-bold">Dakar</span>
          </div>
        </div>
      </header>

      {/* Actions grid */}
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-3">
          {links.map((a) => (
            <Link
              key={a.title}
              href={a.href}
              className="group bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-secondary group-hover:bg-primary rounded-xl flex items-center justify-center shrink-0 transition-colors">
                <Icon
                  name={a.icon}
                  size={20}
                  className="text-primary group-hover:text-primary-foreground transition-colors"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-headings font-bold text-sm text-foreground mb-0.5">
                  {a.title}
                </div>
                <div className="text-xs text-muted-foreground truncate">{a.desc}</div>
              </div>
              <div className="flex items-center gap-1 text-primary font-body font-bold text-xs shrink-0">
                {a.cta}
                <Icon name="chevron-right" size={14} />
              </div>
            </Link>
          ))}
        </div>

        {/* Help */}
        <div className="mt-6 bg-secondary border border-border rounded-xl p-4 flex items-start gap-3">
          <Icon name="help-circle" size={18} className="text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-body font-bold text-sm text-foreground mb-0.5">Une question ?</div>
            <div className="text-xs text-muted-foreground mb-2">
              Contactez les mariés ou leur témoin via WhatsApp.
            </div>
            <a
              href="https://wa.me/221771234567"
              className="inline-flex items-center gap-1.5 text-xs font-body font-bold text-success"
            >
              <Icon name="message-circle" size={12} />
              Ouvrir WhatsApp
            </a>
          </div>
        </div>
      </main>

      <footer className="text-center pb-6 pt-2">
        <p className="text-[11px] text-muted-foreground">
          Propulsé par <span className="font-body font-bold text-primary">VipInvitoz</span>
        </p>
      </footer>
    </div>
  );
}
