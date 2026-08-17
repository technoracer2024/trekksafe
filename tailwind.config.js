/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cyan: {
          DEFAULT: '#0891B2',
          light: '#06B6D4',
          glow: '#22D3EE',
          dark: '#0E7490',
        },
        ink: {
          DEFAULT: '#0F172A',
          2: '#475569',
          3: '#94A3B8',
        },
        bg: {
          DEFAULT: '#FAFAFA',
          2: '#F1F5F9',
          3: '#E2E8F0',
          dark: '#060A15',
          dark2: '#0B1120',
          dark3: '#111827',
          darkCard: '#0F172A',
        },
        status: {
          green: '#10B981',
          amber: '#F59E0B',
          red: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ecg': 'ecgFlow 2.2s linear infinite',
      },
      keyframes: {
        ecgFlow: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
}
