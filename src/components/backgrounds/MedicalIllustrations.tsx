import { useThemeStore } from '../../store/useThemeStore';

// ============================================
// MEDICAL ILLUSTRATION BACKGROUNDS
// Each section gets a unique themed SVG background layer.
// Dark: glowing holographic anatomy / lab equipment
// Light: blueprint sketches / warm campus textures
// All at 4-8% opacity so content remains readable.
// ============================================

interface SectionBgProps {
  className?: string;
}

/** Discover Notes — medical study desk environment */
export function StudyDeskBackground({ className = '' }: SectionBgProps) {
  const { theme } = useThemeStore();
  const isLight = theme === 'light';
  const color = isLight ? '#2D6BFF' : '#22C7F2';
  const opacity = isLight ? 0.055 : 0.045;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 700"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        style={{ opacity }}
      >
        {/* Open anatomy textbook */}
        <g stroke={color} strokeWidth="0.9">
          <rect x="180" y="120" width="260" height="340" rx="4" />
          <line x1="310" y1="120" x2="310" y2="460" />
          {/* Left page content — anatomy figure */}
          <ellipse cx="248" cy="195" rx="30" ry="38" />
          <line x1="248" y1="233" x2="248" y2="340" strokeDasharray="3 2" />
          <path d="M220 260 Q200 270 195 295 Q200 320 220 325" />
          <path d="M276 260 Q296 270 301 295 Q296 320 276 325" />
          {/* Page lines */}
          <line x1="190" y1="380" x2="300" y2="380" strokeWidth="0.5" />
          <line x1="190" y1="390" x2="295" y2="390" strokeWidth="0.5" />
          <line x1="190" y1="400" x2="298" y2="400" strokeWidth="0.5" />
          {/* Right page — notes */}
          <line x1="325" y1="140" x2="425" y2="140" strokeWidth="0.5" />
          <line x1="325" y1="152" x2="430" y2="152" strokeWidth="0.5" />
          <line x1="325" y1="164" x2="420" y2="164" strokeWidth="0.5" />
          <line x1="325" y1="176" x2="432" y2="176" strokeWidth="0.5" />
          <line x1="325" y1="188" x2="415" y2="188" strokeWidth="0.5" />
          {/* Sticky notes */}
          <rect x="340" y="230" width="70" height="70" rx="2" strokeWidth="0.8" />
          <line x1="348" y1="248" x2="402" y2="248" strokeWidth="0.5" />
          <line x1="348" y1="258" x2="400" y2="258" strokeWidth="0.5" />
          <line x1="348" y1="268" x2="398" y2="268" strokeWidth="0.5" />
        </g>

        {/* Pencil */}
        <g stroke={color} strokeWidth="0.8" opacity="0.8">
          <path d="M460 380 L475 250 L483 250 L468 380 Z" />
          <path d="M460 380 L465 395 L474 380" />
          <path d="M475 250 L479 242 L483 250" />
        </g>

        {/* Highlighter marks */}
        <rect x="325" y="200" width="95" height="8" rx="2" fill={color} stroke="none" opacity="0.08" />
        <rect x="325" y="220" width="80" height="8" rx="2" fill={color} stroke="none" opacity="0.06" />

        {/* Medical flashcard stack */}
        <g stroke={color} strokeWidth="0.9">
          <rect x="900" y="200" width="180" height="120" rx="6" transform="rotate(-3 990 260)" />
          <rect x="904" y="204" width="180" height="120" rx="6" transform="rotate(2 994 264)" />
          <rect x="908" y="208" width="180" height="120" rx="6" />
          <line x1="920" y1="240" x2="1078" y2="240" strokeWidth="0.5" />
          <line x1="920" y1="252" x2="1074" y2="252" strokeWidth="0.5" />
          <line x1="920" y1="264" x2="1070" y2="264" strokeWidth="0.5" />
          {/* Heart icon on card */}
          <path d="M956 288 Q948 280 942 283 Q934 287 934 297 Q934 306 948 316 L956 322 L964 316 Q978 306 978 297 Q978 287 970 283 Q964 280 956 288 Z" />
        </g>

        {/* Coffee mug */}
        <g stroke={color} strokeWidth="0.9">
          <rect x="1100" y="380" width="70" height="80" rx="8" />
          <path d="M1170 400 Q1195 400 1195 415 Q1195 430 1170 430" />
          {/* Steam */}
          <path d="M1120 375 Q1115 360 1120 345" strokeDasharray="3 3" />
          <path d="M1135 372 Q1130 357 1135 342" strokeDasharray="3 3" />
          <path d="M1150 375 Q1145 360 1150 345" strokeDasharray="3 3" />
        </g>
      </svg>
    </div>
  );
}

