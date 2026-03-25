export const brand = {
  electric:  '#2563EB',
  sky:       '#38BDF8',
  deep:      '#1E3A5F',
} as const;

export const gym = {
  black:   '#0A0A0F',
  dark:    '#141419',
  slate:   '#1E1E26',
  muted:   '#71717A',
  border:  '#27272F',
} as const;

export const status = {
  success: '#22C55E',
  warning: '#F59E0B',
  danger:  '#EF4444',
  hype:    '#A855F7',
} as const;

const Colors = {
  light: {
    text:             '#0A0A0F',
    background:       '#F4F4F5',
    tint:             brand.electric,
    tabIconDefault:   '#71717A',
    tabIconSelected:  brand.electric,
    card:             '#FFFFFF',
    border:           '#E4E4E7',
  },
  dark: {
    text:             '#F4F4F5',
    background:       gym.black,
    tint:             brand.electric,
    tabIconDefault:   gym.muted,
    tabIconSelected:  brand.electric,
    card:             gym.dark,
    border:           gym.border,
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export default Colors;
