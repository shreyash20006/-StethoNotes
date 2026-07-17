import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

// ============================================
// COMPONENT: MagneticButton
// Magnetic hover effect (leans toward cursor within ~90px)
// Click ripple effect from exact pointer coordinates.
// ============================================

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
  className?: string;
}

interface Ripple {
  x: number;
  y: number;
  id: number;
}

export default function MagneticButton({
  children,
  variant = 'primary',
  className = '',
  onClick,
  ...props
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleIdRef = useRef(0);

  // Motion coordinates for the magnetic pull
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Soft spring physics
  const springConfig = { stiffness: 120, damping: 18, mass: 0.8 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current;
    if (!button) return;

    const { left, top, width, height } = button.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;

    // Check if mouse is within 90px active magnetic pull radius
    const distance = Math.hypot(distanceX, distanceY);
    if (distance < 90) {
      // Pull toward cursor by 35% of the distance
      x.set(distanceX * 0.35);
      y.set(distanceY * 0.35);
    } else {
      // Out of range: spring back
      x.set(0);
      y.set(0);
    }
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const rippleX = e.clientX - rect.left;
    const rippleY = e.clientY - rect.top;

    const newRipple = {
      x: rippleX,
      y: rippleY,
      id: rippleIdRef.current++,
    };

    setRipples((prev) => [...prev, newRipple]);

    // Clean up ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
  };

  return (
    <motion.button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      onClick={onClick}
      style={{ x: springX, y: springY }}
      className={`relative overflow-hidden group select-none ${
        variant === 'primary'
          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/20'
          : 'border border-cyan-500/30 text-paper hover:bg-cyan-500/5'
      } px-6 py-3 rounded-xl font-display font-medium text-xs tracking-wider uppercase transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 focus-visible:outline-offset-2 ${className}`}
      {...(props as any)}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>

      {/* Hover glow shine */}
      <span className="absolute inset-0 bg-gradient-to-r from-cyan-400/25 to-blue-400/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Ripple elements */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute bg-white/20 rounded-full animate-ripple pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 80,
            height: 80,
          }}
        />
      ))}

      {/* Ripple Animation styles */}
      <style>{`
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 0.8;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }
        .animate-ripple {
          animation: ripple 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
      `}</style>
    </motion.button>
  );
}
