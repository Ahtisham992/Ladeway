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
          light: '#2E75B6',
          dark: '#163A5F',
        },
        secondary: {
          DEFAULT: '#64748B',
          light: '#94A3B8',
        },
        background: '#FAFAF9',
        surface: '#F1F5F9',
        accent: {
          DEFAULT: '#B45309',
        },
        success: {
          DEFAULT: '#15803D',
        },
        warning: {
          DEFAULT: '#B45309',
        },
        error: {
          DEFAULT: '#DC2626',
        },
        border: '#E2E8F0',
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
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'dash-scroll': {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        }
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'float-delayed': 'float 4s ease-in-out 2s infinite',
        'dash-scroll': 'dash-scroll 2s linear infinite',
        'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};

export default config;
