export type ThemeMode = 'dark';

// Dark-only hook: always returns 'dark'
export function useTheme(): ThemeMode {
  return 'dark';
}
