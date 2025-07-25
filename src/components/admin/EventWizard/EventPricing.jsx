import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiDollarSign, FiAlertCircle } = FiIcons;

const EventPricing = ({ venue, priceBook, onChange, errors = {} }) => {
  const handlePriceChange = (categoryId, price) => {
    const numericPrice = parseFloat(price) || 0;
    const newPriceBook = { ...priceBook, [categoryId]: numericPrice };
    onChange(newPriceBook);
  };

  // Handle Enter key to move to next input
  const handleKeyDown = (e, categoryId, categoryEntries) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentIndex = categoryEntries.findIndex(([id]) => id === categoryId);
      const nextIndex = currentIndex + 1;
      if (nextIndex < categoryEntries.length) {
        const nextCategoryId = categoryEntries[nextIndex][0];
        const nextInput = document.querySelector(`input[data-category="${nextCategoryId}"]`);
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }
    }
  };

  // Handle bulk paste (Ctrl+V) - format: "CATEGORY,PRICE\nCATEGORY,PRICE"
  const handleBulkPaste = (e) => {
    const pasteData = e.clipboardData.getData('text');
    const lines = pasteData.split('\n').filter(line => line.trim());
    
    if (lines.length > 1) {
      e.preventDefault();
      const newPriceBook = { ...priceBook };
      let hasValidData = false;
      
      lines.forEach(line => {
        const [category, price] = line.split(',').map(s => s.trim());
        if (category && price && !isNaN(parseFloat(price))) {
          const categoryId = category.toUpperCase();
          // Only update if category exists in venue
          if (venue && venue.canvas_data?.categories?.[categoryId]) {
            newPriceBook[categoryId] = parseFloat(price);
            hasValidData = true;
          }
        }
      });
      
      if (hasValidData) {
        onChange(newPriceBook);
      }
    }
  };

  // If no venue selected, show general admission pricing
  if (!venue) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Event Pricing</h3>
          <p className="text-gray-400 mb-6">
            Set pricing for your general admission event.
          </p>
        </div>
        
        <div className="bg-zinc-700/50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <SafeIcon icon={FiDollarSign} className="w-5 h-5 text-primary-400 mr-2" />
            <h4 className="text-lg font-medium text-white">General Admission</h4>
          </div>
          
          <div className="max-w-sm">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Ticket Price (€) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">€</span>
              <input
                type="number"
                value={priceBook.GENERAL || ''}
                onChange={(e) => handlePriceChange('GENERAL', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'GENERAL', [['GENERAL']])}
                onPaste={handleBulkPaste}
                min="0"
                step="0.01"
                className={`w-full pl-8 pr-4 py-3 bg-zinc-700 border rounded-lg text-white focus:outline-none focus:border-primary-400 ${
                  errors.price_GENERAL ? 'border-red-500' : 'border-zinc-600'
                }`}
                placeholder="45.00"
                data-category="GENERAL"
              />
            </div>
            {errors.price_GENERAL && (
              <p className="text-red-400 text-sm mt-1">{errors.price_GENERAL}</p>
            )}
          </div>
        </div>

        {/* UX Tips */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-200 mb-1">💡 Tips</h4>
          <div className="text-xs text-blue-200/80 space-y-1">
            <div>• Press Enter to confirm price</div>
            <div>• Use format: 45.50 (no currency symbol needed)</div>
          </div>
        </div>
      </div>
    );
  }

  // Get venue categories
  const categories = venue.canvas_data?.categories || {};
  const categoryEntries = Object.entries(categories);

  if (categoryEntries.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Event Pricing</h3>
          <p className="text-gray-400 mb-6">
            Set prices for each category in your venue.
          </p>
        </div>
        
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center">
            <SafeIcon icon={FiAlertCircle} className="w-5 h-5 text-yellow-400 mr-2" />
            <div>
              <h4 className="text-yellow-200 font-medium">No Categories Found</h4>
              <p className="text-yellow-200/80 text-sm mt-1">
                The selected venue doesn't have any seat categories configured. Please edit the venue in Venue Designer first.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasErrors = categoryEntries.some(([categoryId]) => errors[`price_${categoryId}`]);
  const allPricesSet = categoryEntries.every(([categoryId]) => 
    priceBook[categoryId] && priceBook[categoryId] > 0
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Event Pricing</h3>
        <p className="text-gray-400 mb-6">
          Set prices for each category in <strong>{venue.name}</strong>. All prices are required.
        </p>
      </div>

      {hasErrors && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center">
            <SafeIcon icon={FiAlertCircle} className="w-5 h-5 text-red-400 mr-2" />
            <div>
              <h4 className="text-red-200 font-medium">Missing Prices</h4>
              <p className="text-red-200/80 text-sm mt-1">
                Please set a price for all categories before continuing.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {categoryEntries.map(([categoryId, category], index) => {
          const currentPrice = priceBook[categoryId] || '';
          const hasError = errors[`price_${categoryId}`];
          const isEmpty = !currentPrice || currentPrice <= 0;
          
          return (
            <motion.div
              key={categoryId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-zinc-700/50 rounded-lg p-4 border-2 transition-all ${
                hasError 
                  ? 'border-red-500/50' 
                  : isEmpty 
                    ? 'border-yellow-500/30' 
                    : 'border-green-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <div
                    className="w-6 h-6 rounded-full mr-3 border-2 border-white/20"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{categoryId}</h4>
                    <p className="text-gray-400 text-sm">{category.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">€</span>
                  <input
                    type="number"
                    value={currentPrice}
                    onChange={(e) => handlePriceChange(categoryId, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, categoryId, categoryEntries)}
                    onPaste={handleBulkPaste}
                    min="0"
                    step="0.01"
                    className={`w-28 px-3 py-2 bg-zinc-700 border rounded-lg text-white text-right focus:outline-none focus:border-primary-400 ${
                      hasError 
                        ? 'border-red-500' 
                        : isEmpty 
                          ? 'border-yellow-500' 
                          : 'border-green-500'
                    }`}
                    placeholder="0.00"
                    data-category={categoryId}
                    autoComplete="off"
                  />
                </div>
              </div>
              
              {hasError && (
                <p className="text-red-400 text-sm mt-2">{errors[`price_${categoryId}`]}</p>
              )}
              
              {isEmpty && !hasError && (
                <p className="text-yellow-400 text-sm mt-2">Price required</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Price Summary */}
      <div className="bg-zinc-700/30 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3">Price Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {categoryEntries.map(([categoryId, category]) => {
            const price = priceBook[categoryId];
            return (
              <div key={categoryId} className="flex justify-between">
                <span className="text-gray-400">{categoryId}:</span>
                <span className={`font-medium ${price && price > 0 ? 'text-white' : 'text-gray-500'}`}>
                  €{price && price > 0 ? price.toFixed(2) : '0.00'}
                </span>
              </div>
            );
          })}
        </div>
        
        {allPricesSet && categoryEntries.length > 0 && (
          <div className="flex justify-between pt-3 mt-3 border-t border-zinc-600">
            <span className="text-gray-400">Price Range:</span>
            <span className="text-primary-400 font-medium">
              €{Math.min(...Object.values(priceBook).filter(p => p > 0)).toFixed(2)} - 
              €{Math.max(...Object.values(priceBook).filter(p => p > 0)).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* UX Tips */}
      <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
        <h4 className="text-sm font-medium text-blue-200 mb-1">💡 Tips</h4>
        <div className="text-xs text-blue-200/80 space-y-1">
          <div>• Press Enter to move to next price field</div>
          <div>• Bulk paste format: PAR_L,460 (one per line)</div>
          <div>• All categories must have prices &gt;0</div>
          <div>• Currency: Euro (€) - set in global settings</div>
        </div>
      </div>
    </div>
  );
};

export default EventPricing;