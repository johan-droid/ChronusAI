/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        background: '#0F172A',
        surface: '#1E293B',
        primary: '#3B82F6',
        'primary-hover': '#2563EB',
      },
      animation: {
        'typing-dot': 'typingDot 1.4s infinite ease-in-out both',
      },
      keyframes: {
        typingDot: {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
