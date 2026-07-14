import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helpText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>((
  { className, label, error, icon, helpText, type = 'text', ...props },
  ref
) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-display font-semibold text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-3.5 text-gray-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'w-full px-4 py-3 border rounded-xl bg-white text-primary placeholder-gray-400 outline-none transition-all duration-200',
            icon && 'pl-10',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              : 'border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {helpText && <p className="text-xs text-gray-500">{helpText}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
