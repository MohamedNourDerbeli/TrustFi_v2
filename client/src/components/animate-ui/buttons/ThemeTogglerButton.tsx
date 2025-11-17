import * as React from 'react';
import { useTheme } from '../../../hooks';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon } from 'lucide-react';

export type ThemeTogglerButtonProps = {
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  direction?: 'ltr' | 'rtl' | 'ttb' | 'btt';
  className?: string;
};

function setTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement;
  if (theme === 'system') {
    root.dataset.theme = 'system';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.dataset.theme = theme;
    root.classList.toggle('dark', theme === 'dark');
  }
  localStorage.setItem('tf-theme', theme);
}

export const ThemeTogglerButton: React.FC<ThemeTogglerButtonProps> = ({
  size = 'default',
  variant = 'ghost',
  direction = 'ltr',
  className = ''
}) => {
  const mode = useTheme();
  const isDark = mode === 'dark';

  const dims = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
  const base = variant === 'outline'
    ? 'border border-gray-200 hover:bg-gray-100'
    : variant === 'ghost'
    ? 'hover:bg-gray-100'
    : 'bg-gray-100 hover:bg-gray-200';

  const rotateFrom = direction === 'rtl' ? -90 : direction === 'ltr' ? 90 : direction === 'ttb' ? 90 : -90;
  const rotateTo = 0;

  const onClick = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      aria-label="Toggle theme"
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-lg transition-colors ${dims} ${base} ${className}`}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ rotate: rotateFrom, opacity: 0, scale: 0.8 }}
            animate={{ rotate: rotateTo, opacity: 1, scale: 1 }}
            exit={{ rotate: -rotateFrom, opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Moon className="h-5 w-5 text-yellow-300" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ rotate: -rotateFrom, opacity: 0, scale: 0.8 }}
            animate={{ rotate: rotateTo, opacity: 1, scale: 1 }}
            exit={{ rotate: rotateFrom, opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Sun className="h-5 w-5 text-amber-500" />
          </motion.span>
        )}
      </AnimatePresence>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};

export default ThemeTogglerButton;
