// Новый сервис для верификации мест
import supabase from '../lib/supabase';

const EVENT_SEATS_TABLE = 'event_seats_fanaticka_7a3x9d';
const EVENTS_TABLE = 'events_fanaticka_7a3x9d';

// Получение количества мест из venue layout
export const getVenueLayoutSeatsCount = (venueData) => {
  try {
    console.log('📊 Analyzing venue layout seats...');
    const canvasData = typeof venueData.canvas_data === 'string' 
      ? JSON.parse(venueData.canvas_data) 
      : venueData.canvas_data;
      
    if (!canvasData?.elements) {
      console.warn('⚠️ No elements found in venue layout');
      return { 
        total: 0, 
        byCategory: {}, 
        byType: { seat: 0, section: 0, polygon: 0 } 
      };
    }
    
    const counts = {
      total: 0,
      byCategory: {},
      byType: { seat: 0, section: 0, polygon: 0 }
    };
    
    // Анализируем каждый элемент
    canvasData.elements.forEach(element => {
      if (!['seat', 'section', 'polygon'].includes(element.type)) return;
      
      // Подсчет по типу элемента
      counts.byType[element.type]++;
      
      // Определяем capacity элемента
      let elementCapacity = 1;
      if ((element.type === 'section' || element.type === 'polygon') && element.capacity) {
        elementCapacity = element.capacity;
      }
      
      // Учитываем только bookable элементы
      if (element.is_bookable !== false) {
        counts.total += elementCapacity;
        
        // Подсчет по категориям
        const categoryId = element.categoryId || 'UNCATEGORIZED';
        counts.byCategory[categoryId] = (counts.byCategory[categoryId] || 0) + elementCapacity;
      }
    });
    
    console.log('📊 Venue layout analysis complete:', counts);
    return counts;
  } catch (error) {
    console.error('❌ Error analyzing venue layout:', error);
    throw error;
  }
};

// Получение количества мест из базы данных
export const getVenueDBSeatsCount = async (venueId) => {
  try {
    console.log('🔍 Fetching venue seats from database for venue:', venueId);
    
    // Получаем все события для venue
    const { data: events, error: eventsError } = await supabase
      .from(EVENTS_TABLE)
      .select('id')
      .eq('venue_id', venueId);
      
    if (eventsError) {
      throw eventsError;
    }
    
    if (!events || events.length === 0) {
      console.log('ℹ️ No events found for venue');
      return { total: 0, byEvent: {}, averageSeats: 0 };
    }
    
    const counts = { total: 0, byEvent: {}, averageSeats: 0 };
    
    // Получаем места для каждого события
    for (const event of events) {
      const { data: seats, error: seatsError } = await supabase
        .from(EVENT_SEATS_TABLE)
        .select('total_capacity,is_bookable,element_type,status')
        .eq('event_id', event.id);
        
      if (seatsError) {
        console.error(`Error fetching seats for event ${event.id}:`, seatsError);
        continue;
      }
      
      // Подсчитываем места для события
      const eventSeats = seats.reduce((sum, seat) => {
        if (seat.is_bookable !== false) {
          return sum + (seat.total_capacity || 1);
        }
        return sum;
      }, 0);
      
      counts.byEvent[event.id] = {
        totalSeats: eventSeats,
        breakdown: {
          free: seats.filter(s => s.status === 'free').length,
          held: seats.filter(s => s.status === 'held').length,
          sold: seats.filter(s => s.status === 'sold').length
        }
      };
      
      counts.total += eventSeats;
    }
    
    // Вычисляем среднее количество мест
    counts.averageSeats = Math.round(counts.total / events.length);
    
    console.log('📊 Database seats count analysis complete:', counts);
    return counts;
  } catch (error) {
    console.error('❌ Error fetching venue seats from database:', error);
    throw error;
  }
};

