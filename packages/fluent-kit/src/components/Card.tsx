import * as React from 'react';
import { cn } from '../lib/cn.js';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'default' | 'compact';
  interactive?: boolean;
  as?: 'div' | 'section' | 'article';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { size = 'default', interactive = false, as = 'div', className, tabIndex, role, ...rest },
  ref,
) {
  const Tag = as as 'div';
  return (
    <Tag
      {...rest}
      ref={ref}
      data-size={size}
      data-interactive={interactive || undefined}
      role={role ?? (interactive ? 'button' : undefined)}
      tabIndex={tabIndex ?? (interactive ? 0 : undefined)}
      className={cn(size === 'compact' ? 'fluent-compact-card' : 'fluent-card', interactive && 'fluent-card-interactive', className)}
    />
  );
});
