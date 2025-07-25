import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from './SafeIcon';

const { FiChevronDown } = FiIcons;

const LanguageSelector = ({ className = "" }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const languages = [
    { code: 'en', name: 'EN', flag: '🇺🇸' },
    { code: 'ru', name: 'RU', flag: '🇷🇺' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  // Check viewport boundaries and adjust dropdown position
  const getDropdownPosition = () => {
    if (!buttonRef.current) return {};
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const dropdownWidth = 100; // Approximate width of dropdown
    
    // If dropdown would go off right edge, position it to the left
    if (buttonRect.right + dropdownWidth > viewportWidth) {
      return { right: 0, left: 'auto' };
    }
    
    // Default position
    return { left: 0, right: 'auto' };
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button 
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-zinc-700/50 transition-colors"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="font-medium text-white">{currentLanguage.name}</span>
        <SafeIcon 
          icon={FiChevronDown} 
          className={`w-4 h-4 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div 
          className="absolute mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-50 min-w-[100px]"
          style={getDropdownPosition()}
        >
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-zinc-700 first:rounded-t-lg last:rounded-b-lg ${
                currentLanguage.code === language.code ? 'bg-zinc-700 text-primary-400' : 'text-white'
              }`}
            >
              <span className="text-lg">{language.flag}</span>
              <span className="font-medium">{language.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;