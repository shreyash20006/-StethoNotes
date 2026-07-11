import { useEffect, useRef } from 'react';
import Hero from '../components/contact/Hero';
import HelpCards from '../components/contact/HelpCards';
import ContactCards from '../components/contact/ContactCards';
import ContactForm from '../components/contact/ContactForm';
import LocationCard from '../components/contact/LocationCard';
import FAQ from '../components/contact/FAQ';

export default function Contact() {
  const formRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  // SEO updates on mount
  useEffect(() => {
    document.title = "Contact StethoNotes | Customer Support";
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Contact StethoNotes for support related to medical notes, payments, order tracking, and digital downloads.");
    }
  }, []);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const scrollToFaq = () => {
    faqRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Header */}
      <Hero />

      {/* Quick Category Help Cards */}
      <HelpCards onFormScroll={scrollToForm} onFaqScroll={scrollToFaq} />

      {/* Main Contact details */}
      <ContactCards />

      {/* Form & Map section */}
      <div ref={formRef} className="py-12 bg-white scroll-mt-24">
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
