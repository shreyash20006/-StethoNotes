import { motion } from 'motion/react';
import { Mail, Clock, MapPin, ExternalLink } from 'lucide-react';

export default function ContactCards() {
  const cards = [
    {
      icon: <Mail className="w-5 h-5" />,
      title: "Email Support",
      value: "support@stethonotes.store",
      desc: "Send us a detailed request, and our support team will respond within 12-24 hours.",
      ctaText: "Send Email",
      ctaHref: "mailto:support@stethonotes.store"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Business Hours",
      value: "10:00 AM – 7:00 PM (IST)",
      desc: "Available Monday through Saturday for active order support and academic questions.",
      ctaText: "Official Hours",
      ctaHref: null
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      title: "Location",
      value: "Nagpur, Maharashtra, India",
      desc: "Headquartered in Nagpur. Digital product delivery managed entirely online.",
      ctaText: "View HQ Details",
      ctaHref: null
    }
  ];

  return (
    <section className="py-12 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {cards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 hover:shadow-cyan-soft transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center mb-6">
                  {card.icon}
                </div>
                <h3 className="font-display font-bold text-lg text-primary mb-2">
                  {card.title}
                </h3>
                <p className="font-display font-semibold text-sm text-accent mb-4 break-words">
                  {card.value}
                </p>
                <p className="text-gray-500 text-xs sm:text-sm leading-relaxed mb-6">
                  {card.desc}
                </p>
              </div>

              {card.ctaHref ? (
                <a
                  href={card.ctaHref}
                  className="w-full py-3 px-4 bg-primary text-white hover:bg-accent hover:shadow-cyan-soft rounded-xl font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>{card.ctaText}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <div className="w-full py-3 px-4 bg-gray-50 border border-gray-100 text-gray-400 rounded-xl font-display font-bold text-xs text-center">
                  {card.ctaText}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
