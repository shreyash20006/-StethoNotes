import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, RotateCw } from 'lucide-react';

interface FailureModalProps {
  isOpen: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  onClose: () => void;
}

export default function FailureModal({ isOpen, errorMessage, onRetry, onClose }: FailureModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative bg-white rounded-3xl border border-gray-100 shadow-2xl p-8 max-w-md w-full z-10 text-center flex flex-col items-center gap-6"
          >
            {/* Red Alert Icon */}
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
              <AlertCircle className="w-12 h-12 stroke-[2]" />
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="font-display font-extrabold text-xl text-primary">
                Payment Verification Failed
              </h3>
              <p className="text-gray-400 font-sans text-sm max-w-xs leading-relaxed mx-auto">
                {errorMessage || 'Something went wrong during Razorpay checkout validation.'}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 w-full mt-2">
              <button
                onClick={onRetry}
                className="btn-primary w-full py-3.5 font-display font-bold text-sm flex items-center justify-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                <span>Retry Payment</span>
              </button>
              
              <button
                onClick={onClose}
                className="btn-secondary w-full py-3 text-sm font-semibold"
              >
                Back to Cart
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
