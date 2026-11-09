import Link from 'next/link';
import { Icon } from './Icon';

type CeremonyType = 'mariage' | 'bapteme' | 'anniversaire' | 'deuil' | 'coutumier';

interface CeremonyCardProps {
  id?: string;
  title: string;
  type: CeremonyType;
  date: string;
  location: string;
  guestsConfirmed: number;
  guestsTotal: number;
  daysLeft: number;
  coverImageUrl?: string | null;
}

const TYPE_COLORS: Record<CeremonyType, string> = {
  mariage: 'bg-secondary text-secondary-foreground',
  bapteme: 'bg-success-light text-success',
  anniversaire: 'bg-gold-light text-gold',
  deuil: 'bg-muted text-muted-foreground',
  coutumier: 'bg-wax-orange/20 text-wax-orange',
};

const TYPE_ICONS: Record<CeremonyType, string> = {
  mariage: 'heart',
  bapteme: 'baby',
  anniversaire: 'cake',
  deuil: 'flower',
  coutumier: 'sparkles',
};

const TYPE_LABELS: Record<CeremonyType, string> = {
  mariage: 'Mariage',
  bapteme: 'Baptême',
  anniversaire: 'Anniversaire',
  deuil: 'Deuil',
  coutumier: 'Coutumier',
};

export function CeremonyCard({
  id = '1',
  title,
  type,
  date,
  location,
  guestsConfirmed,
  guestsTotal,
  daysLeft,
  coverImageUrl,
}: CeremonyCardProps) {
  const pct = guestsTotal > 0 ? Math.round((guestsConfirmed / guestsTotal) * 100) : 0;
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {coverImageUrl ? (
        <img src={coverImageUrl} alt="" className="w-full h-24 object-cover" />
      ) : (
        <div className="h-2 bg-primary" aria-hidden />
      )}
      <div className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div
              className={`inline-flex items-center gap-1.5 text-xs font-body font-medium px-2 py-1 rounded-md mb-2 ${TYPE_COLORS[type]}`}
            >
              <Icon name={TYPE_ICONS[type]} size={12} />
              <span>{TYPE_LABELS[type]}</span>
            </div>
            <h3 className="font-headings font-bold text-base text-foreground leading-tight truncate">
              {title}
            </h3>
          </div>
          <span
            className={`text-xs font-body px-2 py-1 rounded-md whitespace-nowrap shrink-0 ${
              daysLeft > 0 ? 'bg-warning-light text-warning' : 'bg-success-light text-success'
            }`}
          >
            {daysLeft > 0 ? `J-${daysLeft}` : 'Passé'}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Icon name="calendar" size={12} />
            {date}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="map-pin" size={12} />
            {location}
          </span>
        </div>
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>RSVP confirmés</span>
          <span className="font-medium text-foreground">
            {guestsConfirmed}/{guestsTotal}
          </span>
        </div>
        <div
          className="h-1.5 bg-muted rounded-full overflow-hidden"
          aria-label={`${pct}% confirmés`}
        >
          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex gap-2 mt-4">
          <Link
            href={`/ceremonies/${id}/preview`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-sm font-body font-medium bg-secondary text-secondary-foreground py-2 rounded-md"
            aria-label="Voir en tant qu'invité"
          >
            Aperçu
          </Link>
          <Link
            href={`/ceremonies/${id}/editor`}
            className="flex-1 text-center text-sm font-body font-medium bg-primary text-primary-foreground py-2 rounded-md"
          >
            Ouvrir
          </Link>
        </div>
      </div>
    </div>
  );
}
