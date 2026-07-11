import { motion } from 'motion/react';
import { MapPin, Navigation } from 'lucide-react';

export default function LocationCard() {
  const mapSearchUrl = "https://www.google.com/maps/search/?api=1&query=Nagpur,+Maharashtra,+India";

  return (
    <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-10 shadow-cyan-soft relative overflow-hidden flex flex-col justify-between h-full min-h-[300px]">
      {/* Dynamic background element */}
      <div className="absolute inset-0 bg-gray-50 bg-[radial-gradient(#1FB6D4_0.75px,transparent_0.75px)] bg-[size:16px_16px] opacity-40 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center mb-6">
          <MapPin className="w-5 h-5" />
        </div>
        <span className="text-[10px] text-accent font-display font-bold uppercase tracking-wider block mb-2">
          StethoNotes Office Location
        </span>
        <h3 className="font-display font-extrabold text-xl sm:text-2xl text-primary leading-tight mb-3">
          📍 Nagpur, Maharashtra, India
        </h3>
        <p className="text-gray-500 text-xs sm:text-sm leading-relaxed max-w-sm">
          Our global operations, note curations, and support pipelines run from Nagpur. Our products are fully digital, providing instant support globally.
        </p>
      </div>

      <motion.a
        href={mapSearchUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ y: -2 }}
        className="relative z-10 w-full py-3.5 px-6 bg-primary text-white hover:bg-accent hover:shadow-cyan-soft rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 transition-all mt-8"
      >
        <Navigation className="w-4 h-4" />
        <span>View on Google Maps</span>
      </motion.a>
    </div>
  );
}
