import React from 'react';
import LanguageSelector from './common/LanguageSelector';

const Footer = () => {
  return (
    <footer className="bg-zinc-900 py-8 mt-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="text-2xl font-bold text-primary-400 mb-2">
              FANATICKA
            </div>
            <p className="text-gray-500 text-sm">
              © 2019-2025 Fanaticka
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <LanguageSelector />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;