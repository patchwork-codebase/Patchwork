import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggleBtn({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted || !theme) return null;
  
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTheme(isDark ? 'light' : 'dark');
  };
  
  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex items-center justify-center transition-all group text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white cursor-pointer ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 pointer-events-none" />
      ) : (
        <Moon className="w-5 h-5 pointer-events-none" />
      )}
    </button>
  );
}
