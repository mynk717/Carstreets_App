
const { fontFamily } = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'orange_crayola': {
          DEFAULT: '#ff6b35',
          100: '#3d1000',
          200: '#7a2100',
          300: '#b83100',
          400: '#f54100',
          500: '#ff6b35',
          600: '#ff875c',
          700: '#ffa585',
          800: '#ffc3ad',
          900: '#ffe1d6'
        },
        'peach': {
          DEFAULT: '#f7c59f',
          100: '#4b2406',
          200: '#97480c',
          300: '#e26d12',
          400: '#f19955',
          500: '#f7c59f',
          600: '#f9d2b4',
          700: '#faddc6',
          800: '#fce8d9',
          900: '#fdf4ec'
        },
        'beige': {
          DEFAULT: '#efefd0',
          100: '#434317',
          200: '#86862e',
          300: '#c2c24c',
          400: '#d9d98f',
          500: '#efefd0',
          600: '#f3f3db',
          700: '#f6f6e4',
          800: '#f9f9ed',
          900: '#fcfcf6'
        },
        'polynesian_blue': {
          DEFAULT: '#004e89',
          100: '#00101c',
          200: '#001f37',
          300: '#002f53',
          400: '#003e6e',
          500: '#004e89',
          600: '#0078d4',
          700: '#209eff',
          800: '#6abeff',
          900: '#b5dfff'
        },
        'lapis_lazuli': {
          DEFAULT: '#1a659e',
          100: '#051420',
          200: '#0a283f',
          300: '#0f3c5f',
          400: '#15507e',
          500: '#1a659e',
          600: '#2388d6',
          700: '#57a6e4',
          800: '#8fc4ed',
          900: '#c7e1f6'
        }
      }
    },
  },
  plugins: [],
}

