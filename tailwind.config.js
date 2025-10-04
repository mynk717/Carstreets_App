
const { fontFamily } = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', ...fontFamily.sans],
        mono: ['var(--font-geist-mono)', ...fontFamily.mono],
        inter: ['var(--font-inter)'],
        'plus-jakarta-sans': ['var(--font-plus-jakarta-sans)'],
        'geist-sans': ['var(--font-geist-sans)'],
      },
    },
  },
  plugins: [],
}
