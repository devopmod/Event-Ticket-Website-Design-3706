import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import LanguageSelector from '../../common/LanguageSelector';

const { FiMenu, FiX } = FiIcons;

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-zinc-800/95 backdrop-blur-sm border-b border-zinc-700">
        <div className="flex items-center justify-between px-2 py-2">
          {/* Logo - Left corner with 8px margin */}
          <Link to="/" className="flex items-center ml-2">
            <div className="text-2xl font-bold text-primary-400">
              FANATICKA
            </div>
          </Link>

          {/* Burger Menu - Right corner */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 hover:bg-zinc-700/50 rounded-lg transition-colors"
          >
            <SafeIcon icon={FiMenu} className="w-6 h-6 text-white" />
          </button>
        </div>
      </nav>

      {/* Full Screen Modal Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50">
          {/* Sidebar Menu */}
          <div className="fixed top-0 right-0 h-full w-full max-w-[382px] bg-zinc-800 shadow-xl">
            {/* Header with Language Selector and Close Button */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <LanguageSelector />
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-zinc-700/50 rounded-lg transition-colors"
              >
                <SafeIcon icon={FiX} className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex flex-col p-4">
              <div className="space-y-2">
                <Link
                  to="/"
                  className="block px-4 py-3 text-white hover:bg-zinc-700/50 rounded-lg transition-colors text-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('nav.home')}
                </Link>
                <Link
                  to="/concerts"
                  className="block px-4 py-3 text-white hover:bg-zinc-700/50 rounded-lg transition-colors text-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('nav.concerts')}
                </Link>
                <Link
                  to="/admin/login"
                  className="block px-4 py-3 text-white hover:bg-zinc-700/50 rounded-lg transition-colors text-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('nav.admin')}
                </Link>
              </div>
            </div>
          </div>

          {/* Overlay - clicking outside closes menu */}
          <div 
            className="absolute inset-0 -z-10"
            onClick={() => setIsMenuOpen(false)}
          ></div>
        </div>
      )}
    </>
  );
};

export default NavBar;