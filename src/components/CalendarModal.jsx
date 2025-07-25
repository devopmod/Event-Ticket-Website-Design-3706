import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiChevronLeft, FiChevronRight, FiChevronDown } = FiIcons;

const CalendarModal = ({ isOpen, onClose, onSelectDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);

  // Get days in month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month
  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  // Get month name
  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  };

  // Handle previous month
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // Handle next month
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Handle date selection
  const handleDateSelect = (day) => {
    const selected = new Date(currentYear, currentMonth, day);
    setSelectedDate(selected);
    if (onSelectDate) {
      onSelectDate(selected);
    }
    onClose();
  };

  // Create calendar grid
  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    
    // Adjust for Sunday as first day (0) to Monday as first day (0)
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    const days = [];
    
    // Empty cells for days before first day of month
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-9 h-9 m-1"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <button
          key={`day-${day}`}
          onClick={() => handleDateSelect(day)}
          className={`w-9 h-9 m-1 flex items-center justify-center text-xs rounded-full hover:bg-primary-400 hover:text-black transition-colors
            ${selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth && selectedDate.getFullYear() === currentYear
              ? 'bg-primary-400 text-black font-medium'
              : ''
            }
          `}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  // Close when clicking Escape key
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="bg-zinc-800 rounded-lg overflow-hidden shadow-xl max-h-[358px] w-[320px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-700">
              <div className="flex items-center cursor-pointer font-medium">
                <span className="mr-2">{getMonthName(currentMonth)} {currentYear}</span>
                <SafeIcon icon={FiChevronDown} className="text-gray-400" />
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 rounded-full hover:bg-zinc-700 transition-colors"
                >
                  <SafeIcon icon={FiChevronLeft} className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 rounded-full hover:bg-zinc-700 transition-colors"
                >
                  <SafeIcon icon={FiChevronRight} className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 text-center py-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                <div key={index} className="text-xs text-gray-400 font-medium">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="p-2">
              <div className="grid grid-cols-7 gap-0">
                {renderCalendarGrid()}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CalendarModal;