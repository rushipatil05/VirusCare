/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0b1120',
          800: '#111827',
          700: '#1a2537',
          600: '#243047',
        },
        teal: {
          50:  '#f0faf9',
          100: '#ccf0eb',
          200: '#99e0d7',
          300: '#5cc9bb',
          400: '#2dab9e',
          500: '#0e8f83',
          600: '#0a716a',
          700: '#085a54',
          800: '#074641',
          900: '#063632',
        },
        cream: {
          50:  '#faf8f5',
          100: '#f4f0ea',
          200: '#e8e1d5',
        },
        clinical: {
          border: '#ddd8d0',
          muted:  '#6b6560',
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: {
        'sm': '3px',
        DEFAULT: '5px',
        'md': '7px',
        'lg': '10px',
        'xl': '14px',
      }
    },
  },
  plugins: [],
}
