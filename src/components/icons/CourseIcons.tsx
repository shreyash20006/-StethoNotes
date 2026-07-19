import { motion } from 'motion/react';
import { memo } from 'react';

interface CourseIconProps {
  className?: string;
  size?: number;
}

const iconBase = 'transition-all duration-500';

function IconWrapper({ children, className = '', gradient }: { children: React.ReactNode; className?: string; gradient: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.08, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative group ${className}`}
    >
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500`} />
      <div className={`relative w-full h-full rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg overflow-hidden group-hover:shadow-cyan-500/20 group-hover:border-cyan-400/30 transition-all duration-500`}>
        {children}
      </div>
    </motion.div>
  );
}

export function MBBSIcon({ className = '', size = 64 }: CourseIconProps) {
  return (
    <IconWrapper className={className} gradient="from-blue-500 to-cyan-400">
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={iconBase}>
        <defs>
          <linearGradient id="mbbs-g" x1="12" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" /><stop offset="1" stopColor="#1FB6D4" />
          </linearGradient>
          <linearGradient id="mbbs-book" x1="14" y1="34" x2="50" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1FB6D4" /><stop offset="1" stopColor="#0F2D6B" />
          </linearGradient>
          <radialGradient id="mbbs-hl" cx="0.35" cy="0.25" r="0.8">
            <stop stopColor="#ffffff" stopOpacity="0.55" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d="M14 34 Q32 28 50 34 L50 54 Q32 48 14 54 Z" fill="url(#mbbs-book)" />
        <path d="M32 30 L32 50" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.4" />
        <path d="M8 20 Q10 34 22 36 Q34 38 34 26" stroke="url(#mbbs-g)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="34" cy="24" r="4" fill="url(#mbbs-g)" />
        <rect x="20" y="8" width="24" height="24" rx="8" fill="url(#mbbs-g)" />
        <rect x="30" y="13" width="4" height="14" rx="2" fill="#ffffff" fillOpacity="0.95" />
        <rect x="25" y="18" width="14" height="4" rx="2" fill="#ffffff" fillOpacity="0.95" />
        <ellipse cx="27" cy="14" rx="8" ry="4" fill="url(#mbbs-hl)" />
      </svg>
    </IconWrapper>
  );
}

export function BHMSIcon({ className = '', size = 64 }: CourseIconProps) {
  return (
    <IconWrapper className={className} gradient="from-emerald-500 to-teal-400">
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={iconBase}>
        <defs>
          <linearGradient id="bhms-g" x1="14" y1="10" x2="50" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10B981" /><stop offset="1" stopColor="#2DD4BF" />
          </linearGradient>
          <linearGradient id="bhms-bowl" x1="16" y1="40" x2="48" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2DD4BF" /><stop offset="1" stopColor="#0F766E" />
          </linearGradient>
          <radialGradient id="bhms-hl" cx="0.35" cy="0.3" r="0.75">
            <stop stopColor="#ffffff" stopOpacity="0.55" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="32" cy="52" rx="17" ry="4" fill="#0F766E" fillOpacity="0.2" />
        <path d="M32 8 C24 18 14 22 18 34 C21 42 32 44 32 44 C32 44 43 42 46 34 C50 22 40 18 32 8Z" fill="url(#bhms-g)" />
        <path d="M32 14 L32 42" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round" />
        <path d="M40 20 L34 24" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.35" />
        <path d="M16 40 L48 40 Q46 52 32 52 Q18 52 16 40Z" fill="url(#bhms-bowl)" />
        <path d="M36 36 L46 30" stroke="#0F766E" strokeWidth="3" strokeLinecap="round" />
        <circle cx="47" cy="29" r="3" fill="url(#bhms-g)" />
        <ellipse cx="24" cy="22" rx="6" ry="3" fill="url(#bhms-hl)" />
      </svg>
    </IconWrapper>
  );
}

export function BAMSIcon({ className = '', size = 64 }: CourseIconProps) {
  return (
    <IconWrapper className={className} gradient="from-green-500 to-lime-400">
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={iconBase}>
        <defs>
          <linearGradient id="bams-g" x1="12" y1="12" x2="52" y2="54" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22C55E" /><stop offset="1" stopColor="#84CC16" />
          </linearGradient>
          <linearGradient id="bams-scroll" x1="12" y1="38" x2="52" y2="54" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE68A" /><stop offset="1" stopColor="#D9A441" />
          </linearGradient>
          <radialGradient id="bams-hl" cx="0.4" cy="0.3" r="0.7">
            <stop stopColor="#ffffff" stopOpacity="0.6" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d="M12 42 Q32 36 52 42 L52 52 Q32 58 12 52 Z" fill="url(#bams-scroll)" />
        <path d="M20 46 L44 46 M20 50 L38 50" stroke="#8A5A1E" strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round" />
        <path d="M32 20 C36 26 44 26 44 26 C44 26 40 34 32 34 C24 34 20 26 20 26 C20 26 28 26 32 20Z" fill="url(#bams-g)" />
        <path d="M32 8 C30 16 24 18 26 26 C28 32 32 32 32 32 C32 32 36 32 38 26 C40 18 34 16 32 8Z" fill="url(#bams-g)" />
        <path d="M32 12 C33 22 41 22 41 22" stroke="#166534" strokeWidth="1.5" fill="none" strokeOpacity="0.4" strokeLinecap="round" />
        <circle cx="32" cy="24" r="4" fill="#FDE68A" />
        <ellipse cx="28" cy="14" rx="4" ry="6" fill="url(#bams-hl)" />
      </svg>
    </IconWrapper>
  );
}

export function NursingIcon({ className = '', size = 64 }: CourseIconProps) {
  return (
    <IconWrapper className={className} gradient="from-indigo-500 to-blue-400">
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={iconBase}>
        <defs>
          <linearGradient id="nurse-g" x1="12" y1="10" x2="52" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1" /><stop offset="1" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id="nurse-hand" x1="12" y1="42" x2="52" y2="58" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" /><stop offset="1" stopColor="#1E3A8A" />
          </linearGradient>
          <radialGradient id="nurse-hl" cx="0.35" cy="0.3" r="0.75">
            <stop stopColor="#ffffff" stopOpacity="0.55" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d="M14 46 Q20 40 32 40 Q44 40 50 46 L50 54 Q32 58 14 54 Z" fill="url(#nurse-hand)" />
        <path d="M32 44 C30 38 24 36 24 30 C24 25 28 24 30 27 C31 29 32 30 32 30 C32 30 33 29 34 27 C36 24 40 25 40 30 C40 36 34 38 32 44Z" fill="url(#nurse-g)" />
        <path d="M8 34 L20 34 L24 26 L30 42 L34 20 L40 34 L52 34" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.85" />
        <rect x="30" y="10" width="4" height="12" rx="2" fill="#ffffff" fillOpacity="0.95" />
        <rect x="26" y="14" width="12" height="4" rx="2" fill="#ffffff" fillOpacity="0.95" />
        <ellipse cx="28" cy="30" rx="4" ry="3" fill="url(#nurse-hl)" />
      </svg>
    </IconWrapper>
  );
}

export function PharmaIcon({ className = '', size = 64 }: CourseIconProps) {
  return (
    <IconWrapper className={className} gradient="from-red-500 to-orange-400">
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={iconBase}>
        <defs>
          <linearGradient id="pharma-cap" x1="18" y1="14" x2="46" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#EF4444" /><stop offset="1" stopColor="#F97316" />
          </linearGradient>
          <linearGradient id="pharma-beaker" x1="20" y1="36" x2="44" y2="58" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F97316" stopOpacity="0.7" /><stop offset="1" stopColor="#EF4444" stopOpacity="0.7" />
          </linearGradient>
          <radialGradient id="pharma-hl" cx="0.35" cy="0.3" r="0.7">
            <stop stopColor="#ffffff" stopOpacity="0.6" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g transform="rotate(-40 32 24)">
          <rect x="16" y="16" width="32" height="18" rx="9" fill="url(#pharma-cap)" />
          <path d="M32 16 L32 34" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.5" />
          <rect x="16" y="16" width="16" height="18" rx="9" fill="#ffffff" fillOpacity="0.18" />
        </g>
        <path d="M26 38 L26 44 L20 56 Q19 58 22 58 L42 58 Q45 58 44 56 L38 44 L38 38 Z" fill="url(#pharma-beaker)" stroke="#EF4444" strokeWidth="1.5" strokeOpacity="0.6" />
        <path d="M22 52 Q32 49 42 52 L42 56 Q32 58 22 56Z" fill="#F97316" fillOpacity="0.85" />
        <circle cx="30" cy="53" r="1.4" fill="#ffffff" fillOpacity="0.7" />
        <circle cx="35" cy="55" r="1" fill="#ffffff" fillOpacity="0.6" />
        <ellipse cx="26" cy="22" rx="4" ry="6" fill="url(#pharma-hl)" transform="rotate(-40 26 22)" />
      </svg>
    </IconWrapper>
  );
}

export function BPTIcon({ className = '', size = 64 }: CourseIconProps) {
  return (
    <IconWrapper className={className} gradient="from-purple-500 to-pink-400">
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={iconBase}>
        <defs>
          <linearGradient id="bpt-g" x1="14" y1="8" x2="50" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A855F7" /><stop offset="1" stopColor="#EC4899" />
          </linearGradient>
          <radialGradient id="bpt-hl" cx="0.4" cy="0.3" r="0.7">
            <stop stopColor="#ffffff" stopOpacity="0.6" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d="M12 22 Q32 14 52 22" stroke="url(#bpt-g)" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="1 6" strokeOpacity="0.6" />
        <circle cx="34" cy="14" r="6" fill="url(#bpt-g)" />
        <path d="M34 20 Q40 24 42 20" stroke="url(#bpt-g)" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M34 20 L30 34" stroke="url(#bpt-g)" strokeWidth="5" strokeLinecap="round" />
        <path d="M31 27 L44 30" stroke="url(#bpt-g)" strokeWidth="4" strokeLinecap="round" />
        <path d="M30 34 L20 44" stroke="url(#bpt-g)" strokeWidth="5" strokeLinecap="round" />
        <path d="M30 34 L36 50" stroke="url(#bpt-g)" strokeWidth="5" strokeLinecap="round" />
        <path d="M18 46 C12 46 12 54 18 54 M46 30 C52 30 52 22 46 22" stroke="#EC4899" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeOpacity="0.7" />
        <circle cx="34" cy="12" r="2" fill="url(#bpt-hl)" />
      </svg>
    </IconWrapper>
  );
}

export function ParamedicalIcon({ className = '', size = 64 }: CourseIconProps) {
  return (
    <IconWrapper className={className} gradient="from-amber-500 to-yellow-400">
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={iconBase}>
        <defs>
          <linearGradient id="para-g" x1="8" y1="20" x2="56" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F59E0B" /><stop offset="1" stopColor="#EAB308" />
          </linearGradient>
          <linearGradient id="para-cab" x1="8" y1="26" x2="24" y2="46" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FBBF24" /><stop offset="1" stopColor="#D97706" />
          </linearGradient>
          <radialGradient id="para-hl" cx="0.35" cy="0.3" r="0.7">
            <stop stopColor="#ffffff" stopOpacity="0.55" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d="M4 44 L10 44 L14 38 L18 46 L22 34 L26 44 L60 44" stroke="url(#para-g)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.55" />
        <path d="M6 30 L26 30 L30 30 L38 22 L54 22 Q58 22 58 26 L58 46 Q58 48 56 48 L6 48 Q4 48 4 46 L4 32 Q4 30 6 30Z" fill="url(#para-g)" />
        <path d="M30 30 L38 22 L48 22 L48 30 Z" fill="url(#para-cab)" fillOpacity="0.9" />
        <rect x="12" y="34" width="14" height="14" rx="3" fill="#7F1D1D" fillOpacity="0.15" />
        <rect x="16" y="34" width="6" height="14" rx="2" fill="#DC2626" />
        <rect x="12" y="38" width="14" height="6" rx="2" fill="#DC2626" />
        <circle cx="18" cy="50" r="6" fill="#1E293B" /><circle cx="18" cy="50" r="2.5" fill="#94A3B8" />
        <circle cx="46" cy="50" r="6" fill="#1E293B" /><circle cx="46" cy="50" r="2.5" fill="#94A3B8" />
        <ellipse cx="16" cy="26" rx="6" ry="3" fill="url(#para-hl)" />
      </svg>
    </IconWrapper>
  );
}

export const COURSE_ICON_MAP: Record<string, React.ComponentType<CourseIconProps>> = {
  MBBS: MBBSIcon,
  BHMS: BHMSIcon,
  BAMS: BAMSIcon,
  'BSc Nursing': NursingIcon,
  'B.Pharma': PharmaIcon,
  BPT: BPTIcon,
  Paramedical: ParamedicalIcon,
  BDS: MBBSIcon,
};

export const CourseIcon = memo(({ name, ...props }: { name: string } & CourseIconProps) => {
  const Icon = COURSE_ICON_MAP[name] || MBBSIcon;
  return <Icon {...props} />;
});

CourseIcon.displayName = 'CourseIcon';

export const COURSE_CATEGORIES = [
  { id: 'c1', name: 'MBBS', desc: 'Bachelor of Medicine, Bachelor of Surgery', color: 'from-blue-500/10 to-cyan-500/10', coverImage: 'https://res.cloudinary.com/dsqxboxoc/image/upload/v1784459007/file_00000000515882089b869fa1400fcea4_b1irgb.png' },
  { id: 'c2', name: 'BHMS', desc: 'Bachelor of Homoeopathic Medicine and Surgery', color: 'from-emerald-500/10 to-teal-500/10', coverImage: 'https://res.cloudinary.com/dsqxboxoc/image/upload/v1784459008/file_00000000fb248208a1c95524e9262cdc_xqcc9a.png' },
  { id: 'c3', name: 'BAMS', desc: 'Bachelor of Ayurvedic Medicine and Surgery', color: 'from-green-500/10 to-emerald-500/10', coverImage: 'https://res.cloudinary.com/dsqxboxoc/image/upload/v1784459008/file_00000000a1c0820898fe49bd8f309aa0_q8ka61.png' },
  { id: 'c4', name: 'BSc Nursing', desc: 'Bachelor of Science in Nursing care study guides', color: 'from-indigo-500/10 to-blue-500/10', coverImage: 'https://res.cloudinary.com/dsqxboxoc/image/upload/v1784459009/file_000000000eb4820aa9f18e85d62871cf_kptvuj.png' },
  { id: 'c5', name: 'B.Pharma', desc: 'Pharmacy and Pharmacology summary papers', color: 'from-red-500/10 to-orange-500/10', coverImage: 'https://res.cloudinary.com/dsqxboxoc/image/upload/v1784459008/file_00000000c80881f4aa424b19f175ab96_gfmi8l.png' },
  { id: 'c6', name: 'BPT', desc: 'Bachelor of Physiotherapy exercise guides', color: 'from-purple-500/10 to-pink-500/10', coverImage: 'https://res.cloudinary.com/dsqxboxoc/image/upload/v1784459008/file_00000000e718820996166f5de8a7cdab_jb5wsr.png' },
  { id: 'c7', name: 'Paramedical', desc: 'Lab Technician, Radiology & Emergency notes', color: 'from-yellow-500/10 to-amber-500/10', coverImage: 'https://res.cloudinary.com/dsqxboxoc/image/upload/v1784459010/file_000000007bb48209b0379d5ca31473e7_cdkvnn.png' },
  { id: 'c8', name: 'BDS', desc: 'Bachelor of Dental Surgery study resources', color: 'from-cyan-500/10 to-blue-500/10', coverImage: 'https://res.cloudinary.com/dsqxboxoc/image/upload/v1784459587/file_0000000031dc8208bcd6304ecd8509d7_rmuinb.png' }
];
