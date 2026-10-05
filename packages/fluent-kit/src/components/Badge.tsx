import * as React from 'react';
import { cn } from '../lib/cn.js';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone = 'neutral', size = 'md', dot = false, className, children, ...rest },
  ref,
) {
  const hasText = children !== undefined && children !== null && children !== false && children !== '';
  if (typeof __DEV__ !== 'undefined' && __DEV__ && dot && !hasText && !rest['aria-label'] && !rest.title) {
    // eslint-disable-next-line no-console
    console.warn('[fluent-kit] <Badge dot /> without children requires aria-label or title.');
  }
  return (
    <span
      {...rest}
      ref={ref}
      data-tone={tone}
      data-size={size}
      className={cn('fluent-badge', size === 'sm' && 'fluent-badge-sm', `fluent-badge-${tone}`, dot && 'fluent-badge-dot', className)}
    >
      {dot ? <span className="fluent-badge-dot-mark" aria-hidden="true" /> : null}
      {hasText ? children : null}
    </span>
  );
});
