import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-display font-medium rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-white hover:bg-accent-hover shadow-cyan-soft hover:shadow-cyan-hover',
        secondary: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
        outline: 'border-2 border-gray-300 text-primary hover:bg-gray-50',
        ghost: 'text-primary hover:bg-gray-100',
        danger: 'bg-red-500 text-white hover:bg-red-600',
      },
      size: {
        xs: 'px-3 py-1.5 text-xs',
        sm: 'px-4 py-2 text-sm',
        base: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
        icon: 'w-10 h-10 p-0',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'base',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode;
  isLoading?: boolean;
  icon?: ReactNode;
}

const Button = ({
  className,
  variant,
  size,
  fullWidth,
  isLoading,
  icon,
  children,
  disabled,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
};

export default Button;
