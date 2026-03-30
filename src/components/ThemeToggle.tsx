import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative p-2 rounded-xl transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-egen-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-egen-dark-bg ${className}`}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      <div className="relative w-5 h-5 overflow-hidden">
        {/* Sun icon */}
        <Sun 
          className={`absolute inset-0 w-5 h-5 text-amber-500 transition-all duration-300 transform ${
            isDark 
              ? 'rotate-90 scale-0 opacity-0' 
              : 'rotate-0 scale-100 opacity-100'
          }`}
        />
        {/* Moon icon */}
        <Moon 
          className={`absolute inset-0 w-5 h-5 text-egen-blue transition-all duration-300 transform ${
            isDark 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;
