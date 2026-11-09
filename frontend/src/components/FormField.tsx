'use client';

import { Icon } from './Icon';

type FieldType = 'text' | 'email' | 'password' | 'tel' | 'textarea' | 'select';

interface Option {
  value: string;
  label: string;
}

interface FormFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: FieldType;
  required?: boolean;
  hint?: string;
  error?: string;
  options?: Option[];
  autoComplete?: string;
  disabled?: boolean;
}

const BASE =
  'w-full bg-input border rounded-md px-3 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-colors';

export function FormField({
  name,
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  required,
  hint,
  error,
  options = [],
  autoComplete,
  disabled,
}: FormFieldProps) {
  const borderClass = error
    ? 'border-danger focus:border-danger focus:ring-danger/30'
    : 'border-border focus:border-primary focus:ring-primary/30';
  const baseClass = `${BASE} ${borderClass}`;
  const errorId = error ? `${name}-error` : undefined;
  const hintId = hint ? `${name}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-body font-medium text-foreground">
        {label}
        {required && (
          <span className="text-primary ml-1" aria-hidden>
            *
          </span>
        )}
      </label>
      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId ?? hintId}
          className={`${baseClass} min-h-20 leading-relaxed`}
        />
      ) : type === 'select' ? (
        <div className="relative">
          <select
            id={name}
            name={name}
            value={value ?? ''}
            onChange={(e) => onChange?.(e.target.value)}
            required={required}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId ?? hintId}
            className={`${baseClass} appearance-none pr-8`}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Icon
            name="chevron-down"
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId ?? hintId}
          className={baseClass}
        />
      )}
      {error ? (
        <p id={errorId} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
