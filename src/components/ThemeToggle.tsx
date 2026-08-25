import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { isDarkMode, toggleDarkMode } = useApp();

  return (
    <button
      id="theme-toggle-btn"
      onClick={toggleDarkMode}
      className={`p-2 rounded-full text-[#fed65b] hover:bg-[#1b4332] dark:hover:bg-[#1f3f2f] transition-colors ${className}`}
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle Theme"
    >
      {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};
