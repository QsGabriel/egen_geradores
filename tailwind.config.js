/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        egen: {
          navy: '#0D2A59',
          yellow: '#F3B229',
          blue: '#6A93C7',
          green: '#7AC15F',
          red: '#E5484D',
          'gray-dark': '#2B2B2B',
          'gray-mid': '#6B6B6B',
          bg: '#F5F7FA',
          // Dark mode surfaces
          'dark-bg': '#07152D',
          'dark-surface': '#102140',
          'dark-text': '#F5F7FA',
        },
      },
      boxShadow: {
        card: '0 4px 6px rgba(13, 42, 89, 0.05)',
        'card-hover': '0 10px 25px rgba(13, 42, 89, 0.1)',
      },
      borderRadius: {
        card: '10px',
      },
    },
  },
  plugins: [],
};
