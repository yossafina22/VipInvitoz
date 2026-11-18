'use client';

import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { PreviewBanner } from '@/components/PreviewBanner';
import { Image } from '@/components/Image';
import { Icon } from '@/components/Icon';

interface Venue {
  id: string;
  label: string;
  address: string;
  time: string;
  type: 'ceremony' | 'reception' | 'after';
}

const VENUES: Venue[] = [
  {
    id: 'v1',
    label: 'Cérémonie religieuse',
    address: 'Grande Mosquée de Dakar — Allées Papa Guèye Fall',
    time: '10:30',
    type: 'ceremony',
  },
  {
    id: 'v2',
    label: 'Réception',
    address: 'Salle Le Palace — Diamniadio, Km 17',
    time: '16:00',
    type: 'reception',
  },
  {
    id: 'v3',
    label: 'After',
    address: 'Rooftop Vista — Les Almadies',
    time: '23:00',
    type: 'after',
  },
];

const TRANSPORT = [
  { icon: 'map-pin', label: "Taxi depuis l'aéroport", detail: '≈ 8 000 FCFA — 25 min' },
  { icon: 'navigation', label: 'Navette privée', detail: 'Départ Hôtel Terrou-Bi — 15:30' },
  { icon: 'map', label: 'Google Maps', detail: 'Itinéraire + trafic en direct' },
];

const INFO = [
  {
    icon: 'calendar',
    title: 'Code vestimentaire',
    desc: 'Grand boubou traditionnel, tons terracotta et doré préférés.',
  },
  {
    icon: 'help-circle',
    title: 'Cadeaux',
    desc: 'Liste de mariage disponible — ou enveloppe au choix.',
  },
  { icon: 'baby', title: 'Enfants', desc: 'Garderie dédiée sur place, animations prévues.' },
];

export default function OrientationPage() {
  return (
    <AppLayout pageTitle="Orientation invités" tier="vip">
      <PreviewBanner />

      <PageHeader
        title="Orientation & navigation"
        subtitle="Guidez vos invités du début à la fin — lieux, horaires, transports, infos pratiques."
      >
        <button
          type="button"
          className="bg-primary text-primary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2"
        >
          <Icon name="share-2" size={14} />
          <span className="hidden sm:inline">Partager aux invités</span>
          <span className="sm:hidden">Partager</span>
        </button>
      </PageHeader>

      {/* Map preview */}
      <div className="bg-card border border-border rounded-xl overflow-hidden mb-6 relative">
        <Image
          ar="16:9"
          keywords="dakar,aerial,map,city"
          prompt="Vue aérienne de Dakar avec points d'intérêt"
          className="w-full"
        />
        <div className="absolute inset-0 bg-dark opacity-30" aria-hidden />
        {/* Pins overlay */}
        <div className="absolute inset-0 flex items-end justify-around pb-6 px-6">
          {VENUES.map((v, i) => (
            <div key={v.id} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg">
                <Icon name="map-pin" size={18} />
              </div>
              <span className="bg-card text-foreground text-[11px] font-body font-bold px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
        <div className="absolute top-4 left-4 bg-card/95 rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm">
          <Icon name="map" size={14} className="text-primary" />
          <span className="text-xs font-body font-bold text-foreground">Carte interactive</span>
        </div>
      </div>

      {/* Timeline + Transport */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-headings font-bold text-base text-foreground mb-4">
            Programme & lieux
          </h3>
          <div className="flex flex-col gap-4">
            {VENUES.map((v, i) => (
              <div key={v.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  {i < VENUES.length - 1 && (
                    <div className="w-0.5 flex-1 bg-border mt-1 min-h-[1.5rem]" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-body font-bold text-sm text-foreground">{v.label}</span>
                    <span className="text-xs bg-secondary text-primary font-body font-bold px-2 py-0.5 rounded-md">
                      {v.time}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{v.address}</div>
                  <button
                    type="button"
                    className="text-xs text-primary font-body font-bold mt-1 flex items-center gap-1"
                  >
                    <Icon name="navigation" size={11} /> Itinéraire
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-headings font-bold text-base text-foreground mb-4">Pour venir</h3>
          <div className="flex flex-col gap-3">
            {TRANSPORT.map((t) => (
              <div
                key={t.label}
                className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg hover:border-primary transition-colors"
              >
                <div className="w-9 h-9 bg-secondary rounded-md flex items-center justify-center shrink-0">
                  <Icon name={t.icon} size={14} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-body font-bold text-sm text-foreground">{t.label}</div>
                  <div className="text-xs text-muted-foreground truncate">{t.detail}</div>
                </div>
                <Icon name="chevron-right" size={14} className="text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pratical info */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h3 className="font-headings font-bold text-base text-foreground mb-4">Infos pratiques</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {INFO.map((i) => (
            <div key={i.title} className="flex items-start gap-3">
              <div className="w-9 h-9 bg-gold-light rounded-md flex items-center justify-center shrink-0">
                <Icon name={i.icon} size={14} className="text-gold" />
              </div>
              <div>
                <div className="font-body font-bold text-sm text-foreground mb-0.5">{i.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{i.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
