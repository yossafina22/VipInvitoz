'use client';

import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { PreviewBanner } from '@/components/PreviewBanner';
import { Icon } from '@/components/Icon';

interface Expense {
  id: string;
  category: string;
  label: string;
  amount: number;
  status: 'paid' | 'pending' | 'planned';
  date: string;
}

interface Category {
  key: string;
  label: string;
  icon: string;
  budget: number;
  spent: number;
  color: string;
}

const CATEGORIES: Category[] = [
  {
    key: 'venue',
    label: 'Salle & décor',
    icon: 'building-2',
    budget: 1_200_000,
    spent: 950_000,
    color: 'bg-wax-teal',
  },
  {
    key: 'catering',
    label: 'Traiteur',
    icon: 'cake',
    budget: 800_000,
    spent: 820_000,
    color: 'bg-wax-orange',
  },
  {
    key: 'dress',
    label: 'Tenues',
    icon: 'flower',
    budget: 500_000,
    spent: 420_000,
    color: 'bg-gold',
  },
  {
    key: 'media',
    label: 'Photo & vidéo',
    icon: 'camera',
    budget: 300_000,
    spent: 150_000,
    color: 'bg-primary',
  },
  {
    key: 'music',
    label: 'DJ & musique',
    icon: 'music',
    budget: 250_000,
    spent: 200_000,
    color: 'bg-success',
  },
  {
    key: 'other',
    label: 'Divers',
    icon: 'help-circle',
    budget: 200_000,
    spent: 80_000,
    color: 'bg-muted-foreground',
  },
];

const EXPENSES: Expense[] = [
  {
    id: '1',
    category: 'Traiteur',
    label: 'Acompte Chez Mama Fatou (50%)',
    amount: 420_000,
    status: 'paid',
    date: '14 oct.',
  },
  {
    id: '2',
    category: 'Salle & décor',
    label: 'Location salle Diamniadio',
    amount: 850_000,
    status: 'paid',
    date: '08 oct.',
  },
  {
    id: '3',
    category: 'DJ & musique',
    label: 'DJ Papis — acompte',
    amount: 100_000,
    status: 'paid',
    date: '02 oct.',
  },
  {
    id: '4',
    category: 'Photo & vidéo',
    label: 'Photographe Studio Lumière',
    amount: 150_000,
    status: 'pending',
    date: '20 nov.',
  },
  {
    id: '5',
    category: 'Traiteur',
    label: 'Solde traiteur',
    amount: 400_000,
    status: 'planned',
    date: '25 nov.',
  },
  {
    id: '6',
    category: 'Tenues',
    label: 'Boubou mariée + accessoires',
    amount: 420_000,
    status: 'paid',
    date: '28 sept.',
  },
];

const STATUS_STYLE: Record<Expense['status'], string> = {
  paid: 'bg-success-light text-success',
  pending: 'bg-warning-light text-warning',
  planned: 'bg-secondary text-primary',
};

const STATUS_LABEL: Record<Expense['status'], string> = {
  paid: 'Payé',
  pending: 'En attente',
  planned: 'Prévu',
};

const fmt = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

export default function BudgetPage() {
  const totalBudget = CATEGORIES.reduce((s, c) => s + c.budget, 0);
  const totalSpent = CATEGORIES.reduce((s, c) => s + c.spent, 0);
  const remaining = totalBudget - totalSpent;
  const pct = Math.min(100, Math.round((totalSpent / totalBudget) * 100));
  const over = totalSpent > totalBudget;

  return (
    <AppLayout pageTitle="Budget" tier="vip">
      <PreviewBanner />

      <PageHeader
        title="Suivi budget"
        subtitle="Garde l'œil sur chaque poste — FCFA ou €, mis à jour en temps réel."
      >
        <div className="flex gap-2">
          <button
            type="button"
            className="bg-secondary text-secondary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <Icon name="download" size={14} />
            <span className="hidden sm:inline">Exporter</span>
          </button>
          <button
            type="button"
            className="bg-primary text-primary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <Icon name="plus" size={14} />
            Dépense
          </button>
        </div>
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs text-muted-foreground mb-1">Budget total</div>
          <div className="font-headings font-bold text-2xl md:text-3xl text-foreground mb-2">
            {fmt(totalBudget)}
          </div>
          <div className="text-xs text-muted-foreground">
            ≈ {Math.round(totalBudget / 655.957)} €
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs text-muted-foreground mb-1">Dépensé</div>
          <div
            className={`font-headings font-bold text-2xl md:text-3xl mb-2 ${over ? 'text-danger' : 'text-foreground'}`}
          >
            {fmt(totalSpent)}
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${over ? 'bg-danger' : 'bg-primary'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">{pct}% du budget</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs text-muted-foreground mb-1">Restant</div>
          <div
            className={`font-headings font-bold text-2xl md:text-3xl mb-2 ${remaining < 0 ? 'text-danger' : 'text-success'}`}
          >
            {remaining < 0 ? '−' : ''}
            {fmt(Math.abs(remaining))}
          </div>
          <div className="text-xs text-muted-foreground">Jour J dans 18 jours</div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h3 className="font-headings font-bold text-base text-foreground mb-4">Par catégorie</h3>
        <div className="flex flex-col gap-4">
          {CATEGORIES.map((c) => {
            const catPct = Math.min(100, Math.round((c.spent / c.budget) * 100));
            const catOver = c.spent > c.budget;
            return (
              <div key={c.key}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${c.color}/20`}
                  >
                    <Icon name={c.icon} size={14} className={c.color.replace('bg-', 'text-')} />
                  </div>
                  <span className="text-sm font-body font-bold text-foreground flex-1 min-w-0 truncate">
                    {c.label}
                  </span>
                  <span
                    className={`text-xs font-body font-bold tabular-nums ${catOver ? 'text-danger' : 'text-muted-foreground'}`}
                  >
                    {fmt(c.spent)} / {fmt(c.budget)}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${catOver ? 'bg-danger' : 'bg-primary'}`}
                    style={{ width: `${catPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent expenses */}
      <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-headings font-bold text-base text-foreground">Dépenses récentes</h3>
          <button type="button" className="text-xs text-primary font-body font-bold">
            Tout voir
          </button>
        </div>
        <div className="divide-y divide-border">
          {EXPENSES.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-background transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="font-body font-bold text-sm text-foreground truncate">
                  {e.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {e.category} · {e.date}
                </div>
              </div>
              <span
                className={`text-[11px] font-body font-bold px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 ${STATUS_STYLE[e.status]}`}
              >
                {STATUS_LABEL[e.status]}
              </span>
              <div className="text-sm font-body font-bold tabular-nums shrink-0 w-24 text-right">
                {fmt(e.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
