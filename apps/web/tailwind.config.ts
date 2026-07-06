import type { Config } from 'tailwindcss';

/**
 * Tailwind CSS configuration for Ladeway.
 *
 * Design tokens from the specification:
 * - Primary: Deep navy #1F4E79
 * - Secondary: Slate grey #64748B
 * - Background: Warm off-white #FAFAF9
 * - Accent: Muted brass #B45309
 * - Success/Hot: Deep green #15803D
 * - Warning/Warm: Amber #B45309
 * - Neutral/Cold: Slate #64748B
 * - Font: Inter
 * - Motion: 150ms ease transitions only
 */
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1F4E79',
          50: '#EBF1F7',
          100: '#D7E3EF',
          200: '#AFC7DF',
          300: '#87ABCF',
          400: '#5F8FBF',
          500: '#1F4E79',
          600: '#1B4469',
          700: '#173A5A',
          800: '#13304A',
          900: '#0F263B',
        },
        secondary: {
          DEFAULT: '#64748B',
          50: '#F1F5F9',
          100: '#E2E8F0',
          200: '#CBD5E1',
          300: '#94A3B8',
          400: '#64748B',
          500: '#475569',
          600: '#334155',
          700: '#1E293B',
        },
        background: '#FAFAF9',
        accent: {
          DEFAULT: '#B45309',
          50: '#FFF8EB',
          100: '#FEF0CD',
          200: '#FDE09B',
          300: '#FCD269',
          400: '#D99A2A',
          500: '#B45309',
          600: '#92400E',
        },
        success: {
          DEFAULT: '#15803D',
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#22C55E',
          500: '#15803D',
          600: '#166534',
        },
        warning: {
          DEFAULT: '#B45309',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#F59E0B',
          500: '#B45309',
          600: '#92400E',
        },
        neutral: {
          DEFAULT: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'ease',
      },
    },
  },
  plugins: [],
};

export default config;
