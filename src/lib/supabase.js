```javascript
import { createClient } from '@supabase/supabase-js'

// Project ID will be auto-injected during deployment
const SUPABASE_URL = 'https://nxbhaykrrvhrqbpzcyxh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YmhheWtycnZocnFicHpjeXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjMwNjQsImV4cCI6MjA2ODU5OTA2NH0.PETm29XpfgmnekbmiYnmY-3SlFzchIV9tofDH6bNPLg'

if (SUPABASE_URL == 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY == '<ANON_KEY>') {
  throw new Error('Missing Supabase variables');
}

// Перехватываем fetch для исправления проблемы с "hold"/"held"
const customFetch = (...args) => {
  const [url, options = {}] = args;

  // Исправляем проблему с 'hold'/'held' только для запросов к таблице мест
  if (url.includes('event_seats_fanaticka_7a3x9d') && options?.method === 'PATCH') {
    // Проверяем body
    if (options.body) {
      const bodyText = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);

      // Если находим 'hold' вместо 'held', исправляем
      if (bodyText.includes('"hold"')) {
        console.log('⚠️ Найдено "hold" в запросе, исправляем на "held"');
        if (typeof options.body === 'string') {
          options.body = options.body.replace('"hold"', '"held"');
        } else {
          // Если body - объект
          const bodyObj = typeof options.body === 'object' ? options.body : JSON.parse(options.body);
          if (bodyObj.status === 'hold') {
            bodyObj.status = 'held';
            options.body = JSON.stringify(bodyObj);
          }
        }
        console.log('✅ Исправлено на:', options.body);
      }
    }
  }

  return fetch(...args);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  realtime: {
    // Enable Realtime for real-time updates
    timeout: 30000, // 30 seconds timeout
    heartbeat: {
      interval: 15000, // 15 seconds heartbeat interval
    }
  },
  global: {
    fetch: customFetch // Используем наш перехватчик fetch
  }
})

export default supabase;
```