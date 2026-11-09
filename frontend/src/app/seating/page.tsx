'use client';

import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { PreviewBanner } from '@/components/PreviewBanner';
import { UserAvatar } from '@/components/UserAvatar';
import { Icon } from '@/components/Icon';

interface Seat {
  name: string;
  index: number;
}

interface TableData {
  id: string;
  label: string;
  capacity: number;
  guests: Seat[];
}

const TABLES: TableData[] = [
  {
    id: 't1',
    label: 'Table 1 — Famille mariée',
    capacity: 8,
    guests: [
      { name: 'Papa Diallo', index: 0 },
      { name: 'Maman Diallo', index: 1 },
      { name: 'Tonton Mamadou', index: 2 },
      { name: 'Tata Awa', index: 3 },
      { name: 'Cousin Ousmane', index: 4 },
      { name: 'Cousine Mariam', index: 5 },
    ],
  },
  {
    id: 't2',
    label: 'Table 2 — Famille marié',
    capacity: 8,
    guests: [
      { name: 'Papa Camara', index: 6 },
      { name: 'Maman Camara', index: 7 },
      { name: 'Oncle Sidi', index: 8 },
      { name: 'Tata Bintou', index: 9 },
    ],
  },
  {
    id: 't3',
    label: 'Table 3 — Amis Dakar',
    capacity: 8,
    guests: [
      { name: 'Amadou Diallo', index: 10 },
      { name: 'Awa Camara', index: 11 },
      { name: 'Kofi Mensah', index: 12 },
      { name: 'Fatou K.', index: 13 },
      { name: 'Ibrahim Sow', index: 14 },
    ],
  },
  {
    id: 't4',
    label: 'Table 4 — Collègues',
    capacity: 6,
    guests: [
      { name: 'Raoul M.', index: 15 },
      { name: 'Aïssatou D.', index: 16 },
      { name: 'Sophie T.', index: 17 },
    ],
  },
];

const UNASSIGNED: Seat[] = [
  { name: 'Mamadou Sy', index: 18 },
  { name: 'Fatoumata Ba', index: 19 },
  { name: 'Alioune B.', index: 20 },
  { name: 'Khadija N.', index: 21 },
  { name: 'Moussa D.', index: 22 },
];

function TableCard({ table }: { table: TableData }) {
  const empty = table.capacity - table.guests.length;
  const full = empty === 0;
  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="font-headings font-bold text-sm text-foreground truncate">
          {table.label}
        </div>
        <span
          className={`text-[11px] font-body font-bold px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 ${
            full ? 'bg-success-light text-success' : 'bg-warning-light text-warning'
          }`}
        >
          {table.guests.length}/{table.capacity}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {table.guests.map((g) => (
          <div
            key={g.name}
            className="flex items-center gap-1.5 bg-background border border-border rounded-full pl-0.5 pr-2 py-0.5"
          >
            <UserAvatar name={g.name} index={g.index} className="w-5 h-5" />
            <span className="text-[11px] font-body text-foreground truncate max-w-[6.5rem]">
              {g.name}
            </span>
          </div>
        ))}
        {Array.from({ length: empty }).map((_, i) => (
          <div
            key={`e-${i}`}
            className="flex items-center justify-center w-5 h-5 border border-dashed border-border rounded-full text-muted-foreground"
            aria-label="Siège vide"
          >
            <Icon name="plus" size={10} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SeatingPage() {
  const totalAssigned = TABLES.reduce((sum, t) => sum + t.guests.length, 0);
  const totalCapacity = TABLES.reduce((sum, t) => sum + t.capacity, 0);
  return (
    <AppLayout pageTitle="Plan de table" tier="premium">
      <PreviewBanner />

      <PageHeader
        title="Plan de table"
        subtitle={`${totalAssigned}/${totalCapacity} invités placés — ${UNASSIGNED.length} à répartir`}
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="bg-secondary text-secondary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <Icon name="sparkles" size={14} />
            <span className="hidden sm:inline">Auto-placer IA</span>
            <span className="sm:hidden">IA</span>
          </button>
          <button
            type="button"
            className="bg-primary text-primary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <Icon name="plus" size={14} />
            Table
          </button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TABLES.map((t) => (
            <TableCard key={t.id} table={t} />
          ))}
          <button
            type="button"
            className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors min-h-[160px]"
          >
            <Icon name="plus" size={28} />
            <span className="text-sm font-body font-bold">Ajouter une table</span>
          </button>
        </div>

        <aside className="bg-card border border-border rounded-xl p-4 lg:sticky lg:top-4 lg:self-start">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="users" size={14} className="text-primary" />
            <h3 className="font-headings font-bold text-sm text-foreground">
              À placer ({UNASSIGNED.length})
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Glisse-dépose un invité sur une table, ou laisse l&apos;IA proposer un plan.
          </p>
          <div className="flex flex-col gap-2">
            {UNASSIGNED.map((g) => (
              <div
                key={g.name}
                draggable
                className="flex items-center gap-2 bg-background border border-border rounded-lg px-2 py-1.5 cursor-grab active:cursor-grabbing hover:border-primary transition-colors"
              >
                <UserAvatar name={g.name} index={g.index} className="w-7 h-7 shrink-0" />
                <span className="text-xs font-body font-bold text-foreground truncate">
                  {g.name}
                </span>
                <Icon name="move" size={12} className="text-muted-foreground ml-auto shrink-0" />
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="bg-secondary border border-border rounded-xl p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Icon name="sparkles" size={20} className="text-primary mt-0.5 shrink-0" />
          <div>
            <h3 className="font-headings font-bold text-base text-foreground mb-1">
              Auto-placement intelligent
            </h3>
            <p className="text-sm text-muted-foreground">
              L&apos;IA regroupe les familles, sépare les tensions connues et équilibre les tables
              en 1 clic.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-body font-bold text-sm shrink-0"
        >
          Lancer l&apos;IA
        </button>
      </div>
    </AppLayout>
  );
}
