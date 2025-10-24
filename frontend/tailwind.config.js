/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom colors for the dark mystery theme with yellow/gold accents
      colors: {
        'detective-dark': '#0a0a0a',
        'detective-darker': '#050505',
        'detective-gray': '#1a1a1a',
        'detective-gold': '#FFD700',
        'detective-gold-dark': '#B8860B',
        'detective-gold-light': '#FFED4E',
      },
      fontFamily: {
        'detective': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
