import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'elevated';
  hover?: boolean;
}

const Card = ({
  children,
  className,
  variant = 'default',
  hover = false,
}: CardProps) => {
  const baseStyles = 'rounded-2xl p-6';
  
  const variantStyles = {
    default: 'bg-white border border-gray-100 shadow-sm',
    glass: 'glass-panel',
    elevated: 'bg-white shadow-md border border-gray-100',
  };

  const hoverStyles = hover ? 'hover:shadow-lg hover:-translate-y-1 transition-all duration-300' : '';

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        hoverStyles,
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;
