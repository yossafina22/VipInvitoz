import { Icon } from './Icon';

interface PreviewBannerProps {
  message?: string;
}

export function PreviewBanner({
  message = 'Preview visuel — pas encore branché au backend. Les données affichées sont des exemples.',
}: PreviewBannerProps) {
  return (
    <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-lg border border-dashed border-gold bg-gold-light text-foreground">
      <Icon name="info" size={16} className="mt-0.5 shrink-0 text-gold" />
      <p className="flex-1 text-xs font-body">{message}</p>
    </div>
  );
}
