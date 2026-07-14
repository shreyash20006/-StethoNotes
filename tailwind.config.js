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
        display: ['Outfit', 'sans-serif'],
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
