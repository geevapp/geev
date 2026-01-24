'use client';

import { useTheme as useNextTheme } from 'next-themes';

export function useTheme() {
  const { theme, setTheme, systemTheme, resolvedTheme } = useNextTheme();

  return {
    theme,
    setTheme,
    systemTheme,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
  };
}
