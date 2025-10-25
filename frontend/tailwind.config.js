/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Dark theme colors
      colors: {
        dark: {
          bg: '#0a0a0a',
          surface: '#1a1a1a',
          elevated: '#252525',
          border: '#2a2a2a',
        },
        // Gold accent palette
        gold: {
          50: '#FFFBEB',
          100: '#FFF3C4',
          200: '#FFE894',
          300: '#FFDA54',
          400: '#FFC700',
          500: '#FFD700', // Primary gold
          600: '#E6C200',
          700: '#B89D00',
          800: '#8A7500',
          900: '#5C4E00',
        },
      },
      // Custom shadows with gold glow effects
      boxShadow: {
        'gold': '0 0 20px rgba(255, 215, 0, 0.3)',
        'gold-lg': '0 0 40px rgba(255, 215, 0, 0.5)',
      },
      // Font families
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
