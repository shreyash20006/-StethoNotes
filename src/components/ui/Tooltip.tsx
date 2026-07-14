import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

export interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

const positionStyles = {
  top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
  bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
  left: 'right-full mr-2 top-1/2 -translate-y-1/2',
  right: 'left-full ml-2 top-1/2 -translate-y-1/2',
};

const Tooltip = ({
  content,
  children,
  side = 'top',
  delay = 0.2,
}: TooltipProps) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay * 1000);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <motion.div
          className={cn(
            'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded whitespace-nowrap',
            positionStyles[side]
          )}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          {content}
          <div className="absolute w-1.5 h-1.5 bg-gray-800" />
        </motion.div>
      )}
    </div>
  );
};

export default Tooltip;
