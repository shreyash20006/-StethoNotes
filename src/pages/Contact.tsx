import { useRef } from 'react';
import Hero from '../components/contact/Hero';
import HelpCards from '../components/contact/HelpCards';
import ContactCards from '../components/contact/ContactCards';
import ContactForm from '../components/contact/ContactForm';
import LocationCard from '../components/contact/LocationCard';
import FAQ from '../components/contact/FAQ';
import SEOHead from '../components/SEOHead';
import { pageMeta } from '../lib/seo';

export default function Contact() {
  const formRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const scrollToFaq = () => {
    faqRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const meta = pageMeta.contact();
  
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "StethoNotes",
    "image": "https://www.stethonotes.store/favicon.svg",
    "@id": "https://www.stethonotes.store/#localbusiness",
    "url": "https://www.stethonotes.store/",
    "telephone": "",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Nagpur",
      "addressRegion": "Maharashtra",
      "postalCode": "440001",
      "addressCountry": "IN"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "support@stethonotes.store"
    }
  };

  return (
    <div className="bg-void min-h-screen text-white pt-10">
      <SEOHead {...meta} jsonLd={localBusinessSchema} />
      {/* Hero Header */}
      <Hero />

      {/* Quick Category Help Cards */}
      <HelpCards onFormScroll={scrollToForm} onFaqScroll={scrollToFaq} />

      {/* Main Contact details */}
      <ContactCards />

      {/* Form & Map section */}
      <div ref={formRef} className="py-12 bg-void scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Form component */}
            <div className="lg:col-span-7">
              <ContactForm />
            </div>
            
            {/* Nagpur map placeholder */}
            <div className="lg:col-span-5 h-full">
              <LocationCard />
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div ref={faqRef} className="scroll-mt-24">
        <FAQ />
      </div>
    </div>
  );
}
