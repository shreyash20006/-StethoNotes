import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

// ============================================================
// SPECIALTY CONTEXT
// Global state machine for the adaptive medical UI.
// Changing the specialty morphs the entire page's colors,
// animations, and medical background atmosphere.
// ============================================================

export type SpecialtyId =
  | 'default'
  | 'cardiology'
  | 'neurology'
  | 'respiratory'
  | 'orthopedics'
  | 'anatomy'
  | 'pharmacology'
  | 'microbiology'
  | 'gastroenterology'
  | 'nephrology'
  | 'ophthalmology';

export interface SpecialtyConfig {
  id: SpecialtyId;
  label: string;
  organ: string;
  description: string;
  /** CSS hex colors */
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  glowColor: string;
  /** Background gradient for specialty panel */
  bgGradient: string;
  /** Tailwind class hint for text */
  textColor: string;
  /** Animation style identifier */
  animation: 'ecg' | 'neural' | 'breath' | 'skeleton' | 'particle' | 'molecule' | 'microscope' | 'default';
  /** Category filter tag used in Supabase */
  courseTag: string;
  /** Medical emoji */
  emoji: string;
}

export const SPECIALTIES: Record<SpecialtyId, SpecialtyConfig> = {
  default: {
    id: 'default',
    label: 'Medical Education',
    organ: 'Body',
    description: 'India\'s Premium Medical Notes Marketplace',
    primaryColor: '#22C7F2',
    secondaryColor: '#1E90FF',
    accentColor: '#35D07F',
    glowColor: 'rgba(34, 199, 242, 0.3)',
    bgGradient: 'from-[#07172B] via-[#0C2038] to-[#07172B]',
    textColor: 'text-cyan-400',
    animation: 'default',
    courseTag: '',
    emoji: '🩺',
  },
  cardiology: {
    id: 'cardiology',
    label: 'Cardiology',
    organ: 'Heart',
    description: 'Cardiovascular system, ECG interpretation, cardiac pathology, and heart surgery fundamentals.',
    primaryColor: '#E53E3E',
    secondaryColor: '#FC8181',
    accentColor: '#FEB2B2',
    glowColor: 'rgba(229, 62, 62, 0.35)',
    bgGradient: 'from-[#1a0505] via-[#2d0a0a] to-[#1a0505]',
    textColor: 'text-red-400',
    animation: 'ecg',
    courseTag: 'Cardiology',
    emoji: '❤️',
  },
  neurology: {
    id: 'neurology',
    label: 'Neurology',
    organ: 'Brain',
    description: 'Nervous system, brain anatomy, neurological disorders, synaptic transmission, and CNS pharmacology.',
    primaryColor: '#7C3AED',
    secondaryColor: '#A78BFA',
    accentColor: '#C4B5FD',
    glowColor: 'rgba(124, 58, 237, 0.35)',
    bgGradient: 'from-[#0d0720] via-[#150e35] to-[#0d0720]',
    textColor: 'text-violet-400',
    animation: 'neural',
    courseTag: 'Neurology',
    emoji: '🧠',
  },
  respiratory: {
    id: 'respiratory',
    label: 'Respiratory',
    organ: 'Lungs',
    description: 'Pulmonary anatomy, breathing mechanics, respiratory pathology, and ventilation physiology.',
    primaryColor: '#0891B2',
    secondaryColor: '#22D3EE',
    accentColor: '#A5F3FC',
    glowColor: 'rgba(8, 145, 178, 0.35)',
    bgGradient: 'from-[#021520] via-[#042030] to-[#021520]',
    textColor: 'text-cyan-400',
    animation: 'breath',
    courseTag: 'Respiratory',
    emoji: '🫁',
  },
  orthopedics: {
    id: 'orthopedics',
    label: 'Orthopedics',
    organ: 'Skeleton',
    description: 'Skeletal system, bone anatomy, joint biomechanics, fracture management, and musculoskeletal surgery.',
    primaryColor: '#B45309',
    secondaryColor: '#D97706',
    accentColor: '#FCD34D',
    glowColor: 'rgba(180, 83, 9, 0.3)',
    bgGradient: 'from-[#150a00] via-[#231200] to-[#150a00]',
    textColor: 'text-amber-500',
    animation: 'skeleton',
    courseTag: 'Orthopedics',
    emoji: '🦴',
  },
  anatomy: {
    id: 'anatomy',
    label: 'Anatomy',
    organ: 'Body',
    description: 'Complete human anatomy — gross, microscopic, and clinical. The foundation of all medical knowledge.',
    primaryColor: '#059669',
    secondaryColor: '#34D399',
    accentColor: '#A7F3D0',
    glowColor: 'rgba(5, 150, 105, 0.3)',
    bgGradient: 'from-[#021209] via-[#051f0f] to-[#021209]',
    textColor: 'text-emerald-400',
    animation: 'particle',
    courseTag: 'Anatomy',
    emoji: '🫀',
  },
  pharmacology: {
    id: 'pharmacology',
    label: 'Pharmacology',
    organ: 'Molecules',
    description: 'Drug mechanisms, pharmacokinetics, clinical pharmacology, and medicinal chemistry.',
    primaryColor: '#D97706',
    secondaryColor: '#F59E0B',
    accentColor: '#FDE68A',
    glowColor: 'rgba(217, 119, 6, 0.3)',
    bgGradient: 'from-[#150d00] via-[#221500] to-[#150d00]',
    textColor: 'text-amber-400',
    animation: 'molecule',
    courseTag: 'Pharmacology',
    emoji: '💊',
  },
  microbiology: {
    id: 'microbiology',
    label: 'Microbiology',
    organ: 'Cells',
    description: 'Bacteria, viruses, fungi, parasites — microbial pathogenesis and lab diagnosis.',
    primaryColor: '#16A34A',
    secondaryColor: '#4ADE80',
    accentColor: '#86EFAC',
    glowColor: 'rgba(22, 163, 74, 0.3)',
    bgGradient: 'from-[#021209] via-[#04200f] to-[#021209]',
    textColor: 'text-green-400',
    animation: 'microscope',
    courseTag: 'Microbiology',
    emoji: '🦠',
  },
  gastroenterology: {
    id: 'gastroenterology',
    label: 'Gastroenterology',
    organ: 'GI Tract',
    description: 'Digestive system anatomy, GI disorders, liver pathology, and gastric physiology.',
    primaryColor: '#EA580C',
    secondaryColor: '#FB923C',
    accentColor: '#FDBA74',
    glowColor: 'rgba(234, 88, 12, 0.3)',
    bgGradient: 'from-[#180800] via-[#281000] to-[#180800]',
    textColor: 'text-orange-400',
    animation: 'particle',
    courseTag: 'Gastroenterology',
    emoji: '🫄',
  },
  nephrology: {
    id: 'nephrology',
    label: 'Nephrology',
    organ: 'Kidneys',
    description: 'Renal anatomy, kidney physiology, fluid-electrolyte balance, and urological pathology.',
    primaryColor: '#2563EB',
    secondaryColor: '#60A5FA',
    accentColor: '#BFDBFE',
    glowColor: 'rgba(37, 99, 235, 0.3)',
    bgGradient: 'from-[#020b1a] via-[#041525] to-[#020b1a]',
    textColor: 'text-blue-400',
    animation: 'particle',
    courseTag: 'Nephrology',
    emoji: '🫘',
  },
  ophthalmology: {
    id: 'ophthalmology',
    label: 'Ophthalmology',
    organ: 'Eyes',
    description: 'Ocular anatomy, visual pathways, retinal pathology, and ophthalmic surgery.',
    primaryColor: '#0E7490',
    secondaryColor: '#06B6D4',
    accentColor: '#67E8F9',
    glowColor: 'rgba(14, 116, 144, 0.3)',
    bgGradient: 'from-[#00101a] via-[#001d2e] to-[#00101a]',
    textColor: 'text-cyan-500',
    animation: 'particle',
    courseTag: 'Ophthalmology',
    emoji: '👁️',
  },
};

