/**
 * Application Theme & Design Tokens
 * Replicating exact Royal Blue palette from UI screenshots & wireframe mockups
 */
export const COLORS = {
  // Brand & Primary
  primary: '#2F65CB',
  primaryDark: '#1E4696',
  primaryLight: '#EBF1FF',
  primarySubtle: '#F0F5FF',

  // Status & Badges
  available: '#2F65CB',
  notAvailable: '#F04438',
  success: '#12B76A',
  warning: '#F79009',
  info: '#0BA5EC',

  // Neutrals
  white: '#FFFFFF',
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#EEF2F6',

  // Typography
  textPrimary: '#0F172A',
  textSecondary: '#475467',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  textBlue: '#2F65CB',

  // Overlays
  overlay: 'rgba(15, 23, 42, 0.5)',
  shadow: '#000000',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const SHADOWS = {
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
};
