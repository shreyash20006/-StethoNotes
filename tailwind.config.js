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
          DEFAULT: '#0F2D6B',
          dark: '#0A1F4D',
          light: '#1D4596',
        },
        accent: {
          DEFAULT: '#1FB6D4',
          hover: '#189CB6',
          light: '#E6F7FA',
        },
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
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-custom': 'bounce-custom 1s ease-in-out infinite',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'glow': 'glow 2s ease-in-out infinite',
        'rotate-360': 'rotate-360 2s linear infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
      },
    },
  },
  plugins: [],
}
