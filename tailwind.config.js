/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF5F5',
          100: '#FFE6E6', 
          200: '#FFCDCD',
          300: '#FFB4B4',
          400: '#FF9B9B',
          500: '#FF8282',
          600: '#E5989B', // Pastel pink as primary
          700: '#B5838D',
          800: '#6D6875',
          900: '#4A4453',
        },
        pastel: {
          peach: '#FFCDB2',
          pink: '#FFB4A2',
          mauve: '#E5989B',
          dusty: '#B5838D',
          gray: '#6D6875'
        },
        accent: {
          50: '#F6FFF8',
          100: '#E6FFE6',
          200: '#CDFFCD',
          300: '#B4FFB4',
          400: '#9BFF9B',
          500: '#A8DADC', // Pastel blue as accent
          600: '#82CC82',
          700: '#69B569',
          800: '#4F9D4F',
          900: '#358535',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'pastel': '0 4px 6px -1px rgba(181, 131, 141, 0.1), 0 2px 4px -1px rgba(181, 131, 141, 0.06)',
      },
    },
  },
  plugins: [],
};