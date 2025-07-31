import { createClient } from '@supabase/supabase-js';

// Создаём оригинальный клиент Supabase
const SUPABASE_URL = 'https://kakiytbuqfhjafpacyoj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtha2l5dGJ1cWZoamFmcGFjeW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NzcyNTYsImV4cCI6MjA2ODQ1MzI1Nn0.dO4ebeEGgDU__RIP-MQZ4Wydiyb02Ij3yivvqu4mIog';

// Исправленный клиент без трансформаций
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  global: {
    // Перехватываем fetch для логирования
    fetch: (...args) => {
      const [url, options] = args;
      
      // Если это запрос к таблице мест с PATCH методом
      if (url.includes('event_seats_fanaticka_7a3x9d') && options?.method === 'PATCH') {
        console.log('🔍 Supabase fetch перехвачен:', { url, method: options.method });
        
        // Проверяем body
        if (options?.body) {
          const bodyText = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
          console.log('📦 Body до отправки:', bodyText);
          
          // Исправляем проблему с "hold" -> "held"
          if (typeof options.body === 'string' && options.body.includes('"hold"')) {
            console.log('⚠️ Найдено "hold", исправляем на "held"...');
            options.body = options.body.replace('"hold"', '"held"');
            console.log('✅ Исправлено:', options.body);
          }
        }
      }
      
      // Вызываем оригинальный fetch
      return fetch(...args);
    }
  }
});

export default supabase;