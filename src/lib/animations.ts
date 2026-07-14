import { Variants } from 'framer-motion';
import gsap from 'gsap';
import { ANIMATIONS, MOTION_VARIANTS } from '@/styles/design-tokens';

/**
 * Scroll-triggered animation utility using GSAP ScrollTrigger
 */
export const createScrollReveal = (selector: string, options?: gsap.ToVars) => {
  return gsap.to(selector, {
    scrollTrigger: selector,
    duration: ANIMATIONS.duration.slow / 1000,
    opacity: 1,
    y: 0,
    ease: 'power2.out',
    ...options,
  });
};

/**
 * Staggered children animation
 */
export const staggerChildren = (duration = 0.3, delay = 0.1): Variants => ({
  animate: {
    transition: {
      staggerChildren: delay,
      delayChildren: delay,
      duration,
    },
  },
});

/**
 * Magnetic button effect (follows cursor)
 */
export const createMagneticButton = (element: HTMLElement) => {
  let x = 0;
  let y = 0;

  element.addEventListener('mousemove', (e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    x = e.clientX - centerX;
    y = e.clientY - centerY;

    gsap.to(element, {
      x: x * 0.3,
      y: y * 0.3,
      duration: 0.3,
    });
  });

  element.addEventListener('mouseleave', () => {
    gsap.to(element, {
      x: 0,
      y: 0,
      duration: 0.3,
    });
  });
};

/**
 * Ripple effect on click
 */
export const createRippleEffect = (event: React.MouseEvent<HTMLElement>) => {
  const button = event.currentTarget;
  const circle = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.position = 'absolute';
  circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
  circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
  circle.classList.add('ripple');

  button.appendChild(circle);

  setTimeout(() => circle.remove(), 600);
};

/**
 * Animated counter
 */
export const animateCounter = (
  element: HTMLElement,
  start: number,
  end: number,
  duration: number = 2000
) => {
  const obj = { value: start };
  gsap.to(obj, {
    value: end,
    duration: duration / 1000,
    onUpdate: () => {
      element.textContent = Math.floor(obj.value).toLocaleString();
    },
  });
};

/**
 * Parallax effect
 */
export const createParallax = (element: HTMLElement, speed: number = 0.5) => {
  window.addEventListener('scroll', () => {
    const yPos = -window.scrollY * speed;
    gsap.to(element, {
      y: yPos,
      duration: 0,
    });
  });
};

/**
 * Floating animation (continuous)
 */
export const floatingAnimation = (duration: number = 3): Variants => ({
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
});
