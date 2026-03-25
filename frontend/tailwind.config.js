/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          electric:  '#2563EB', // Primary action, links, active tabs
          sky:       '#38BDF8', // Secondary highlights
          deep:      '#1E3A5F', // Dark accent for headers
        },
        gym: {
          black:     '#0A0A0F', // Deepest background
          dark:      '#141419', // Card / surface background
          slate:     '#1E1E26', // Elevated surface
          muted:     '#71717A', // Placeholder text, disabled states
          border:    '#27272F', // Subtle dividers
        },
        success:     '#22C55E', // PR banners, positive delta
        warning:     '#F59E0B', // RPE 9–10, caution states
        danger:      '#EF4444', // Destructive actions, errors
        hype:        '#A855F7', // Social hype pulse
      },
      fontFamily: {
        mono: ['SpaceMono'],
      },
    },
  },
  plugins: [],
};
