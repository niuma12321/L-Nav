/**
 * Y-Nav V3 Design System - Emerald Obsidian
 * @version 3.0.0
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './public/index.html',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // V3 Color System - Emerald Obsidian
      colors: {
        // Base colors
        obsidian: {
          DEFAULT: '#0d0e10',
          light: '#15171a',
          lighter: '#181a1c',  // V3 card background
          card: '#1e2127',
          hover: '#252a32',
        },
        // Emerald accent
        emerald: {
          DEFAULT: '#10b981',
          light: '#34d399',
          glow: '#69f6b8',
          soft: 'rgba(16, 185, 129, 0.1)',
          'soft-hover': 'rgba(16, 185, 129, 0.2)',
        },
        // Semantic colors
        surface: {
          DEFAULT: '#181a1c',
          elevated: '#1e2127',
          overlay: 'rgba(13, 14, 16, 0.8)',
        },
        // Text colors
        text: {
          primary: '#f8fafc',
          secondary: '#94a3b8',
          muted: '#64748b',
        },
      },

      // Border radius - V3 uses 1.5rem (24px) for cards
      borderRadius: {
        'v3': '1.5rem',      // 24px - main card radius
        'v3-sm': '1rem',     // 16px - small elements
        'v3-lg': '2rem',     // 32px - large elements
      },

      // Shadows - V3 uses subtle emerald glow
      boxShadow: {
        'v3-card': '0 4px 24px -8px rgba(16, 185, 129, 0.08)',
        'v3-card-hover': '0 8px 32px -8px rgba(16, 185, 129, 0.15)',
        'v3-glow': '0 0 40px -8px rgba(16, 185, 129, 0.3)',
        'v3-button': '0 4px 16px -4px rgba(16, 185, 129, 0.4)',
      },

      // Backdrop blur - V3 uses 80% glassmorphism
      backdropBlur: {
        'v3': '16px',
      },

      // Spacing for touch targets (48px minimum)
      spacing: {
        'touch': '48px',
        'touch-sm': '44px',
      },

      // Animation
      transitionTimingFunction: {
        'v3': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'v3-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      // Font family
      fontFamily: {
        sans: ['Manrope', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', 'sans-serif'],
        display: ['Outfit', 'Manrope', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', 'sans-serif'],
      },
    },
  },

  plugins: [
    // Custom plugin for V3 utilities
    function({ addUtilities }) {
      addUtilities({
        // V3 card style
        '.v3-card': {
          backgroundColor: '#181a1c',
          borderRadius: '1.5rem',
          boxShadow: '0 4px 24px -8px rgba(16, 185, 129, 0.08)',
          border: 'none',
        },
        '.v3-card-hover': {
          '&:hover': {
            boxShadow: '0 8px 32px -8px rgba(16, 185, 129, 0.15)',
            transform: 'translateY(-2px)',
          },
        },
        // V3 glassmorphism
        '.v3-glass': {
          backgroundColor: 'rgba(24, 26, 28, 0.8)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        },
        // V3 CTA button
        '.v3-button-primary': {
          background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
          color: '#0d0e10',
          fontWeight: '600',
          borderRadius: '1rem',
          padding: '0.75rem 1.5rem',
          boxShadow: '0 4px 16px -4px rgba(16, 185, 129, 0.4)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
        // Touch target
        '.touch-target': {
          minHeight: '48px',
          minWidth: '48px',
        },
        '.touch-target-sm': {
          minHeight: '44px',
          minWidth: '44px',
        },
        // Scrollbar hide
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        // Safe area padding
        '.pb-safe': {
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        '.pt-safe': {
          paddingTop: 'env(safe-area-inset-top)',
        },
      });
    },
  ],
};

export default config;
