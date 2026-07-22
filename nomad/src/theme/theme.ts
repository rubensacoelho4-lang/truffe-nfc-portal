// theme.ts — design system centralisé (§10 du skill terrain).
// Un seul endroit pour les couleurs, espacements, rayons, typos, ombres.

export const COLORS = {
  bg: '#0E1116',
  bgElevated: '#171B22',
  card: '#1E242D',
  cardAlt: '#242B35',
  border: '#2C333D',
  text: '#F4F6F8',
  textMuted: '#9BA4B0',
  textFaint: '#6B7480',
  primary: '#3B82F6',
  accent: '#F59E0B',
  money: '#FBBF24',
  gems: '#34D399',
  miles: '#A78BFA',
  success: '#22C55E',
  danger: '#EF4444',
  progress: '#3B82F6',
  progressTrack: '#2C333D',
  locked: '#3A414B',
} as const;

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 } as const;

export const RADIUS = { sm: 6, md: 10, lg: 14, xl: 20, full: 999, pill: 999 } as const;

export const FONT_SIZE = {
  xs: 10,
  caption: 11,
  label: 12,
  body: 14,
  subtitle: 16,
  title: 18,
  headline: 22,
  display: 30,
} as const;

export const FONT_WEIGHT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;
