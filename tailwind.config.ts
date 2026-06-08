import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        surface: {
          50:  '#030a05',
          100: '#050e08',
          200: '#070f0b',
          300: '#0a1610',
          400: '#0d2318',
          500: '#1a4a2e',
          600: '#2d6a3f',
          700: '#4a7a5a',
        },
      },
      backgroundImage: {
        'grid-pattern': `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='%230d2318' stroke-width='0.5'/%3e%3c/svg%3e")`,
      },
    },
  },
  plugins: [],
}

export default config
