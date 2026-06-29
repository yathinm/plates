export const brand = {
  black: '#000000',
  white: '#FFFFFF',
  gray050: '#F6F6F6',
  gray200: '#E2E2E2',
  gray700: '#545454',
  ink: '#111111',
  success: '#0A7F5A',
  successSoft: '#E8F5EF',
  warning: '#A85F00',
  focus: 'rgba(0,0,0,0.14)',
  electric: '#000000',
  sky: '#545454',
  deep: '#111111',
} as const;

export const gym = {
  black: '#FFFFFF',
  dark: '#FFFFFF',
  slate: '#F6F6F6',
  muted: '#545454',
  border: '#E2E2E2',
} as const;

export const status = {
  success: '#0A7F5A',
  warning: '#A85F00',
  danger: '#B42318',
  hype: '#111111',
} as const;

const Colors = {
  light: {
    text: '#111111',
    background: '#FFFFFF',
    tint: brand.black,
    tabIconDefault: '#545454',
    tabIconSelected: brand.black,
    card: '#FFFFFF',
    border: '#E2E2E2',
  },
  dark: {
    text: '#111111',
    background: '#FFFFFF',
    tint: brand.black,
    tabIconDefault: '#545454',
    tabIconSelected: brand.black,
    card: '#FFFFFF',
    border: '#E2E2E2',
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export default Colors;
