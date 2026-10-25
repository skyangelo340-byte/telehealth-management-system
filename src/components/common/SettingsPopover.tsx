import React, { useState, useRef, useEffect } from 'react';
import { Settings, Sun, Moon, Check, X } from 'lucide-react';
import { useLanguage, AppLanguage } from '../../context/LanguageContext';
import { useTheme, ThemeMode } from '../../context/ThemeContext';

interface SettingsPopoverProps {
  className?: string;
  buttonClassName?: string;
}

export const SettingsPopover: React.FC<SettingsPopoverProps> = ({
  className = 'hidden sm:inline-block',
  buttonClassName = '',
}) => {
  const { language, setLanguage, isTagalog, t } = useLanguage();
  const { theme, isDark, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close popover on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Keyboard navigation & Escape key listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectLanguage = (lang: AppLanguage) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  const handleSelectTheme = (mode: ThemeMode) => {
    setTheme(mode);
    setIsOpen(false);
  };

  const settingsTitle = isTagalog ? 'Mga Setting' : 'Settings';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Settings Icon Button (Gear) */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={settingsTitle}
        title={settingsTitle}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`neu-btn w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-[#172B4D] dark:text-[#F0F5FF] hover:text-[#3478F6] dark:hover:text-[#60A5FA] cursor-pointer shadow-xs bg-[#E9EEF3] dark:bg-[#142040] border border-black/5 dark:border-white/10 transition-all ${buttonClassName}`}
      >
        <Settings
          className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-300 ${
            isOpen ? 'rotate-90 text-[#3478F6] dark:text-[#60A5FA]' : ''
          }`}
        />
      </button>

      {/* Settings Popover Dropdown */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={settingsTitle}
          className="absolute right-0 top-full mt-2 w-72 sm:w-80 neu-raised-lg rounded-2xl p-4 z-50 bg-[#E9EEF3] dark:bg-[#121B35] border border-black/10 dark:border-white/10 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold text-[#172B4D] dark:text-[#F0F5FF]">
              <Settings className="w-4 h-4 text-[#3478F6] dark:text-[#60A5FA]" />
              <span>{isTagalog ? 'Mga Setting ng App' : 'App Settings'}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label={isTagalog ? 'Isara' : 'Close'}
              className="text-[#64748B] dark:text-[#A7B4CC] hover:text-[#172B4D] dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Language Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#A7B4CC]">
              <span>{isTagalog ? 'Wika' : 'Language'}</span>
              <span className="font-mono text-[10px] text-[#3478F6] dark:text-[#60A5FA]">
                {language === 'en' ? 'English (US)' : 'Filipino (PH)'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectLanguage('en')}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  language === 'en'
                    ? 'neu-btn-primary text-white shadow-xs'
                    : 'neu-btn text-[#172B4D] dark:text-[#F0F5FF] hover:bg-white/60 dark:hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-sm">🇺🇸</span>
                  <span>English</span>
                </span>
                {language === 'en' && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => handleSelectLanguage('tl')}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  language === 'tl'
                    ? 'neu-btn-primary text-white shadow-xs'
                    : 'neu-btn text-[#172B4D] dark:text-[#F0F5FF] hover:bg-white/60 dark:hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-sm">🇵🇭</span>
                  <span>Tagalog</span>
                </span>
                {language === 'tl' && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            </div>
          </div>

          {/* 2. Light / Dark Theme Selector */}
          <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/10">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#A7B4CC]">
              <span>{isTagalog ? 'Tema' : 'Theme'}</span>
              <span className="font-mono text-[10px] text-[#3478F6] dark:text-[#60A5FA]">
                {isDark ? (isTagalog ? 'Madilim' : 'Dark') : (isTagalog ? 'Maliwanag' : 'Light')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectTheme('light')}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  !isDark
                    ? 'neu-btn-primary text-white shadow-xs'
                    : 'neu-btn text-[#172B4D] dark:text-[#F0F5FF] hover:bg-white/60 dark:hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{isTagalog ? 'Maliwanag' : 'Light'}</span>
                </span>
                {!isDark && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => handleSelectTheme('dark')}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isDark
                    ? 'neu-btn-primary text-white shadow-xs'
                    : 'neu-btn text-[#172B4D] dark:text-[#F0F5FF] hover:bg-white/60 dark:hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{isTagalog ? 'Madilim' : 'Dark'}</span>
                </span>
                {isDark && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
