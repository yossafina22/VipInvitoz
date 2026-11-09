import { Icon } from './Icon';
import { UserAvatar } from './UserAvatar';

type RsvpStatus = 'confirmed' | 'declined' | 'pending';

interface GuestRowProps {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  status: RsvpStatus;
  companions: number;
  table: string;
  index?: number;
  onDelete?: () => void;
  onSend?: () => void;
  deleting?: boolean;
}

const STATUS_STYLE: Record<RsvpStatus, string> = {
  confirmed: 'bg-success-light text-success',
  declined: 'bg-danger-light text-danger',
  pending: 'bg-warning-light text-warning',
};

const STATUS_LABEL: Record<RsvpStatus, string> = {
  confirmed: 'Confirmé',
  declined: 'Décliné',
  pending: 'En attente',
};

/** Grid columns shared between the table header and every GuestRow —
 * hard-coded tracks guarantee header↔rows stay aligned. */
export const GUEST_GRID_COLS = 'grid-cols-[1fr_180px_120px_60px_90px_84px]';

export function GuestRow({
  name,
  phone,
  email,
  status,
  companions,
  table,
  index = 0,
  onDelete,
  onSend,
  deleting = false,
}: GuestRowProps) {
  return (
    <>
      {/* Desktop (md+) — aligned grid */}
      <div
        className={`hidden md:grid ${GUEST_GRID_COLS} items-center gap-4 px-5 py-3 border-b border-border last:border-b-0 hover:bg-background transition-colors`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar name={name} index={index} className="w-8 h-8 shrink-0" />
          <div className="font-body font-bold text-sm text-foreground truncate">{name}</div>
        </div>
        <div className="text-xs text-muted-foreground min-w-0">
          <div className="truncate">{phone}</div>
          {email && <div className="truncate opacity-70">{email}</div>}
        </div>
        <div>
          <span
            className={`text-xs font-body font-bold px-2 py-1 rounded-md whitespace-nowrap ${STATUS_STYLE[status]}`}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>
        <div className="text-center text-xs text-foreground">
          {companions > 0 ? `+${companions}` : '—'}
        </div>
        <div className="text-xs text-muted-foreground truncate">{table}</div>
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={onSend}
            className="p-1.5 text-muted-foreground hover:text-primary rounded-md"
            aria-label="Envoyer"
          >
            <Icon name="send" size={14} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="p-1.5 text-muted-foreground hover:text-danger rounded-md disabled:opacity-40"
            aria-label="Supprimer"
          >
            <Icon name="user-x" size={14} />
          </button>
        </div>
      </div>

      {/* Mobile (< md) — stacked, badge always visible */}
      <div className="md:hidden flex items-start gap-3 px-4 py-3 border-b border-border last:border-b-0">
        <UserAvatar name={name} index={index} className="w-9 h-9 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="font-body font-bold text-sm text-foreground truncate">{name}</div>
            <span
              className={`text-[11px] font-body font-bold px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 ${STATUS_STYLE[status]}`}
            >
              {STATUS_LABEL[status]}
            </span>
          </div>
          <div className="text-xs text-muted-foreground truncate">{phone}</div>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
            <span>{companions > 0 ? `+${companions} acc.` : 'Seul·e'}</span>
            <span>•</span>
            <span className="truncate">{table}</span>
            <span className="ml-auto flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onSend}
                className="text-muted-foreground hover:text-primary"
                aria-label="Envoyer"
              >
                <Icon name="send" size={14} />
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="text-muted-foreground hover:text-danger disabled:opacity-40"
                aria-label="Supprimer"
              >
                <Icon name="user-x" size={14} />
              </button>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
