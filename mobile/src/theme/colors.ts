// SparkMatch Design System — Colors
// A vibrant pink-to-purple gradient theme with dark mode support

export const Colors = {
  // Primary Gradient
  primary: '#FF4D67',        // Coral pink
  primaryDark: '#E8364F',
  primaryLight: '#FF7A8F',
  secondary: '#A855F7',      // Purple
  secondaryDark: '#8B3FD4',
  secondaryLight: '#C084FC',

  // Gradient Stops (tuples for expo-linear-gradient)
  gradient: {
    primary: ['#FF4D67', '#FF6B6B', '#A855F7'] as [string, string, string],
    hot: ['#FF4D67', '#FF6347', '#FF8C00'] as [string, string, string],
    cool: ['#A855F7', '#6366F1', '#3B82F6'] as [string, string, string],
    gold: ['#F59E0B', '#EAB308', '#FBBF24'] as [string, string, string],
    dark: ['#1E293B', '#0F172A'] as [string, string],
    card: ['rgba(255,77,103,0.1)', 'rgba(168,85,247,0.05)'] as [string, string],
  },

  // Accent colors
  neon: {
    pink: '#FF4D67',
    purple: '#A855F7',
    blue: '#3B82F6',
    green: '#10B981',
    orange: '#F97316',
    gold: '#FBBF24',
  },

  // Action colors
  like: '#10B981',           // Green for like
  dislike: '#EF4444',        // Red for dislike
  superLike: '#3B82F6',      // Blue for super like
  boost: '#FBBF24',          // Gold for boost

  // Dark Theme (Primary)
  dark: {
    bg: '#0F172A',           // Deep navy
    bgSecondary: '#1E293B',  // Lighter navy
    bgTertiary: '#334155',   // Card backgrounds
    bgElevated: '#1E293B',
    surface: '#1E293B',
    surfaceLight: '#334155',
    border: '#475569',
    borderLight: '#334155',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textInverse: '#0F172A',
  },

  // Light Theme
  light: {
    bg: '#FFFFFF',
    bgSecondary: '#F8FAFC',
    bgTertiary: '#F1F5F9',
    bgElevated: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceLight: '#F8FAFC',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textInverse: '#F8FAFC',
  },

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Social
  google: '#EA4335',
  apple: '#000000',

  // Overlay
  overlay: 'rgba(15, 23, 42, 0.7)',
  overlayLight: 'rgba(15, 23, 42, 0.3)',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  verified: '#3B82F6',
  online: '#10B981',
};

export type ThemeColors = typeof Colors.dark;
