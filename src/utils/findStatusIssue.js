// Этот файл поможет найти проблему с трансформацией статуса "held" -> "hold"
import supabase from '../lib/supabase';

// Тестируем статусы мест
const testSeatStatuses = async () => {
  console.log('🔍 Проверка статусов мест в базе данных...');
  
  try {
    // 1. Получаем доступные статусы
    console.log('Шаг 1: Проверяем доступные значения статусов в базе...');
    const { data: eventSeats, error } = await supabase
      .from('event_seats_fanaticka_7a3x9d')
      .select('status')
      .limit(10);
    
    if (error) {
      console.error('❌ Ошибка при получении статусов:', error);
    } else {
      console.log('✅ Найденные статусы:', eventSeats.map(s => s.status));
    }
    
    // 2. Тестируем обновление статуса на "held"
    console.log('\nШаг 2: Тестируем обновление на "held"...');
    const testEventId = '12345'; // Тестовый ID события
    const testSeatId = 'test-seat-1'; // Тестовый ID места
    
    // Сначала вставляем тестовое место
    const { error: insertError } = await supabase
      .from('event_seats_fanaticka_7a3x9d')
      .insert([{
        event_id: testEventId,
        seat_id: testSeatId,
        status: 'free',
        section: 'TEST',
        row: 1
      }]);
    
    if (insertError) {
      console.log('⚠️ Не удалось вставить тестовое место (возможно уже существует):', insertError);
    }
    
    // Теперь пробуем обновить его
    console.log('Отправляем запрос на обновление статуса "held"...');
    const { data: updateData, error: updateError } = await supabase
      .from('event_seats_fanaticka_7a3x9d')
      .update({ status: 'held' })
      .eq('event_id', testEventId)
      .eq('seat_id', testSeatId)
      .select();
    
    if (updateError) {
      console.error('❌ Ошибка обновления на "held":', updateError);
    } else {
      console.log('✅ Результат обновления:', updateData);
    }
    
    // 3. Проверяем, что было реально отправлено в сеть
    console.log('\nШаг 3: Проверяем сетевые запросы в консоли браузера');
    console.log('Проверьте запросы PATCH в Network DevTools');
    console.log('Ищите строку "hold" вместо "held" в payload');
  } catch (e) {
    console.error('💥 Неожиданная ошибка:', e);
  }
};

export { testSeatStatuses };

// Если запускаем файл напрямую
if (typeof window !== 'undefined') {
  console.log('Запускаем тест статусов...');
  testSeatStatuses();
}