/** Courses — dynamically themed anatomy wall */
export function AnatomyWallBackground({ className = '' }: SectionBgProps) {
  const { theme } = useThemeStore();
  const isLight = theme === 'light';
  const color = isLight ? '#2D6BFF' : '#22C7F2';
  const color2 = isLight ? '#00BCD4' : '#1E90FF';
  const opacity = isLight ? 0.06 : 0.05;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 700"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        style={{ opacity }}
      >
        {/* Anatomy chart with multiple systems */}
        <g stroke={color} strokeWidth="0.8">
          {/* Skeleton outline */}
          <ellipse cx="300" cy="90" rx="40" ry="48" />
          <path d="M268 115 Q255 140 258 165 L342 165 Q345 140 332 115" />
          <line x1="300" y1="165" x2="300" y2="370" strokeDasharray="3 2" />
          {/* Spine vertebrae marks */}
          {[185, 200, 215, 230, 245, 260, 275, 290, 305, 320, 335, 350].map((y, i) => (
            <rect key={i} x="293" y={y} width="14" height="8" rx="2" />
          ))}
          {/* Rib cage */}
          <ellipse cx="300" cy="240" rx="55" ry="70" />
          {/* Arms */}
          <path d="M248 185 Q215 210 208 260 Q205 300 212 330" />
          <path d="M352 185 Q385 210 392 260 Q395 300 388 330" />
          {/* Pelvis */}
          <path d="M268 330 Q238 352 242 375 Q262 392 300 383 Q338 392 358 375 Q362 352 332 330 Z" />
          {/* Legs */}
          <line x1="280" y1="380" x2="270" y2="530" />
          <line x1="320" y1="380" x2="330" y2="530" />
        </g>

        {/* Vascular system (right side) */}
        <g stroke={color2} strokeWidth="0.7">
          <path d="M750 80 Q748 140 752 200 Q756 260 750 320 Q744 380 748 440 Q752 500 748 560" />
          <path d="M750 140 Q720 160 700 185 Q680 210 675 240" />
          <path d="M750 140 Q780 160 800 185 Q820 210 825 240" />
          <path d="M750 240 Q715 260 695 285 Q675 310 670 340" />
          <path d="M750 240 Q785 260 805 285 Q825 310 830 340" />
          <path d="M750 340 Q720 365 705 395" />
          <path d="M750 340 Q780 365 795 395" />
          {/* Heart */}
          <path d="M740 170 Q728 158 718 161 Q705 165 705 178 Q705 191 722 204 L740 218 L758 204 Q775 191 775 178 Q775 165 762 161 Q752 158 740 170 Z" />
        </g>

        {/* Neural network diagram */}
        <g stroke={color} strokeWidth="0.6">
          {[
            [1100, 150], [1180, 180], [1050, 200], [1140, 230], [1200, 250],
            [1080, 270], [1160, 300], [1120, 330],
          ].map(([x, y], i, arr) => (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill={color} fillOpacity="0.3" />
              {i > 0 && <line x1={x} y1={y} x2={arr[Math.max(0,i-1)][0]} y2={arr[Math.max(0,i-1)][1]} strokeDasharray="3 3" />}
              {i > 1 && <line x1={x} y1={y} x2={arr[0][0]} y2={arr[0][1]} strokeDasharray="4 4" opacity="0.5" />}
            </g>
          ))}
        </g>

        {/* Label tags */}
        <g fill={color} opacity="0.6">
          <text x="100" y="90" fontSize="7" fontFamily="Space Grotesk">SKELETAL SYSTEM</text>
          <text x="620" y="75" fontSize="7" fontFamily="Space Grotesk">CARDIOVASCULAR SYSTEM</text>
          <text x="1010" y="140" fontSize="7" fontFamily="Space Grotesk">NERVOUS SYSTEM</text>
        </g>
      </svg>
    </div>
  );
}

