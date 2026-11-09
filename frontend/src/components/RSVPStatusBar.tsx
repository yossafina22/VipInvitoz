interface RSVPStatusBarProps {
  confirmed: number;
  declined: number;
  pending: number;
  total: number;
}

export function RSVPStatusBar({ confirmed, declined, pending, total }: RSVPStatusBarProps) {
  const safe = Math.max(total, 1);
  const pctC = Math.round((confirmed / safe) * 100);
  const pctD = Math.round((declined / safe) * 100);
  const pctP = Math.round((pending / safe) * 100);
  return (
    <div>
      <div
        className="flex h-3 rounded-full overflow-hidden mb-3"
        role="meter"
        aria-label="Statut RSVP"
        aria-valuenow={confirmed}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div className="bg-success h-full" style={{ width: `${pctC}%` }} />
        <div className="bg-danger h-full" style={{ width: `${pctD}%` }} />
        <div className="bg-muted h-full" style={{ width: `${pctP}%` }} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-success inline-block" aria-hidden />
          Confirmés <strong>{confirmed}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-danger inline-block" aria-hidden />
          Déclinés <strong>{declined}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-muted inline-block" aria-hidden />
          En attente <strong>{pending}</strong>
        </span>
      </div>
    </div>
  );
}
