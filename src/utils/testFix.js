import supabase from '../lib/supabase';

// Функция для тестирования исправления
export const testSeatStatusFix = async () => {
  console.log('🧪 Тестирование исправления проблемы с seat status...');
  
  try {
    // 1. Создаем тестовое место
    const testEventId = 'test-fix-123';
    const testSeatId = 'test-seat-fix-1';
    
    console.log('1️⃣ Создаем тестовое место...');
    const { error: insertError } = await supabase
      .from('event_seats_fanaticka_7a3x9d')
      .upsert([{
        event_id: testEventId,
        seat_id: testSeatId,
        status: 'free',
        section: 'TEST',
        row: 1
      }]);
    
    if (insertError) {
      console.error('❌ Ошибка при создании тестового места:', insertError);
      return false;
    }
    
    console.log('✅ Тестовое место создано успешно');
    
    // 2. Обновляем статус на "held"
    console.log('2️⃣ Обновляем статус на "held"...');
    const { data: updateData, error: updateError } = await supabase
      .from('event_seats_fanaticka_7a3x9d')
      .update({ status: 'held' })
      .eq('event_id', testEventId)
      .eq('seat_id', testSeatId)
      .select();
    
    if (updateError) {
      console.error('❌ Ошибка при обновлении статуса:', updateError);
      return false;
    }
    
    console.log('✅ Статус обновлен успешно:', updateData);
    
    // 3. Проверяем, что статус обновился корректно
    console.log('3️⃣ Проверяем финальный статус в базе...');
    const { data: checkData, error: checkError } = await supabase
      .from('event_seats_fanaticka_7a3x9d')
      .select('status')
      .eq('event_id', testEventId)
      .eq('seat_id', testSeatId)
      .single();
    
    if (checkError) {
      console.error('❌ Ошибка при проверке статуса:', checkError);
      return false;
    }
    
    console.log('📊 Финальный статус в базе:', checkData.status);
    
    if (checkData.status === 'held') {
      console.log('✅ ИСПРАВЛЕНИЕ РАБОТАЕТ! Статус корректно сохранен как "held"');
      return true;
    } else if (checkData.status === 'hold') {
      console.error('❌ ИСПРАВЛЕНИЕ НЕ РАБОТАЕТ! Статус сохранен как "hold"');
      return false;
    } else {
      console.warn(`⚠️ Неожиданный статус: ${checkData.status}`);
      return false;
    }
  } catch (e) {
    console.error('💥 Непредвиденная ошибка:', e);
    return false;
  }
};

// Если файл запускается напрямую
if (typeof window !== 'undefined') {
  console.log('Запускаем тест исправления...');
  testSeatStatusFix().then(success => {
    console.log('Результат теста:', success ? 'УСПЕШНО' : 'НЕУДАЧНО');
  });
}