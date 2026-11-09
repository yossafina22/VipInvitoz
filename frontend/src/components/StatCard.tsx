import { Icon } from './Icon';

type StatColor = 'primary' | 'gold' | 'success' | 'muted';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color?: StatColor;
  sub?: string;
}

const COLORS: Record<StatColor, string> = {
  primary: 'bg-secondary text-primary',
  gold: 'bg-gold-light text-gold',
  success: 'bg-success-light text-success',
  muted: 'bg-muted text-muted-foreground',
};

export function StatCard({ label, value, icon, color = 'primary', sub }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-body text-muted-foreground">{label}</span>
        <div
          className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${COLORS[color]}`}
        >
          <Icon name={icon} size={18} />
        </div>
      </div>
      <div>
        <div className="font-headings font-bold text-2xl md:text-3xl text-foreground">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </div>
    </div>
  );
}
