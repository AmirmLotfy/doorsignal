import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        parchment: '#F5F2EB',
        porcelain: '#FDFAF5',
        carbon: '#121817',
        vermilion: {
          DEFAULT: '#E64A26',
          dark: '#D13F1D',
          light: '#FCECE8'
        },
        teal: {
          DEFAULT: '#12756A',
          dark: '#0E5C53',
          light: '#E6F3F1'
        },
        amber: {
          DEFAULT: '#C78B2D',
          dark: '#B37920',
          light: '#FAF3E8'
        },
        sage: {
          DEFAULT: '#356852',
          light: '#EAF2EE'
        },
        alloy: {
          DEFAULT: '#D2D8D4',
          deep: '#B8C2BD',
          sub: '#E5EAE7'
        },
        slate: '#5C6966'
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace']
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '3px',
        md: '4px',
        panel: '6px',
        chassis: '8px'
      },
      boxShadow: {
        bevel: 'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 1px 2px rgba(18, 24, 23, 0.08)',
        'bevel-dark': 'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 1px 3px rgba(0, 0, 0, 0.35)',
        well: 'inset 0 1px 2px rgba(18, 24, 23, 0.12)',
        'led-teal': '0 0 8px rgba(18, 117, 106, 0.75)',
        'led-vermilion': '0 0 8px rgba(230, 74, 38, 0.75)',
        'led-amber': '0 0 8px rgba(199, 139, 45, 0.75)'
      }
    }
  },
  plugins: []
};
export default config;
