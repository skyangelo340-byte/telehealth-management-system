import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, AppLanguage } from '../../context/LanguageContext';
import { Check, ChevronDown } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'sidebar' | 'mobile' | 'floating' | 'header' | 'inline';
  collapsed?: boolean;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'sidebar',
  collapsed = false,
  className = '',
}) => {
  const { language, setLanguage } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [dropdownOpen]);

  const handleSelectLanguage = (lang: AppLanguage) => {
    setLanguage(lang);
    setDropdownOpen(false);
  };

  // 1. COLLAPSED SIDEBAR VARIANT (Icon remains accessible)
  if (variant === 'sidebar' && collapsed) {
    return (
      <div className={`relative ${className}`} ref={containerRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          title={`Language / Wika: ${language === 'en' ? 'English' : 'Filipino / Tagalog'}`}
          aria-label="Language / Wika"
          aria-expanded={dropdownOpen}
          className="w-full neu-btn px-2 py-2.5 rounded-xl flex items-center justify-center text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FF] hover:text-[#3478F6] transition-colors cursor-pointer"
        >
          <span className="text-lg select-none leading-none" role="img" aria-label="Language">
            🌐
          </span>
        </button>

        {dropdownOpen && (
          <div className="absolute left-full bottom-0 ml-3 w-56 neu-raised-lg rounded-2xl p-2.5 z-50 bg-[#E9EEF3] dark:bg-[#152243] border border-black/5 dark:border-white/10 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2.5 py-1.5 border-b border-black/5 dark:border-white/10 mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#172B4D] dark:text-[#F0F5FF]">
              <span className="text-base select-none">🌐</span>
              <span>Language / Wika</span>
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleSelectLanguage('en')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  language === 'en'
                    ? 'neu-btn-primary text-white shadow-xs'
                    : 'text-[#172B4D] dark:text-[#F0F5FF] hover:bg-white/60 dark:hover:bg-white/10 neu-btn'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm">🇺🇸</span>
                  <span>English</span>
                </span>
                {language === 'en' && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => handleSelectLanguage('tl')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  language === 'tl'
                    ? 'neu-btn-primary text-white shadow-xs'
                    : 'text-[#172B4D] dark:text-[#F0F5FF] hover:bg-white/60 dark:hover:bg-white/10 neu-btn'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm">🇵🇭</span>
                  <span>Filipino / Tagalog</span>
                </span>
                {language === 'tl' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. EXPANDED SIDEBAR VARIANT
  if (variant === 'sidebar') {
    return (
      <div className={`p-2.5 rounded-2xl neu-inset-sm bg-white/30 dark:bg-white/5 border border-black/5 dark:border-white/10 ${className}`} ref={containerRef}>
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748B] dark:text-[#A5B4D0] uppercase tracking-wider">
            <span className="text-base select-none leading-none">🌐</span>
            <span>Language / Wika</span>
          </div>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[#172B4D] dark:text-[#F0F5FF]">
            {language === 'en' ? 'EN' : 'TL'}
          </span>
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => handleSelectLanguage('en')}
            className={`w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              language === 'en'
                ? 'neu-btn-primary text-white shadow-xs'
                : 'text-[#172B4D] dark:text-[#F0F5FF] hover:bg-white/50 dark:hover:bg-white/10 neu-btn'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-sm">🇺🇸</span>
              <span>English</span>
            </span>
            {language === 'en' && <Check className="w-3.5 h-3.5 text-white" />}
          </button>

          <button
            type="button"
            onClick={() => handleSelectLanguage('tl')}
            className={`w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              language === 'tl'
                ? 'neu-btn-primary text-white shadow-xs'
                : 'text-[#172B4D] dark:text-[#F0F5FF] hover:bg-white/50 dark:hover:bg-white/10 neu-btn'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-sm">🇵🇭</span>
              <span>Filipino / Tagalog</span>
            </span>
            {language === 'tl' && <Check className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>
      </div>
    );
  }

  // 3. MOBILE MENU VARIANT (Full width buttons in mobile drawer)
  if (variant === 'mobile') {
    return (
      <div className={`p-3 rounded-2xl neu-inset-sm bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-2.5 ${className}`}>
        <div className="flex items-center justify-between text-xs font-bold text-[#172B4D] dark:text-[#F0F5FF]">
          <div className="flex items-center gap-1.5">
            <span className="text-base select-none">🌐</span>
            <span>Language / Wika</span>
          </div>
          <span className="text-[10px] font-mono text-[#64748B] dark:text-[#A5B4D0]">
            {language === 'en' ? 'English (US)' : 'Filipino (PH)'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleSelectLanguage('en')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              language === 'en'
                ? 'neu-btn-primary text-white shadow-sm'
                : 'neu-btn text-[#172B4D] dark:text-[#F0F5FF]'
            }`}
          >
            <span className="text-sm">🇺🇸</span>
            <span>English</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectLanguage('tl')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              language === 'tl'
                ? 'neu-btn-primary text-white shadow-sm'
                : 'neu-btn text-[#172B4D] dark:text-[#F0F5FF]'
            }`}
          >
            <span className="text-sm">🇵🇭</span>
            <span>Filipino / Tagalog</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. HEADER VARIANT (Placed next to Sign In in top header, opens downwards)
  if (variant === 'header') {
    return (
      <div className={`relative ${className}`} ref={containerRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-label="Language / Wika"
          aria-expanded={dropdownOpen}
          className="neu-btn px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FF] hover:text-[#3478F6] cursor-pointer shadow-xs bg-[#E9EEF3] dark:bg-[#142040] border border-black/5 dark:border-white/10 min-h-[34px] sm:min-h-[36px]"
        >
          <span className="text-base select-none leading-none">🌐</span>
          <span className="hidden sm:inline font-bold">Language / Wika</span>
          <span className="text-xs font-medium">{language === 'en' ? '🇺🇸' : '🇵🇭'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 neu-raised-lg rounded-2xl p-2.5 z-50 bg-[#E9EEF3] dark:bg-[#152243] border border-black/10 dark:border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-2.5 py-1.5 border-b border-black/5 dark:border-white/10 mb-1.5 flex items-center justify-between text-xs font-bold text-[#172B4D] dark:text-[#F0F5FF]">
              <span className="flex items-center gap-1.5">
                <span>🌐</span>
                <span>Language / Wika</span>
              </span>
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleSelectLanguage('en')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  language === 'en'
                    ? 'neu-btn-primary text-white shadow-xs'
                    : 'neu-btn text-[#172B4D] dark:text-[#F0F5FF] hover:bg-white/60 dark:hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm">🇺🇸</span>
                  <span>English</span>
                </span>
                {language === 'en' && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => handleSelectLanguage('tl')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  language === 'tl'
                    ? 'neu-btn-primary text-white shadow-xs'
                    : 'neu-btn text-[#172B4D] dark:text-[#F0F5FF] hover:bg-white/60 dark:hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm">🇵🇭</span>
                  <span>Filipino / Tagalog</span>
                </span>
                {language === 'tl' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 5. FLOATING CORNER / BOTTOM-LEFT CORNER VARIANT (Easy to find on desktop, tablet, and mobile)
  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-label="Language / Wika"
        aria-expanded={dropdownOpen}
        className="neu-btn px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FF] hover:text-[#3478F6] cursor-pointer shadow-md bg-[#E9EEF3]/95 dark:bg-[#142040]/95 backdrop-blur-xs border border-black/10 dark:border-white/10"
      >
        <span className="text-base select-none leading-none">🌐</span>
        <span className="font-bold">Language / Wika</span>
        <span className="text-xs">{language === 'en' ? '🇺🇸' : '🇵🇭'}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {dropdownOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-56 neu-raised-lg rounded-2xl p-2.5 z-50 bg-[#E9EEF3] dark:bg-[#152243] border border-black/10 dark:border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-2.5 py-1.5 border-b border-black/5 dark:border-white/10 mb-1.5 flex items-center justify-between text-xs font-bold text-[#172B4D] dark:text-[#F0F5FF]">
            <span className="flex items-center gap-1.5">
              <span>🌐</span>
              <span>Language / Wika</span>
            </span>
          </div>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleSelectLanguage('en')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                language === 'en'
                  ? 'neu-btn-primary text-white shadow-xs'
                  : 'neu-btn text-[#172B4D] dark:text-[#F0F5FF] hover:bg-white/60 dark:hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-sm">🇺🇸</span>
                <span>English</span>
              </span>
              {language === 'en' && <Check className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => handleSelectLanguage('tl')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                language === 'tl'
                  ? 'neu-btn-primary text-white shadow-xs'
                  : 'neu-btn text-[#172B4D] dark:text-[#F0F5FF] hover:bg-white/60 dark:hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-sm">🇵🇭</span>
                <span>Filipino / Tagalog</span>
              </span>
              {language === 'tl' && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
