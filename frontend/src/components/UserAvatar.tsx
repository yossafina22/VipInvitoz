interface UserAvatarProps {
  index?: number;
  name?: string;
  className?: string;
  gender?: string;
  ageGroup?: string;
  heritage?: string;
}

const PALETTES = [
  'from-primary to-wax-orange',
  'from-gold to-wax-orange',
  'from-wax-teal to-primary',
  'from-wax-indigo to-primary',
  'from-success to-gold',
];

export function UserAvatar({ index = 0, name, className = '' }: UserAvatarProps) {
  const palette = PALETTES[index % PALETTES.length];
  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0] ?? '')
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '';
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br ${palette} text-primary-foreground font-body font-bold shrink-0 ${className}`}
      aria-hidden={!name}
    >
      {initials && <span className="text-xs">{initials}</span>}
    </div>
  );
}
