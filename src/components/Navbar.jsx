import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiMenu, FiUser, FiX } = FiIcons;

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-zinc-800/95 backdrop-blur-sm border-b border-zinc-700"
    >
      <div className="max-w-4xl mx-auto px-2 py-2">
        <div className="flex items-center justify-between">
          {/* Menu Button */}
          <div className="flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-zinc-700/50 rounded-lg transition-colors"
            >
              <SafeIcon icon={isMenuOpen ? FiX : FiMenu} className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <motion.div
              className="text-2xl font-bold text-primary-400"
            >
              FANATICKA
            </motion.div>
          </Link>

          {/* User Icon */}
          <div className="flex items-center">
            <button className="p-2 hover:bg-zinc-700/50 rounded-lg transition-colors">
              <SafeIcon icon={FiUser} className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 py-4 border-t border-zinc-700"
          >
            <div className="flex flex-col space-y-3">
              <Link
                to="/"
                className="px-4 py-2 text-white hover:bg-zinc-700/50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/bustours"
                className="px-4 py-2 text-white hover:bg-zinc-700/50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Bus Tours
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;