// ─── Context ────────────────────────────────────────────────

interface SpecialtyContextValue {
  specialty: SpecialtyConfig;
  setSpecialty: (id: SpecialtyId) => void;
  clearSpecialty: () => void;
  isActive: boolean;
}

const SpecialtyContext = createContext<SpecialtyContextValue | null>(null);

export function SpecialtyProvider({ children }: { children: ReactNode }) {
  const [specialtyId, setSpecialtyId] = useState<SpecialtyId>('default');

  const specialty = SPECIALTIES[specialtyId];
  const isActive = specialtyId !== 'default';

  // Apply specialty CSS variables to :root when specialty changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--specialty-primary', specialty.primaryColor);
    root.style.setProperty('--specialty-secondary', specialty.secondaryColor);
    root.style.setProperty('--specialty-accent', specialty.accentColor);
    root.style.setProperty('--specialty-glow', specialty.glowColor);

    // Add specialty class to body for CSS-powered animation targeting
    document.body.setAttribute('data-specialty', specialtyId);
  }, [specialty, specialtyId]);

  const setSpecialty = useCallback((id: SpecialtyId) => {
    setSpecialtyId(id);
  }, []);

  const clearSpecialty = useCallback(() => {
    setSpecialtyId('default');
  }, []);

  return (
    <SpecialtyContext.Provider value={{ specialty, setSpecialty, clearSpecialty, isActive }}>
      {children}
    </SpecialtyContext.Provider>
  );
}

export function useSpecialty() {
  const ctx = useContext(SpecialtyContext);
  if (!ctx) throw new Error('useSpecialty must be used inside SpecialtyProvider');
  return ctx;
}
