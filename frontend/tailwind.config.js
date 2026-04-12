/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // 'class' strategy: aplica/remove a classe .dark no <html> via JS
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        // stage-* usa variáveis CSS com RGB triplets para suportar opacidade
        // ex: bg-stage-800/90 → rgb(var(--c-stage-800) / 0.9)
        stage: {
          900: 'rgb(var(--c-stage-900) / <alpha-value>)',
          800: 'rgb(var(--c-stage-800) / <alpha-value>)',
          700: 'rgb(var(--c-stage-700) / <alpha-value>)',
          600: 'rgb(var(--c-stage-600) / <alpha-value>)',
          500: 'rgb(var(--c-stage-500) / <alpha-value>)',
        },
        // gray-* usa variáveis CSS — valores invertidos no tema claro
        gray: {
          100: 'var(--c-gray-100)',
          200: 'var(--c-gray-200)',
          300: 'var(--c-gray-300)',
          400: 'var(--c-gray-400)',
          500: 'var(--c-gray-500)',
          600: 'var(--c-gray-600)',
          700: 'var(--c-gray-700)',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Lato"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
