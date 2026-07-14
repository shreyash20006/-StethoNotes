import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useToast } from '@/hooks';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      // TODO: Integrate with Brevo or your newsletter service
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast('success', 'Subscribed!', 'Check your email to confirm subscription.');
      setEmail('');
    } catch (error) {
      showToast('error', 'Subscription Failed', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-50">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Mail className="w-4 h-4" />
            Stay Updated
          </div>

          <h2 className="text-3xl sm:text-4xl font-display font-bold text-primary mb-4">
            Get Exclusive Updates & Offers
          </h2>
          <p className="text-gray-600 mb-8 text-base">
            Subscribe to our newsletter for new study materials, seller tips, and exclusive discounts.
          </p>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              required
            />
            <Button type="submit" isLoading={loading}>
              Subscribe
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default Newsletter;
