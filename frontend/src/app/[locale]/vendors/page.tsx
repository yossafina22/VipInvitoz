'use client';

import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { PreviewBanner } from '@/components/PreviewBanner';
import { Image } from '@/components/Image';
import { Icon } from '@/components/Icon';

type Status = 'confirmed' | 'pending' | 'contacted';

interface Vendor {
  id: string;
  name: string;
  category: string;
  icon: string;
  image: string;
  price: string;
  status: Status;
  rating: number;
  phone: string;
  nextStep: string;
  deadline: string;
}

const VENDORS: Vendor[] = [
  {
    id: '1',
    name: 'Studio Lumière Dakar',
    category: 'Photo & vidéo',
    icon: 'camera',
    image: '/banani/vendor-photo.jpg',
    price: '150 000 FCFA',
    status: 'confirmed',
    rating: 4.9,
    phone: '+221 77 234 56 78',
    nextStep: 'Shooting pré-mariage',
    deadline: 'Dans 5 jours',
  },
  {
    id: '2',
    name: 'Chez Mama Fatou',
    category: 'Traiteur',
    icon: 'cake',
    image: '/banani/vendor-food.jpg',
    price: '820 000 FCFA',
    status: 'confirmed',
    rating: 4.8,
    phone: '+221 78 445 67 89',
    nextStep: 'Dégustation finale',
    deadline: 'Dans 10 jours',
  },
  {
    id: '3',
    name: 'DJ Papis & Live Band',
    category: 'DJ & musique',
    icon: 'music',
    image: '/banani/vendor-music.jpg',
    price: '200 000 FCFA',
    status: 'confirmed',
    rating: 4.7,
    phone: '+221 76 123 45 67',
    nextStep: 'Playlist + validation',
    deadline: 'Dans 7 jours',
  },
  {
    id: '4',
    name: 'Salle Le Palace Diamniadio',
    category: 'Salle & décor',
    icon: 'building-2',
    image: '/banani/vendor-venue.jpg',
    price: '850 000 FCFA',
    status: 'confirmed',
    rating: 4.6,
    phone: '+221 33 820 12 34',
    nextStep: 'Visite + plan de table',
    deadline: 'Dans 3 jours',
  },
  {
    id: '5',
    name: "Fleuriste Rose d'Or",
    category: 'Décoration',
    icon: 'flower',
    image: '/banani/vendor-flowers.jpg',
    price: '180 000 FCFA',
    status: 'pending',
    rating: 4.5,
    phone: '+221 77 998 76 54',
    nextStep: 'Devis à valider',
    deadline: 'Urgent',
  },
  {
    id: '6',
    name: 'Transport Taxibrousse+',
    category: 'Transport invités',
    icon: 'map-pin',
    image: '/banani/vendor-transport.jpg',
    price: 'Devis en cours',
    status: 'contacted',
    rating: 4.3,
    phone: '+221 77 555 44 33',
    nextStep: 'Première réponse',
    deadline: 'Dans 2 jours',
  },
];

const STATUS_META: Record<Status, { label: string; cls: string }> = {
  confirmed: { label: 'Confirmé', cls: 'bg-success-light text-success' },
  pending: { label: 'En attente', cls: 'bg-warning-light text-warning' },
  contacted: { label: 'Contacté', cls: 'bg-secondary text-primary' },
};

function VendorCard({ v }: { v: Vendor }) {
  const s = STATUS_META[v.status];
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="relative">
        <Image
          ar="16:9"
          src={v.image}
          keywords={v.category.toLowerCase().replace(/[^a-z]/g, ',')}
          prompt={v.name}
          className="w-full"
        />
        <span
          className={`absolute top-3 left-3 text-[11px] font-body font-bold px-2 py-1 rounded-md ${s.cls}`}
        >
          {s.label}
        </span>
        <span className="absolute top-3 right-3 bg-card/90 text-foreground text-xs font-body font-bold px-2 py-1 rounded-md flex items-center gap-1">
          <span className="text-gold">★</span>
          {v.rating}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 bg-secondary rounded-md flex items-center justify-center shrink-0">
            <Icon name={v.icon} size={13} className="text-primary" />
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide font-bold">
            {v.category}
          </div>
        </div>
        <h3 className="font-headings font-bold text-sm md:text-base text-foreground mb-2 truncate">
          {v.name}
        </h3>
        <div className="text-sm font-body font-bold text-primary mb-3">{v.price}</div>

        <div className="flex items-start gap-2 mb-3 pb-3 border-b border-border">
          <Icon name="clock" size={12} className="text-muted-foreground mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-xs text-foreground font-body font-bold truncate">{v.nextStep}</div>
            <div className="text-[11px] text-muted-foreground">{v.deadline}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <a
            href={`tel:${v.phone}`}
            className="flex-1 bg-success text-primary-foreground text-xs font-body font-bold py-2 rounded-md flex items-center justify-center gap-1"
          >
            <Icon name="phone" size={12} />
            Appeler
          </a>
          <button
            type="button"
            className="flex-1 bg-secondary text-primary text-xs font-body font-bold py-2 rounded-md flex items-center justify-center gap-1"
          >
            <Icon name="message-circle" size={12} />
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VendorsPage() {
  const confirmed = VENDORS.filter((v) => v.status === 'confirmed').length;
  const pending = VENDORS.filter((v) => v.status !== 'confirmed').length;

  return (
    <AppLayout pageTitle="Prestataires" tier="vip">
      <PreviewBanner />

      <PageHeader
        title="Coordination prestataires"
        subtitle={`${VENDORS.length} prestataires — ${confirmed} confirmés, ${pending} à relancer`}
      >
        <button
          type="button"
          className="bg-primary text-primary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2"
        >
          <Icon name="plus" size={14} />
          Ajouter
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {VENDORS.map((v) => (
          <VendorCard key={v.id} v={v} />
        ))}
      </div>

      <div className="bg-secondary border border-border rounded-xl p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Icon name="sparkles" size={20} className="text-primary mt-0.5 shrink-0" />
          <div>
            <h3 className="font-headings font-bold text-base text-foreground mb-1">
              Timeline jour J
            </h3>
            <p className="text-sm text-muted-foreground">
              Générez un planning automatique qui synchronise tous vos prestataires.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-body font-bold text-sm shrink-0"
        >
          Générer
        </button>
      </div>
    </AppLayout>
  );
}
