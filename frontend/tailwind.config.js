/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#f9f7f4',
          card: '#ffffff',
          text: '#2c2824',
          muted: '#8c8580',
          accent: '#3b6e8f',
          'accent-light': '#e8f1f7',
          'accent-dark': '#254e68',
          success: '#4a9c7c',
          warning: '#c48a3f',
          danger: '#b84a4a',
          border: '#e8e4de',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
