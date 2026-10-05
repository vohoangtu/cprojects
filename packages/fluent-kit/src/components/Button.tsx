import * as React from 'react';
import { cn } from '../lib/cn.js';
import { useFluentLabels } from '../labels.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  block?: boolean;
  icon?: React.ReactNode;
  iconStart?: React.ReactNode;
  iconEnd?: React.ReactNode;
  disabled?: boolean;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'fluent-button-primary',
  secondary: 'fluent-button-secondary',
  ghost: 'fluent-button-ghost',
  danger: 'fluent-button-danger',
};
const SIZE: Record<ButtonSize, string> = {
  sm: 'fluent-button-sm',
  md: 'fluent-button-md',
  lg: 'fluent-button-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, block = false, disabled = false,
    icon, iconStart, iconEnd, className, children, type, onClick, ...rest },
  ref,
) {
  const labels = useFluentLabels();
  const isDisabled = disabled || loading;
  const hasText = children !== undefined && children !== null && children !== false && children !== '';
  const labelledByIcon = !hasText && Boolean(icon);

  if (typeof __DEV__ !== 'undefined' && __DEV__ && labelledByIcon && !rest['aria-label'] && !rest['aria-labelledby']) {
    // eslint-disable-next-line no-console
    console.warn('[fluent-kit] <Button icon /> without children requires aria-label.');
  }

  return (
    <button
      {...rest}
      ref={ref}
      type={type ?? 'button'}
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={isDisabled}
      
      onClick={isDisabled ? undefined : onClick}
      className={cn('fluent-button', VARIANT[variant], SIZE[size], block && 'fluent-button-block', className)}
    >
      {loading ? <span className="fluent-button-spinner" aria-hidden="true" /> : iconStart ?? icon}
      {hasText ? <span className="fluent-button-label">{children}</span> : null}
      {loading ? <span className="visually-hidden">{labels.loading}</span> : null}
      {!loading && iconEnd ? iconEnd : null}
    </button>
  );
});
