'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const handleToggle = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} theme`}
      className="w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
