/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B1120',
        surface: '#1E293B',
        'surface-elevated': '#334155',
        border: '#334155',
        'border-subtle': '#1E293B',
        primary: {
          DEFAULT: '#38BDF8',
          hover: '#0284C7',
          dim: '#0C4A6E',
        },
        risk: {
          critical: '#EF4444',
          high: '#F97316',
          moderate: '#FBBF24',
          low: '#10B981',
        },
      },
    },
  },
  plugins: [],
}
