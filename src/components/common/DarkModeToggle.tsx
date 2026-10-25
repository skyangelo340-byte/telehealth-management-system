import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Moon, Sun } from 'lucide-react';

interface DarkModeToggleProps {
  variant?: 'pill' | 'header' | 'sidebar' | 'card' | 'mobile';
  collapsed?: boolean;
  className?: string;
  showLabels?: boolean;
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({
  variant = 'header',
  collapsed = false,
  className = '',
  showLabels = true,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { isTagalog } = useLanguage();

  const darkLabel = isTagalog ? 'Madilim' : 'Dark';
  const lightLabel = isTagalog ? 'Maliwanag' : 'Light';
  const darkModeTitle = isTagalog ? 'Madilim na Tema' : 'Dark mode';
  const activeLabel = isDark
    ? isTagalog
      ? 'Aktibo ang madilim na tema'
      : 'Dark theme active'
    : isTagalog
      ? 'Aktibo ang maliwanag na tema'
      : 'Light theme active';

  // 1. COLLAPSED SIDEBAR VARIANT
  if (variant === 'sidebar' && collapsed) {
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={toggleTheme}
          title={`${darkModeTitle}: ${isDark ? darkLabel : lightLabel}`}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-full neu-btn px-2 py-2.5 rounded-xl flex items-center justify-center text-xs font-semibold text-[#172B4D] hover:text-[#3478F6] transition-colors cursor-pointer"
        >
          {isDark ? (
            <div className="w-6 h-6 rounded-full bg-[#4E369C] flex items-center justify-center shadow-xs">
              <Moon className="w-3.5 h-3.5 fill-white text-white" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#F59E0B] flex items-center justify-center shadow-xs">
              <Sun className="w-3.5 h-3.5 fill-white text-white" />
            </div>
          )}
        </button>
      </div>
    );
  }

  // 2. EXPANDED SIDEBAR VARIANT (Styled in the purple/neumorphic card style from user reference image)
  if (variant === 'sidebar') {
    return (
      <div
        className={`p-3 rounded-2xl neu-inset-sm bg-white/40 border border-black/5 dark:bg-[#120B2E] dark:border-white/10 ${className}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#172B4D] dark:text-white">
              {darkModeTitle}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[#172B4D] dark:text-[#C7D2FE]">
            {isDark ? 'ON' : 'OFF'}
          </span>
        </div>

        <p className="text-[11px] text-[#64748B] dark:text-purple-200/70 mb-2.5">
          {activeLabel}
        </p>

        {/* Pill switch matching user's design */}
        <button
          type="button"
          onClick={toggleTheme}
          role="switch"
          aria-checked={isDark}
          aria-label={darkModeTitle}
          className="w-full py-1 px-1.5 rounded-xl flex items-center justify-between neu-btn cursor-pointer transition-all dark:bg-[#1B113F]"
        >
          <span className="text-xs font-semibold text-[#172B4D] dark:text-white pl-1">
            {isDark ? darkLabel : lightLabel}
          </span>

          {/* Interactive Pill Track mirroring reference image */}
          <div
            className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-300 ease-in-out ${
              isDark
                ? 'bg-[#EAE8FE] shadow-inner'
                : 'bg-[#CBD5E1] shadow-inner'
            }`}
          >
            {/* Sliding Knob with Crescent Moon */}
            <span
              className={`pointer-events-none flex h-6 w-6 transform items-center justify-center rounded-full shadow-md transition duration-300 ease-in-out ${
                isDark
                  ? 'translate-x-6 bg-[#4E369C] text-white shadow-purple-900/40'
                  : 'translate-x-0 bg-[#F59E0B] text-white shadow-amber-900/20'
              }`}
            >
              {isDark ? (
                <Moon className="h-3.5 w-3.5 fill-white text-white" />
              ) : (
                <Sun className="h-3.5 w-3.5 fill-white text-white" />
              )}
            </span>
          </div>
        </button>
      </div>
    );
  }

  // 3. CARD VARIANT (Replicates the screenshot image exactly)
  if (variant === 'card') {
    return (
      <div
        className={`p-6 sm:p-7 rounded-3xl bg-[#140A2E] text-white shadow-2xl flex flex-col items-center justify-center space-y-4 max-w-xs mx-auto border border-purple-900/30 ${className}`}
      >
        <div className="text-center space-y-1">
          <h3 className="text-2xl font-extrabold tracking-tight text-white font-display">
            {darkModeTitle}
          </h3>
          <p className="text-sm text-purple-200/75">
            {activeLabel}
          </p>
        </div>

        {/* Large Pill Switch from Screenshot */}
        <button
          type="button"
          onClick={toggleTheme}
          role="switch"
          aria-checked={isDark}
          aria-label={darkModeTitle}
          className="relative inline-flex h-14 w-28 shrink-0 cursor-pointer rounded-full bg-[#EAE8FE] p-1.5 shadow-lg transition-colors duration-300 ease-in-out focus:outline-none"
        >
          <span
            className={`pointer-events-none flex h-11 w-11 transform items-center justify-center rounded-full transition duration-300 ease-in-out shadow-md ${
              isDark
                ? 'translate-x-14 bg-[#4E369C] text-white shadow-purple-950/40'
                : 'translate-x-0 bg-[#F59E0B] text-white shadow-amber-950/30'
            }`}
          >
            {isDark ? (
              <Moon className="h-6 w-6 fill-white text-white" />
            ) : (
              <Sun className="h-6 w-6 fill-white text-white" />
            )}
          </span>
        </button>
      </div>
    );
  }

  // 4. MOBILE DRAWER VARIANT
  if (variant === 'mobile') {
    return (
      <div
        className={`flex items-center justify-between p-3 rounded-2xl neu-inset-sm bg-white/40 border border-black/5 dark:bg-[#120B2E] dark:border-white/10 ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-[#4E369C] text-white' : 'bg-amber-100 text-amber-600'
            }`}
          >
            {isDark ? (
              <Moon className="w-4 h-4 fill-white text-white" />
            ) : (
              <Sun className="w-4 h-4 text-[#F59E0B]" />
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-[#172B4D] dark:text-white">
              {darkModeTitle}
            </div>
            <div className="text-[10px] text-[#64748B] dark:text-purple-200/70">
              {activeLabel}
            </div>
          </div>
        </div>

        {/* Pill switch matching screenshot aesthetic */}
        <button
          type="button"
          onClick={toggleTheme}
          role="switch"
          aria-checked={isDark}
          aria-label={darkModeTitle}
          className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-300 ease-in-out ${
            isDark ? 'bg-[#EAE8FE]' : 'bg-[#CBD5E1]'
          }`}
        >
          <span
            className={`pointer-events-none flex h-6 w-6 transform items-center justify-center rounded-full shadow-md transition duration-300 ease-in-out ${
              isDark
                ? 'translate-x-6 bg-[#4E369C] text-white'
                : 'translate-x-0 bg-[#F59E0B] text-white'
            }`}
          >
            {isDark ? (
              <Moon className="h-3.5 w-3.5 fill-white text-white" />
            ) : (
              <Sun className="h-3.5 w-3.5 fill-white text-white" />
            )}
          </span>
        </button>
      </div>
    );
  }

  // 5. HEADER VARIANT (Matches top bar height and neumorphic styling)
  return (
    <div className={`flex items-center ${className}`}>
      <button
        type="button"
        onClick={toggleTheme}
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={`${darkModeTitle}: ${isDark ? darkLabel : lightLabel}`}
        className="neu-btn px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl flex items-center gap-2 text-xs font-semibold text-[#172B4D] dark:text-[#F1F5F9] hover:text-[#3478F6] dark:hover:text-[#637BFF] cursor-pointer shadow-xs bg-[#E9EEF3] dark:bg-[#1C2740] border border-black/5 dark:border-[#2A3752] min-h-[34px] sm:min-h-[36px] transition-all"
      >
        {/* Animated Moon / Sun Icon */}
        <span className="shrink-0 transition-transform duration-300">
          {isDark ? (
            <Moon className="w-4 h-4 text-[#818CF8] fill-[#818CF8]" />
          ) : (
            <Sun className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
          )}
        </span>

        {showLabels && (
          <span className="hidden sm:inline font-bold">
            {isDark ? darkLabel : lightLabel}
          </span>
        )}

        {/* Pill switch matching reference screenshot */}
        <div
          className={`relative inline-flex h-5 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 ${
            isDark ? 'bg-[#EAE8FE]' : 'bg-slate-300'
          }`}
        >
          <span
            className={`pointer-events-none flex h-4 w-4 transform items-center justify-center rounded-full shadow-sm transition duration-300 ease-in-out ${
              isDark
                ? 'translate-x-5 bg-[#4E369C] text-white'
                : 'translate-x-0 bg-[#F59E0B] text-white'
            }`}
          >
            {isDark ? (
              <Moon className="h-2.5 w-2.5 fill-white text-white" />
            ) : (
              <Sun className="h-2.5 w-2.5 fill-white text-white" />
            )}
          </span>
        </div>
      </button>
    </div>
  );
};
