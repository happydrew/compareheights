import type { Config } from 'tailwindcss'

export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './theme.config.tsx'
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0077cc",
          light: "#0099ff",
          dark: "#0055aa",
          500: "#0077cc",
        },
        "conf-black": "#0e031c",
        black: "#1b1b1b",
      },
      keyframes: {
        'autoFormAI-horizontalScroll': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(calc(-50%))' },
        }
      },

      animation: {
        'autoFormAI-horizontalScroll': 'autoFormAI-horizontalScroll 20s linear infinite',
      },
    },
    screens: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    }
  },
  plugins: [],
  darkMode: 'class'
} satisfies Config
