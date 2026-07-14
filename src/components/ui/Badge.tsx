import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

const Badge = ({ children, className, variant = 'primary' }: BadgeProps) => {
  const variantStyles = {
    primary: 'bg-accent/10 text-accent',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
