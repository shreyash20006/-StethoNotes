import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Mail, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SuccessModalProps {
  isOpen: boolean;
  orderId: string | null;
  email: string;
  onClose: () => void;
}

export default function SuccessModal({ isOpen, orderId, email, onClose }: SuccessModalProps) {
  const navigate = useNavigate();

  const handleViewOrder = () => {
    onClose();
    if (orderId) {
      navigate(`/order-success?order_id=${orderId}`);
    } else {
      navigate('/lookup');
    }
  };

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
            {/* Green Checkmark */}
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 animate-bounce">
              <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="font-display font-extrabold text-2xl text-primary">
                Payment Successful!
              </h3>
              <p className="text-gray-400 font-sans text-sm max-w-xs leading-relaxed mx-auto">
                Your study notes are on the way! We have dispatched them to your email.
              </p>
            </div>

            {/* Email dispatch alert */}
            <div className="bg-cyan-50/50 border border-cyan-100 rounded-2xl p-4 w-full text-xs text-left flex items-start gap-3">
              <Mail className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <h4 className="font-display font-bold text-primary">Note Delivery Inbox</h4>
                <p className="text-gray-500 font-sans mt-0.5 leading-normal">
                  Delivered to <strong className="text-primary font-semibold">{email}</strong>. Check spam or promotions if not received within 5 minutes.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 w-full mt-2">
              <button
                onClick={handleViewOrder}
                className="btn-primary w-full py-3.5 font-display font-bold text-sm flex items-center justify-center gap-2"
              >
                <span>View Order Receipt</span>
                <ExternalLink className="w-4 h-4" />
              </button>
              
              <button
                onClick={onClose}
                className="btn-secondary w-full py-3 text-sm font-semibold"
              >
                Close Window
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