/** Why StethoNotes — secure digital archive */
export function SecureArchiveBackground({ className = '' }: SectionBgProps) {
  const { theme } = useThemeStore();
  const isLight = theme === 'light';
  const color = isLight ? '#2D6BFF' : '#22C7F2';
  const opacity = isLight ? 0.055 : 0.045;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 500"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        style={{ opacity }}
      >
        {/* Document stack rows */}
        {[0, 1, 2, 3].map((row) => (
          <g key={row}>
            {[0, 1, 2, 3, 4, 5, 6].map((col) => (
              <g key={col}>
                <rect
                  x={80 + col * 200}
                  y={60 + row * 100}
                  width={140}
                  height={75}
                  rx="4"
                  stroke={color}
                  strokeWidth="0.7"
                />
                <line x1={95 + col * 200} y1={80 + row * 100} x2={205 + col * 200} y2={80 + row * 100} strokeWidth="0.5" stroke={color} />
                <line x1={95 + col * 200} y1={90 + row * 100} x2={200 + col * 200} y2={90 + row * 100} strokeWidth="0.5" stroke={color} />
                {/* Shield/verified icon */}
                <path
                  d={`M${155 + col * 200} ${105 + row * 100} L${148 + col * 200} ${108 + row * 100} L${148 + col * 200} ${116 + row * 100} Q${148 + col * 200} ${122 + row * 100} ${155 + col * 200} ${125 + row * 100} Q${162 + col * 200} ${122 + row * 100} ${162 + col * 200} ${116 + row * 100} L${162 + col * 200} ${108 + row * 100} Z`}
                  stroke={color}
                  strokeWidth="0.7"
                />
              </g>
            ))}
          </g>
        ))}

        {/* Connecting network lines */}
        <path d="M240 135 Q360 135 360 235" stroke={color} strokeWidth="0.5" strokeDasharray="4 3" />
        <path d="M640 135 Q640 180 720 235" stroke={color} strokeWidth="0.5" strokeDasharray="4 3" />
        <path d="M1040 135 Q1040 180 960 235" stroke={color} strokeWidth="0.5" strokeDasharray="4 3" />

        {/* Cloud storage icon */}
        <g stroke={color} strokeWidth="1">
          <path d="M680 30 Q670 10 650 18 Q635 8 618 20 Q602 20 602 38 Q602 52 618 52 L680 52 Q696 52 696 38 Q696 24 680 30 Z" />
          <line x1="648" y1="52" x2="648" y2="75" strokeDasharray="3 2" />
          <path d="M638 65 L648 75 L658 65" />
        </g>
      </svg>
    </div>
  );
}

/** Testimonials — medical college atmosphere */
export function CampusBackground({ className = '' }: SectionBgProps) {
  const { theme } = useThemeStore();
  const isLight = theme === 'light';
  const color = isLight ? '#2D6BFF' : '#22C7F2';
  const opacity = isLight ? 0.05 : 0.04;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 500"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        style={{ opacity }}
      >
        {/* Bookshelf rows */}
        <g stroke={color} strokeWidth="0.9">
          {[80, 200, 320].map((y, rowIdx) => (
            <g key={rowIdx}>
              <line x1="50" y1={y + 60} x2="1390" y2={y + 60} strokeWidth="1.2" />
              {Array.from({ length: 22 }).map((_, i) => (
                <rect
                  key={i}
                  x={55 + i * 62}
                  y={y + (i % 3 === 0 ? 5 : i % 3 === 1 ? 10 : 0)}
                  width={55}
                  height={55 - (i % 3 === 0 ? 5 : i % 3 === 1 ? 10 : 0)}
                  rx="1"
                  strokeWidth="0.7"
                  stroke={color}
                />
              ))}
            </g>
          ))}
        </g>

        {/* Silhouette of students studying */}
        <g fill={color} opacity="0.3">
          {/* Person 1 */}
          <ellipse cx="600" cy="400" rx="16" ry="20" />
          <path d="M584 420 Q584 460 600 465 Q616 460 616 420" />
          <path d="M584 430 Q570 445 565 460" />
          <path d="M616 430 Q630 445 635 460" />
          {/* Person 2 */}
          <ellipse cx="680" cy="400" rx="16" ry="20" />
          <path d="M664 420 Q664 460 680 465 Q696 460 696 420" />
          {/* Microscope */}
          <path d="M750 450 L750 400 L760 400 L755 370 L765 370 L760 400" strokeWidth="1.5" stroke={color} fill="none" />
          <ellipse cx="760" cy="362" rx="12" ry="8" stroke={color} strokeWidth="1" fill="none" />
          <line x1="740" y1="450" x2="780" y2="450" stroke={color} strokeWidth="1.2" />
        </g>

        {/* Graduation caps floating */}
        <g stroke={color} strokeWidth="0.9" opacity="0.7">
          <path d="M1100 200 L1140 185 L1180 200 L1140 215 Z" />
          <line x1="1140" y1="185" x2="1140" y2="230" />
          <path d="M1150 230 Q1155 240 1148 248" />
        </g>
      </svg>
    </div>
  );
}

