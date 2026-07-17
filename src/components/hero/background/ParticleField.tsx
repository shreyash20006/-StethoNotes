import { useEffect, useRef } from 'react';
import type { MotionValue } from 'motion/react';

// ============================================
// COMPONENT: ParticleField
// Canvas2D-based particle system with 5 shape types.
// Updates speed on-the-fly using the smoothed scroll progress.
// ============================================

interface ParticleFieldProps {
  scrollProgress: MotionValue<number>;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  opacity: number;
  type: 'dot' | 'plus' | 'hexagon' | 'dna' | 'glow';
  rotation: number;
  rotSpeed: number;
}

export default function ParticleField({ scrollProgress }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // Respect user reduced-motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Initialize particles
    const particleCount = Math.min(60, Math.floor((width * height) / 25000));
    const particles: Particle[] = [];
    const types: Particle['type'][] = ['dot', 'plus', 'hexagon', 'dna', 'glow'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 12 + 4,
        speedY: Math.random() * 0.4 + 0.1,
        opacity: Math.random() * 0.2 + 0.1, // 10% to 30%
        type: types[Math.floor(Math.random() * types.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.01,
      });
    }

    const drawParticle = (p: Particle) => {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.type === 'dot') {
        ctx.fillStyle = '#1FB6D4';
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'plus') {
        ctx.strokeStyle = '#4DE8FF';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-p.size / 2, 0);
        ctx.lineTo(p.size / 2, 0);
        ctx.moveTo(0, -p.size / 2);
        ctx.lineTo(0, p.size / 2);
        ctx.stroke();
      } else if (p.type === 'hexagon') {
        ctx.strokeStyle = '#8FA3C4';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let side = 0; side < 6; side++) {
          const angle = (side * Math.PI) / 3;
          const x = (p.size / 2) * Math.cos(angle);
          const y = (p.size / 2) * Math.sin(angle);
          if (side === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      } else if (p.type === 'dna') {
        // Simple helical rung representation
        ctx.strokeStyle = '#8FA3C4';
        ctx.fillStyle = '#1FB6D4';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-p.size / 2, -p.size / 4);
        ctx.lineTo(p.size / 2, p.size / 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-p.size / 2, -p.size / 4, 2, 0, Math.PI * 2);
        ctx.arc(p.size / 2, p.size / 4, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'glow') {
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
        gradient.addColorStop(0, 'rgba(31,182,212,0.3)');
        gradient.addColorStop(1, 'rgba(6,13,26,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Read scroll progress (0 -> 1)
      const scroll = scrollProgress.get();
      // Drift multiplier scales from 1x to 4x based on scroll
      const speedMultiplier = prefersReducedMotion ? 0 : 1 + scroll * 3.5;

      particles.forEach((p) => {
        if (!prefersReducedMotion) {
          p.y -= p.speedY * speedMultiplier;
          p.rotation += p.rotSpeed;
        }

        // Wrap around top/bottom edges
        if (p.y < -p.size * 2) {
          p.y = height + p.size * 2;
          p.x = Math.random() * width;
        }

        drawParticle(p);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [scrollProgress]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none select-none -z-[5]" 
    />
  );
}
