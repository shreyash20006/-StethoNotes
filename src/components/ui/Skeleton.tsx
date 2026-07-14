import { cn } from '@/lib/cn';

export interface SkeletonProps {
  className?: string;
  variant?: 'line' | 'circle' | 'rect';
}

const Skeleton = ({ className, variant = 'rect' }: SkeletonProps) => {
  const variantStyles = {
    line: 'h-4 w-full rounded',
    circle: 'w-12 h-12 rounded-full',
    rect: 'h-20 w-full rounded-lg',
  };

  return (
    <div
      className={cn(
        'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer',
        variantStyles[variant],
        className
      )}
    />
  );
};

export default Skeleton;
