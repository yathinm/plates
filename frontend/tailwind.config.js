/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        uber: {
          black: '#000000',
          white: '#FFFFFF',
          gray050: '#F6F6F6',
          gray200: '#E2E2E2',
          gray700: '#545454',
          ink: '#111111',
          success: '#0A7F5A',
          successSoft: '#E8F5EF',
          warning: '#A85F00',
        },
        brand: {
          electric:  '#000000',
          sky:       '#545454',
          deep:      '#111111',
        },
        gym: {
          black:     '#FFFFFF',
          dark:      '#FFFFFF',
          slate:     '#F6F6F6',
          muted:     '#545454',
          border:    '#E2E2E2',
        },
        success:     '#0A7F5A',
        warning:     '#A85F00',
        danger:      '#B42318',
        hype:        '#111111',
      },
      fontFamily: {
        display: ['Helvetica Neue', 'Arial', 'sans-serif'],
        sans: ['Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['SpaceMono', 'SF Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