/** Statistics — hospital command center */
export function CommandCenterBackground({ className = '' }: SectionBgProps) {
  const { theme } = useThemeStore();
  const isLight = theme === 'light';
  const color = isLight ? '#2D6BFF' : '#22C7F2';
  const color2 = isLight ? '#00BCD4' : '#35D07F';
  const opacity = isLight ? 0.055 : 0.05;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 500"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        style={{ opacity }}
      >
        {/* ECG trace */}
        <path
          d="M0,250 L200,250 L220,250 L230,200 L240,300 L250,150 L260,350 L270,230 L280,255 L300,250 L500,250 L520,250 L530,210 L540,290 L550,170 L560,330 L570,235 L580,255 L600,250 L800,250 L820,250 L830,220 L840,280 L850,190 L860,310 L870,245 L880,255 L900,250 L1440,250"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Dashboard panels */}
        <g stroke={color} strokeWidth="0.9">
          <rect x="80" y="80" width="280" height="140" rx="8" />
          {/* Bar chart inside */}
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={100 + i * 48} y={180 - i * 15} width="32" height={i * 15 + 15} rx="2" stroke={color} strokeWidth="0.7" fill={color} fillOpacity="0.1" />
          ))}

          <rect x="1080" y="80" width="280" height="140" rx="8" />
          {/* Donut / circular stat */}
          <circle cx="1220" cy="150" r="45" strokeDasharray="80 200" strokeWidth="8" />
          <circle cx="1220" cy="150" r="45" strokeDasharray="40 200" strokeWidth="8" stroke={color2} transform="rotate(144 1220 150)" />

          {/* MRI scan visualization */}
          <rect x="580" y="60" width="280" height="160" rx="8" />
          <ellipse cx="720" cy="140" rx="90" ry="65" />
          <ellipse cx="720" cy="140" rx="65" ry="45" />
          <ellipse cx="720" cy="140" rx="40" ry="28" />
          <ellipse cx="720" cy="140" rx="18" ry="12" />
        </g>

        {/* Vital sign labels */}
        <g fill={color} opacity="0.7">
          <text x="88" y="98" fontSize="8" fontFamily="Space Grotesk">PATIENT STATISTICS</text>
          <text x="588" y="78" fontSize="8" fontFamily="Space Grotesk">MRI SCAN — CORONAL VIEW</text>
          <text x="1088" y="98" fontSize="8" fontFamily="Space Grotesk">PLATFORM ANALYTICS</text>
        </g>
      </svg>
    </div>
  );
}

/** CTA Section — cosmic knowledge constellation */
export function ConstellationBackground({ className = '' }: SectionBgProps) {
  const { theme } = useThemeStore();
  const isLight = theme === 'light';
  const color = isLight ? '#2D6BFF' : '#22C7F2';
  const opacity = isLight ? 0.07 : 0.06;

  // Star positions
  const stars = [
    [200, 100], [450, 150], [700, 80], [950, 130], [1200, 100],
    [300, 250], [600, 220], [850, 270], [1100, 240],
    [150, 380], [400, 340], [720, 390], [1000, 350], [1280, 380],
    [550, 50], [820, 160], [1150, 50],
  ];

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 500"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        style={{ opacity }}
      >
        {/* Constellation lines */}
        {stars.slice(0, -1).map(([x, y], i) => (
          i % 3 !== 2 && (
            <line
              key={i}
              x1={x} y1={y}
              x2={stars[i + 1][0]} y2={stars[i + 1][1]}
              stroke={color}
              strokeWidth="0.5"
              strokeDasharray="3 5"
            />
          )
        ))}

        {/* Stars */}
        {stars.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={i % 4 === 0 ? 3 : 2} fill={color} opacity="0.6" />
            {i % 4 === 0 && (
              <>
                <line x1={x - 6} y1={y} x2={x + 6} y2={y} stroke={color} strokeWidth="0.6" />
                <line x1={x} y1={y - 6} x2={x} y2={y + 6} stroke={color} strokeWidth="0.6" />
              </>
            )}
          </g>
        ))}

        {/* DNA double helix rising */}
        <g stroke={color} strokeWidth="0.8">
          {Array.from({ length: 12 }).map((_, i) => (
            <g key={i}>
              <path
                d={`M${700 + Math.sin(i * 0.6) * 30} ${400 - i * 30} Q${715} ${385 - i * 30} ${730 - Math.sin(i * 0.6) * 30} ${370 - i * 30}`}
                strokeWidth="0.7"
              />
              {i % 2 === 0 && (
                <line
                  x1={700 + Math.sin(i * 0.6) * 30}
                  y1={400 - i * 30}
                  x2={730 - Math.sin(i * 0.6) * 30}
                  y2={370 - i * 30}
                  strokeWidth="0.5"
                  strokeDasharray="2 2"
                />
              )}
            </g>
          ))}
        </g>

        {/* Knowledge particles rising from bottom */}
        {Array.from({ length: 15 }).map((_, i) => (
          <circle
            key={i}
            cx={100 + i * 90}
            cy={450 - (i % 4) * 30}
            r={2 + (i % 3)}
            fill={color}
            opacity="0.3"
          />
        ))}

        {/* Book transforming into light */}
        <g stroke={color} strokeWidth="0.9">
          <rect x="280" y="350" width="80" height="100" rx="4" />
          <line x1="320" y1="350" x2="320" y2="450" />
          {/* Pages opening */}
          <path d="M360 390 Q380 380 395 385 Q410 390 415 400" />
          <path d="M360 410 Q380 400 398 406 Q412 412 414 422" />
        </g>
      </svg>
    </div>
  );
}
