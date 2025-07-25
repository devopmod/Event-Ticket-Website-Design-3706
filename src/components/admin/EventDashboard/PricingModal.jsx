import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiDollarSign, FiSave, FiX, FiAlertCircle } = FiIcons;

const PricingModal = ({ event, onSave, onCancel, saving = false }) => {
  const [priceBook, setPriceBook] = useState({});
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    // Initialize with current prices
    setPriceBook({ ...event.price_book });
  }, [event]);

  const venue = event.venue;
  const categories = venue ? (venue.canvas_data?.categories || {}) : { GENERAL: { name: 'General Admission', color: '#3B82F6' } };

  const handlePriceChange = (categoryId, value) => {
    const price = parseFloat(value) || 0;
    setPriceBook(prev => ({
      ...prev,
      [categoryId]: price
    }));
    
    // Clear error for this field
    if (errors[categoryId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[categoryId];
        return newErrors;
      });
    }
    setServerError('');
  };

  const handleKeyDown = (e, categoryId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const categoryEntries = Object.entries(categories);
      const currentIndex = categoryEntries.findIndex(([id]) => id === categoryId);
      const nextIndex = currentIndex + 1;
      
      if (nextIndex < categoryEntries.length) {
        const nextCategoryId = categoryEntries[nextIndex][0];
        const nextInput = document.querySelector(`input[data-category="${nextCategoryId}"]`);
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      } else {
        // Last field - trigger save
        handleSave();
      }
    }
  };

  const validatePrices = () => {
    const newErrors = {};
    
    Object.keys(categories).forEach(categoryId => {
      const price = priceBook[categoryId];
      if (!price || price <= 0) {
        newErrors[categoryId] = `Price must be greater than 0`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validatePrices()) {
      return;
    }

    try {
      setServerError('');
      await onSave(priceBook);
    } catch (error) {
      console.error('Error saving prices:', error);
      
      if (error.status === 422 && error.details) {
        setServerError(error.details.join(', '));
      } else {
        setServerError(error.message || 'Failed to update prices. Please try again.');
      }
    }
  };

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
          if (categories[categoryId]) {
            newPriceBook[categoryId] = parseFloat(price);
            hasValidData = true;
          }
        }
      });

      if (hasValidData) {
        setPriceBook(newPriceBook);
        setErrors({});
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Edit Prices</h2>
            <p className="text-gray-400 text-sm mt-1">{event.title}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <SafeIcon icon={FiX} className="w-5 h-5" />
          </button>
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="mx-6 mt-4 bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center">
            <SafeIcon icon={FiAlertCircle} className="w-5 h-5 mr-2 flex-shrink-0" />
            <div>
              <strong>Error:</strong> {serverError}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {Object.entries(categories).map(([categoryId, category]) => {
              const currentPrice = priceBook[categoryId] || '';
              const hasError = errors[categoryId];
              
              return (
                <div
                  key={categoryId}
                  className={`p-4 bg-zinc-700/50 rounded-lg border-2 transition-all ${
                    hasError ? 'border-red-500/50' : 'border-transparent'
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
                        onKeyDown={(e) => handleKeyDown(e, categoryId)}
                        onPaste={handleBulkPaste}
                        min="0"
                        step="0.01"
                        className={`w-28 px-3 py-2 bg-zinc-700 border rounded-lg text-white text-right focus:outline-none focus:border-primary-400 ${
                          hasError ? 'border-red-500' : 'border-zinc-600'
                        }`}
                        placeholder="0.00"
                        data-category={categoryId}
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  
                  {hasError && (
                    <p className="text-red-400 text-sm mt-2">{errors[categoryId]}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tips */}
          <div className="mt-6 bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-200 mb-1">💡 Tips</h4>
            <div className="text-xs text-blue-200/80 space-y-1">
              <div>• Press Enter to move to next field and save on last field</div>
              <div>• Bulk paste format: CATEGORY,PRICE (one per line)</div>
              <div>• All prices must be greater than 0</div>
              <div>• Changes are applied immediately to all clients</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-zinc-700">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 border border-zinc-600 hover:border-zinc-500 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              saving
                ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-primary-400 hover:bg-primary-500 text-black'
            }`}
          >
            <SafeIcon icon={saving ? FiX : FiSave} className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Prices'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PricingModal;