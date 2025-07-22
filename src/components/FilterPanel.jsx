import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiChevronDown, FiChevronUp, FiFilter, FiX } = FiIcons;

const FilterPanel = ({
  filters,
  onFiltersChange,
  categories = ['All', 'Concert', 'Party', 'Bustour'],
  cities = ['All', 'Warsaw', 'Berlin', 'Prague', 'Vienna', 'Budapest'],
  artists = ['All', 'Max Korzh', 'Various Artists'],
  genres = ['All', 'Hip-Hop', 'Electronic', 'Rock', 'Pop', 'Transport'],
  priceRange = [0, 200]
}) => {
  const { t } = useTranslation();
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    artist: true,
    genre: true,
    date: true,
    city: true,
    price: true
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Close modal when clicking outside
  const modalRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsModalOpen(false);
      }
    };
    
    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalOpen]);
  
  // Disable scrolling on body when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isModalOpen]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCategoryChange = (category) => {
    onFiltersChange({ ...filters, category: category });
  };

  const handleArtistChange = (artist) => {
    onFiltersChange({ ...filters, artist: artist });
  };

  const handleGenreChange = (genre) => {
    onFiltersChange({ ...filters, genre: genre });
  };

  const handleCityChange = (city) => {
    onFiltersChange({ ...filters, city: city });
  };

  const handlePriceChange = (e) => {
    onFiltersChange({ ...filters, priceFrom: parseInt(e.target.value) });
  };

  const handleDateChange = (dateType, value) => {
    onFiltersChange({ ...filters, [dateType]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      category: 'All',
      artist: 'All',
      genre: 'All',
      city: 'All',
      priceFrom: 0,
      dateFrom: '',
      dateTo: ''
    });
  };

  // Filter panel content - reused in both desktop and modal views
  const filterContent = (
    <>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">{t('concerts.filters')}</h3>
        <button
          onClick={clearAllFilters}
          className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
        >
          {t('concerts.clear')}
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('category')}
          className="flex items-center justify-between w-full mb-3 text-white font-medium"
        >
          <span>{t('concerts.category')}</span>
          <SafeIcon
            icon={expandedSections.category ? FiChevronUp : FiChevronDown}
            className="w-4 h-4"
          />
        </button>
        {expandedSections.category && (
          <div className="space-y-2">
            {categories.map((category) => (
              <label key={category} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={category}
                  checked={filters.category === category}
                  onChange={() => handleCategoryChange(category)}
                  className="w-4 h-4 text-primary-400 bg-transparent border-gray-500 focus:ring-primary-400"
                />
                <span className="ml-3 text-gray-300">{category}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Artist Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('artist')}
          className="flex items-center justify-between w-full mb-3 text-white font-medium"
        >
          <span>{t('concerts.artist')}</span>
          <SafeIcon
            icon={expandedSections.artist ? FiChevronUp : FiChevronDown}
            className="w-4 h-4"
          />
        </button>
        {expandedSections.artist && (
          <div className="space-y-2">
            {artists.map((artist) => (
              <label key={artist} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="artist"
                  value={artist}
                  checked={filters.artist === artist}
                  onChange={() => handleArtistChange(artist)}
                  className="w-4 h-4 text-primary-400 bg-transparent border-gray-500 focus:ring-primary-400"
                />
                <span className="ml-3 text-gray-300">{artist}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Genre Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('genre')}
          className="flex items-center justify-between w-full mb-3 text-white font-medium"
        >
          <span>{t('concerts.genre')}</span>
          <SafeIcon
            icon={expandedSections.genre ? FiChevronUp : FiChevronDown}
            className="w-4 h-4"
          />
        </button>
        {expandedSections.genre && (
          <div className="space-y-2">
            {genres.map((genre) => (
              <label key={genre} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="genre"
                  value={genre}
                  checked={filters.genre === genre}
                  onChange={() => handleGenreChange(genre)}
                  className="w-4 h-4 text-primary-400 bg-transparent border-gray-500 focus:ring-primary-400"
                />
                <span className="ml-3 text-gray-300">{genre}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Date Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('date')}
          className="flex items-center justify-between w-full mb-3 text-white font-medium"
        >
          <span>{t('concerts.dateRange')}</span>
          <SafeIcon
            icon={expandedSections.date ? FiChevronUp : FiChevronDown}
            className="w-4 h-4"
          />
        </button>
        {expandedSections.date && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('concerts.from')}</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleDateChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('concerts.to')}</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleDateChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-primary-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* City Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('city')}
          className="flex items-center justify-between w-full mb-3 text-white font-medium"
        >
          <span>{t('concerts.city')}</span>
          <SafeIcon
            icon={expandedSections.city ? FiChevronUp : FiChevronDown}
            className="w-4 h-4"
          />
        </button>
        {expandedSections.city && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {cities.map((city) => (
              <label key={city} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.city === city || (filters.city === 'All' && city === 'All')}
                  onChange={() => handleCityChange(city)}
                  className="w-4 h-4 text-primary-400 bg-transparent border-gray-500 focus:ring-primary-400"
                />
                <span className="ml-3 text-gray-300">{city}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full mb-3 text-white font-medium"
        >
          <span>{t('concerts.priceFrom')}</span>
          <SafeIcon
            icon={expandedSections.price ? FiChevronUp : FiChevronDown}
            className="w-4 h-4"
          />
        </button>
        {expandedSections.price && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>€0</span>
              <span className="text-primary-400">€{filters.priceFrom || 0}</span>
              <span>€{priceRange[1]}</span>
            </div>
            <input
              type="range"
              min={priceRange[0]}
              max={priceRange[1]}
              value={filters.priceFrom || 0}
              onChange={handlePriceChange}
              className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile/Tablet Filter Button */}
      <div className="md:hidden mb-4">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-zinc-800 rounded-lg text-white"
        >
          <SafeIcon icon={FiFilter} className="w-5 h-5" />
          <span>{t('concerts.filters')}</span>
        </button>
      </div>
      
      {/* Desktop Filter Panel (hidden on mobile/tablet) */}
      <div className="hidden md:block w-80 bg-zinc-800/50 backdrop-blur-sm rounded-lg p-6 h-fit sticky top-28">
        {filterContent}
      </div>
      
      {/* Modal Filter Panel (shown on mobile/tablet) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex md:hidden">
          <div 
            ref={modalRef}
            className="fixed top-0 right-0 h-full w-full max-w-[382px] bg-zinc-800 shadow-xl overflow-y-auto"
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <h3 className="text-lg font-semibold text-white">{t('concerts.filters')}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-zinc-700/50 rounded-lg transition-colors"
              >
                <SafeIcon icon={FiX} className="w-6 h-6 text-white" />
              </button>
            </div>
            
            {/* Filter content */}
            <div className="p-6">
              {filterContent}
              
              {/* Apply button at the bottom */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full py-3 bg-primary-400 hover:bg-primary-500 text-black font-medium rounded-lg transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FilterPanel;