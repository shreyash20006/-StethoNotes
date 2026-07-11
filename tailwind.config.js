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
        'dark-navy': '#0A1F4D',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'cyan-soft': '0 10px 30px -10px rgba(31, 182, 212, 0.15)',
        'cyan-hover': '0 15px 35px -5px rgba(31, 182, 212, 0.25)',
        'cyan-glow': '0 0 40px rgba(31, 182, 212, 0.35)',
        'cyan-intense': '0 0 80px rgba(31, 182, 212, 0.5)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08)',
      },
      backgroundImage: {
        'navy-cyan': 'linear-gradient(135deg, #0F2D6B 0%, #1FB6D4 100%)',
        'dark-navy': 'linear-gradient(180deg, #0A1F4D 0%, #0F2D6B 100%)',
        'btn-gradient': 'linear-gradient(135deg, #0F2D6B 0%, #1FB6D4 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'float-fast': 'float 4s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-18px)' },
        },
      },
    },
  },
  plugins: [],
}
