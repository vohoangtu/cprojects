import * as React from 'react';
import { cn } from '../lib/cn.js';
import { useFluentLabels } from '../labels.js';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'id'> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  size?: 'sm' | 'md';
  /** Auto-generated with useId when omitted, so SSR and hydration agree. */
  id?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, size = 'md', disabled = false, required = false, className, id, ...rest },
  ref,
) {
  const autoId = React.useId();
  const inputId = id ?? `fluent-input-${autoId}`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const labels = useFluentLabels();
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className={cn('fluent-field', error && 'fluent-field-invalid', className)} data-size={size}>
      {label ? (
        <label className="fluent-label" htmlFor={inputId}>
          {label}
          {required ? (
            <>
              <span className="fluent-label-required" aria-hidden="true"> *</span>
              <span className="visually-hidden">{labels.required}</span>
            </>
          ) : null}
        </label>
      ) : null}
      <input
        {...rest}
        ref={ref}
        id={inputId}
        disabled={disabled}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className="fluent-input"
      />
      {hint ? <p className="fluent-hint" id={hintId}>{hint}</p> : null}
      {error ? <p className="fluent-error" id={errorId} role="alert">{error}</p> : null}
    </div>
  );
});
