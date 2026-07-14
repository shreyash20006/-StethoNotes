import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Hero,
  FeaturedCourses,
  Statistics,
  WhyUs,
  Testimonials,
  BecomeContributor,
  FAQ,
  Newsletter,
} from '@/components/features/home';

const LandingPage = () => {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Hero Section */}
      <Hero />

      {/* Featured Courses */}
      <FeaturedCourses />

      {/* Quick Stats */}
      <Statistics />

      {/* Why Us Section */}
      <WhyUs />

      {/* Testimonials */}
      <Testimonials />

      {/* CTA: Become Seller/Contributor */}
      <BecomeContributor />

      {/* FAQ */}
      <FAQ />

      {/* Newsletter */}
      <Newsletter />
    </motion.main>
  );
};

export default LandingPage;
