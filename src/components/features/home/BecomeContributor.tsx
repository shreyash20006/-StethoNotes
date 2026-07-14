import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';

const BecomeContributor = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Seller Program */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl p-8 border border-accent/20"
          >
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-2xl font-display font-bold text-primary mb-4">
              Become a Seller
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Monetize your expertise by creating and selling comprehensive study guides to thousands of medical students across India.
            </p>
            <ul className="space-y-3 mb-8 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-accent rounded-full" />
                Earn up to 80% commission on every sale
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-accent rounded-full" />
                Instant payouts to your bank account
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-accent rounded-full" />
                Track real-time analytics and earnings
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-accent rounded-full" />
                Join our top seller leaderboard
              </li>
            </ul>
            <Link to="/seller/login">
              <Button className="w-full">
                Start Selling
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Right: Contributor Program */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-100"
          >
            <div className="text-4xl mb-4">✍️</div>
            <h3 className="text-2xl font-display font-bold text-primary mb-4">
              Contribute Content
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Share your handwritten notes, study materials, and exam tips with a supportive community of medical students.
            </p>
            <ul className="space-y-3 mb-8 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                Flexible contribution schedule
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                Earn rewards for quality submissions
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                Build your academic portfolio
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                Get recognition in our community
              </li>
            </ul>
            <Button variant="secondary" className="w-full">
              Join as Contributor
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BecomeContributor;
