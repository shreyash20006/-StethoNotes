/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1FB6D4', // Brand Cyan
          dark: '#189CB6',
        },
        accent: {
          DEFAULT: '#3B82F6', // Blue
          hover: '#2563EB',
        },
        void: '#060D1A',
        darkest: '#081729',
        card: '#0D1B2A',
        paper: '#FFFFFF',
        muted: '#94A3B8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'cyan-soft': '0 10px 30px -10px rgba(31, 182, 212, 0.15)',
        'cyan-hover': '0 15px 35px -5px rgba(31, 182, 212, 0.25)',
      },
      backgroundImage: {
        'navy-cyan': 'linear-gradient(135deg, #0F2D6B 0%, #1FB6D4 100%)',
        'dark-navy': 'linear-gradient(180deg, #0A1F4D 0%, #0F2D6B 100%)',
      },
    },
  },
  plugins: [],
}
