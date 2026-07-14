import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes intelligently
 * Combines clsx for conditional classes with tailwind-merge to avoid conflicts
 */
export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};
