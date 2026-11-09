import Link from 'next/link';
import { Icon } from './Icon';

type AlertType = 'upgrade' | 'success' | 'warning' | 'info';

interface AlertBannerProps {
  type?: AlertType;
  message: string;
  cta?: string;
  href?: string;
}

const STYLES: Record<AlertType, string> = {
  upgrade: 'bg-gold-light border-gold text-foreground',
  success: 'bg-success-light border-success text-foreground',
  warning: 'bg-warning-light border-warning text-foreground',
  info: 'bg-secondary border-primary text-foreground',
};

const ICONS: Record<AlertType, string> = {
  upgrade: 'crown',
  success: 'check-circle',
  warning: 'alert-triangle',
  info: 'info',
};

export function AlertBanner({ type = 'upgrade', message, cta, href = '#' }: AlertBannerProps) {
  return (
    <div
      className={`flex items-start sm:items-center gap-3 px-4 py-3 rounded-lg border ${STYLES[type]}`}
    >
      <Icon name={ICONS[type]} size={16} className="mt-0.5 sm:mt-0 shrink-0" />
      <p className="flex-1 text-sm font-body">{message}</p>
      {cta && (
        <Link
          href={href}
          className="text-sm font-body font-bold text-primary shrink-0 whitespace-nowrap"
        >
          {cta} →
        </Link>
      )}
    </div>
  );
}
