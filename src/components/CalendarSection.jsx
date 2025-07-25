import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import CalendarModal from './CalendarModal';
import EventGrid from './EventGrid';

const { FiChevronDown, FiCalendar } = FiIcons;

const CalendarSection = ({ onDateSelect, events = [] }) => {
  const [selectedGenre, setSelectedGenre] = useState('All Genres');
  const [selectedDate, setSelectedDate] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedFormattedDate, setSelectedFormattedDate] = useState('Choose a date');
  const [availableDates, setAvailableDates] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);

  const dayNamesShort = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  // Sort events by date
  const sortEventsByDate = (events) => {
    return events.sort((a, b) => {
      const dateA = new Date(a.eventDate);
      const dateB = new Date(b.eventDate);
      return dateA - dateB;
    });
  };

  // Get the earliest future event date
  const getEarliestFutureEventDate = (events) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sortedEvents = sortEventsByDate(events);
    const futureEvents = sortedEvents.filter(event => {
      const eventDate = new Date(event.eventDate);
      return eventDate >= today;
    });
    return futureEvents.length > 0 ? new Date(futureEvents[0].eventDate) : today;
  };

  // Generate available dates starting from current date
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    const startDate = new Date(today);

    // Generate 60 days worth of dates
    for (let i = 0; i < 60; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      dates.push({
        date: currentDate,
        day: currentDate.getDate(),
        month: monthNames[currentDate.getMonth()],
        dayName: dayNamesShort[currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1],
        fullDate: currentDate.toISOString().split('T')[0],
        isToday: currentDate.toDateString() === today.toDateString()
      });
    }
    return dates;
  };

  // Filter events based on selected date and genre
  const filterEvents = (selectedDateStr, genre) => {
    let filtered = sortEventsByDate([...events]);

    // Filter by genre
    if (genre !== 'All Genres') {
      const genreMap = {
        'Concert': 'concert',
        'Party': 'party',
        'Bustour': 'bustour'
      };
      filtered = filtered.filter(event => event.category === genreMap[genre]);
    }

    // Filter by date - show events from selected date onwards
    if (selectedDateStr) {
      const selectedDate = new Date(selectedDateStr);
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.eventDate);
        return eventDate >= selectedDate;
      });
    }

    setFilteredEvents(filtered);
  };

  // Initialize dates on component mount
  useEffect(() => {
    const dates = generateAvailableDates();
    setAvailableDates(dates);

    // Set default selected date to earliest future event or today
    const earliestEventDate = getEarliestFutureEventDate(events);
    const defaultDate = dates.find(d => d.date.toDateString() === earliestEventDate.toDateString()) || dates[0];
    if (defaultDate) {
      setSelectedDate(defaultDate.fullDate);
      setSelectedFormattedDate(defaultDate.date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }));
    }
  }, [events]);

  // Filter events when date or genre changes
  useEffect(() => {
    filterEvents(selectedDate, selectedGenre);
  }, [selectedDate, selectedGenre, events]);

  // Update dates at midnight
  useEffect(() => {
    const updateDatesAtMidnight = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const timeUntilMidnight = tomorrow.getTime() - now.getTime();
      const timeoutId = setTimeout(() => {
        const newDates = generateAvailableDates();
        setAvailableDates(newDates);

        // Update selected date if it was today
        const newToday = newDates.find(d => d.isToday);
        if (newToday && selectedDate === newDates[0]?.fullDate) {
          setSelectedDate(newToday.fullDate);
          setSelectedFormattedDate(newToday.date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }));
        }

        // Set up next midnight update
        updateDatesAtMidnight();
      }, timeUntilMidnight);

      return timeoutId;
    };

    const timeoutId = updateDatesAtMidnight();
    return () => clearTimeout(timeoutId);
  }, [selectedDate]);

  // Group dates by month for display
  const groupDatesByMonth = () => {
    const grouped = {};
    availableDates.forEach(dateObj => {
      const monthKey = dateObj.month;
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(dateObj);
    });
    return grouped;
  };

  const handleDateSelect = (dateObj) => {
    setSelectedDate(dateObj.fullDate);
    setSelectedFormattedDate(dateObj.date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }));

    // Notify parent component about date selection
    if (onDateSelect) {
      onDateSelect(dateObj.date);
    }
  };

  const handleCalendarModalSelect = (date) => {
    const formattedDate = date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    setSelectedFormattedDate(formattedDate);
    setSelectedDate(date.toISOString().split('T')[0]);

    // Notify parent component about date selection
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const groupedDates = groupDatesByMonth();

  return (
    <div className="mb-12">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <button
          className="px-6 py-2 border border-gray-600 rounded-full text-sm hover:border-primary-400 transition-colors flex items-center"
          onClick={() => setIsCalendarOpen(true)}
        >
          <SafeIcon icon={FiCalendar} className="mr-2 text-gray-400" />
          {selectedFormattedDate}
        </button>

        <div className="relative">
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="appearance-none bg-black/20 border border-gray-600 rounded-full px-4 py-2 pr-8 text-sm focus:outline-none focus:border-primary-400"
          >
            <option>All Genres</option>
            <option>Concert</option>
            <option>Party</option>
            <option>Bustour</option>
          </select>
          <SafeIcon
            icon={FiChevronDown}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          />
        </div>
      </div>

      {/* Calendar Strip */}
      <div className="overflow-x-auto scrollbar-hide mb-6">
        <div className="flex space-x-8 pb-4">
          {Object.entries(groupedDates).map(([month, dates]) => (
            <div key={month} className="flex-shrink-0">
              <h3 className="text-base font-bold capitalize mb-3 sticky left-0 z-10">
                {month}
              </h3>
              <div className="flex space-x-2 pl-2">
                {dates.map((dateObj) => (
                  <motion.button
                    key={dateObj.fullDate}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDateSelect(dateObj)}
                    className={`flex flex-col items-center justify-center w-9 h-11 rounded-2xl transition-colors ${
                      selectedDate === dateObj.fullDate
                        ? 'bg-primary-400 text-black'
                        : 'hover:bg-zinc-700'
                    } ${dateObj.isToday ? 'ring-2 ring-primary-400/50' : ''}`}
                  >
                    <span className="text-lg font-medium leading-none">{dateObj.day}</span>
                    <span
                      className={`text-xs ${
                        selectedDate === dateObj.fullDate ? 'text-black/70' : 'text-gray-500'
                      }`}
                    >
                      {dateObj.dayName}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Event Grid */}
      <EventGrid events={filteredEvents} />

      {/* Calendar Modal */}
      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        onSelectDate={handleCalendarModalSelect}
      />
    </div>
  );
};

export default CalendarSection;