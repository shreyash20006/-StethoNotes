import { AnimatePresence, motion } from 'framer-motion';
import { useToastStore } from '../store/useToastStore';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            layout
            className="pointer-events-auto bg-white rounded-xl border border-l-4 p-4 shadow-cyan-soft border-gray-100 flex items-start gap-3 relative overflow-hidden"
            style={{
              borderLeftColor:
                toast.type === 'success'
                  ? '#1FB6D4' // Accent cyan
                  : toast.type === 'error'
                  ? '#EF4444' // Red
                  : '#3B82F6', // Blue
            }}
          >
            {/* Icon */}
            <div className="mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-accent" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
            </div>

            {/* Content */}
            <div className="flex-1 pr-6">
              <h4 className="font-display font-semibold text-primary text-sm">
                {toast.title}
              </h4>
              {toast.description && (
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  {toast.description}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-lg hover:bg-gray-50 absolute top-3 right-3"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
