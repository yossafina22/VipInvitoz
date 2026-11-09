interface StepIndicatorProps {
  steps: string[];
  currentStep: number; // 1-based
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <ol className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 sm:gap-3">
      {steps.map((label, i) => {
        const n = i + 1;
        const state = n < currentStep ? 'done' : n === currentStep ? 'current' : 'todo';
        const circle =
          state === 'done'
            ? 'bg-primary text-primary-foreground'
            : state === 'current'
              ? 'bg-secondary text-primary border-2 border-primary'
              : 'bg-muted text-muted-foreground';
        const labelColor = state === 'todo' ? 'text-muted-foreground' : 'text-foreground font-bold';
        return (
          <li key={label} className="flex items-center gap-2 shrink-0">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-body ${circle}`}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              {state === 'done' ? '✓' : n}
            </span>
            <span className={`text-xs sm:text-sm font-body ${labelColor}`}>{label}</span>
            {i < steps.length - 1 && (
              <span className="hidden sm:inline text-muted-foreground mx-1">—</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