// Сравнение количества мест
export const compareVenueSeatCounts = async (venueId, venueData) => {
  try {
    console.log('🔄 Starting venue seats comparison...');
    
    // Получаем количество мест из layout и БД
    const layoutCounts = getVenueLayoutSeatsCount(venueData);
    const dbCounts = await getVenueDBSeatsCount(venueId);
    
    // Анализируем расхождения
    const discrepancies = {
      hasDiscrepancies: false,
      details: {
        totalDifference: layoutCounts.total - dbCounts.averageSeats,
        byEvent: {}
      },
      severity: 'none',
      recommendations: []
    };
    
    // Если в БД нет мест, но в layout они есть
    if (dbCounts.total === 0 && layoutCounts.total > 0) {
      discrepancies.hasDiscrepancies = true;
      discrepancies.severity = 'medium';
      discrepancies.recommendations.push(
        'No seats are generated in the database. Use "Generate Seats" to create initial seat records.'
      );
      
      // В этом случае мы не показываем это как проблему, так как это нормальное состояние
      // для нового venue
      discrepancies.hasDiscrepancies = false;
    } else {
      // Проверяем каждое событие
      Object.entries(dbCounts.byEvent).forEach(([eventId, eventCount]) => {
        const difference = layoutCounts.total - eventCount.totalSeats;
        if (difference !== 0) {
          discrepancies.hasDiscrepancies = true;
          discrepancies.details.byEvent[eventId] = {
            difference,
            expected: layoutCounts.total,
            actual: eventCount.totalSeats,
            breakdown: eventCount.breakdown
          };
        }
      });
      
      // Определяем серьезность проблемы
      if (discrepancies.hasDiscrepancies) {
        if (Math.abs(discrepancies.details.totalDifference) > layoutCounts.total * 0.5) {
          discrepancies.severity = 'high';
          discrepancies.recommendations.push(
            'Significant seat count mismatch detected. Consider regenerating all event seats.'
          );
        } else if (Math.abs(discrepancies.details.totalDifference) > layoutCounts.total * 0.2) {
          discrepancies.severity = 'medium';
          discrepancies.recommendations.push(
            'Notable differences in seat counts. Verify venue layout and event configurations.'
          );
        } else {
          discrepancies.severity = 'low';
          discrepancies.recommendations.push(
            'Minor seat count differences detected. Review recent venue changes.'
          );
        }
      }
    }

    // Добавляем статистику
    const result = {
      layout: layoutCounts,
      database: dbCounts,
      discrepancies,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Venue seats comparison complete:', result);
    return result;
  } catch (error) {
    console.error('❌ Error comparing venue seats:', error);
    throw error;
  }
};

// Генерация уведомления о проблемах
export const generateSeatDiscrepancyNotification = (comparison) => {
  if (!comparison.discrepancies.hasDiscrepancies) {
    return {
      type: 'success',
      title: 'Seats Verification Passed',
      message: 'All seat counts are consistent across venue and events.',
      icon: 'FiCheckCircle'
    };
  }
  
  const { severity, details } = comparison.discrepancies;
  
  // Специальное уведомление для случая, когда места еще не созданы
  if (comparison.database.total === 0 && comparison.layout.total > 0) {
    return {
      type: 'warning',
      title: 'Seats Need Generation',
      message: `Venue has ${comparison.layout.total} seats in layout but no seats are generated in database yet.`,
      icon: 'FiAlertTriangle'
    };
  }
  
  const notifications = {
    high: {
      type: 'error',
      title: 'Critical Seat Count Mismatch',
      message: `Found ${Object.keys(details.byEvent).length} events with significant seat count differences. Total difference: ${Math.abs(details.totalDifference)} seats.`,
      icon: 'FiAlertTriangle'
    },
    medium: {
      type: 'warning',
      title: 'Seat Count Discrepancy Detected',
      message: `Some events have different seat counts than expected. Average difference: ${Math.abs(details.totalDifference)} seats.`,
      icon: 'FiAlertCircle'
    },
    low: {
      type: 'info',
      title: 'Minor Seat Count Differences',
      message: `Small variations in seat counts detected. Review recommended.`,
      icon: 'FiInfo'
    }
  };
  
  return notifications[severity];
};