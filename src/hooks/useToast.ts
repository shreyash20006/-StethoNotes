import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useToastStore } from '@/store/useToastStore';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

/**
 * Hook to access toast notifications
 */
export const useToast = () => {
  const { toasts, addToast, removeToast } = useToastStore(
    useShallow((state) => ({
      toasts: state.toasts,
      addToast: state.addToast,
      removeToast: state.removeToast,
    }))
  );

  return {
    toasts,
    showToast: addToast,
    removeToast,
    success: (title: string, message: string) => addToast('success', title, message),
    error: (title: string, message: string) => addToast('error', title, message),
    info: (title: string, message: string) => addToast('info', title, message),
    warning: (title: string, message: string) => addToast('warning', title, message),
  };
};
