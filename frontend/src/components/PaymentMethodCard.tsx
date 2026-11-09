import { Icon } from './Icon';

interface PaymentMethodCardProps {
  name: string;
  icon: string;
  region: string;
  selected?: boolean;
  onClick?: () => void;
}

export function PaymentMethodCard({
  name,
  icon,
  region,
  selected = false,
  onClick,
}: PaymentMethodCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border-2 transition-colors ${
        selected ? 'border-primary bg-secondary' : 'border-border bg-card hover:border-primary/60'
      }`}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}
      >
        <Icon name={icon} size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-body font-bold text-sm text-foreground">{name}</div>
        <div className="text-xs text-muted-foreground">{region}</div>
      </div>
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
          selected ? 'border-primary bg-primary' : 'border-border'
        }`}
      >
        {selected && <Icon name="check" size={10} className="text-primary-foreground" />}
      </div>
    </button>
  );
}
