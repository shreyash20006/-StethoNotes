/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── CSS variable-based tokens (auto-switch with theme) ───
        'bg-base':    'var(--bg-base)',
        'bg-layer':   'var(--bg-layer)',
        'surface':    'var(--surface)',
        'card':       'var(--card-solid)',
        'glass':      'var(--glass)',
        'txt-primary':'var(--text-primary)',
        'txt-muted':  'var(--text-muted)',

        // ─── Semantic aliases (preserved for existing classes) ───
        primary: {
          DEFAULT: 'var(--accent-primary)',
          dark:    'color-mix(in srgb, var(--accent-primary) 80%, #000)',
        },
        accent: {
          DEFAULT: 'var(--accent-secondary)',
          hover:   'color-mix(in srgb, var(--accent-secondary) 80%, #000)',
        },
        success: 'var(--accent-success)',
        warning: 'var(--accent-warning)',
        error:   'var(--accent-error)',

        // ─── Kept for backward compat (hardcoded dark values) ───
        void:    '#07172B',
        darkest: '#0C2038',
        paper:   '#FFFFFF',
        muted:   'var(--text-muted)',
        border:  'var(--glass-border)',
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      opacity: {
        '8': '0.08',
      },
      boxShadow: {
        'cyan-soft':  '0 10px 30px -10px rgba(31, 182, 212, 0.15)',
        'cyan-hover': '0 15px 35px -5px rgba(31, 182, 212, 0.25)',
        'card':       'var(--shadow-card)',
        'hover':      'var(--shadow-hover)',
      },
      backgroundImage: {
        'navy-cyan': 'linear-gradient(135deg, #0F2D6B 0%, #1FB6D4 100%)',
        'dark-navy': 'linear-gradient(180deg, #0A1F4D 0%, #0F2D6B 100%)',
      },
    },
  },
  plugins: [],
}
