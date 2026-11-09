interface WaxPatternProps {
  className?: string;
  opacity?: number;
}

export function WaxPattern({ className = '', opacity = 0.07 }: WaxPatternProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ opacity }}
      aria-hidden
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="wax-pattern"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="20" cy="20" r="8" fill="#C4602A" />
            <circle cx="0" cy="0" r="4" fill="#C9922A" />
            <circle cx="40" cy="0" r="4" fill="#C9922A" />
            <circle cx="0" cy="40" r="4" fill="#C9922A" />
            <circle cx="40" cy="40" r="4" fill="#C9922A" />
            <path d="M10 20 L30 20 M20 10 L20 30" stroke="#C4602A" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wax-pattern)" />
      </svg>
    </div>
  );
}
