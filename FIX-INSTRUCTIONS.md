# Исправление проблемы с "hold" vs "held"

## Описание проблемы

В приложении обнаружена проблема: при выборе мест на схеме зала, статус места отправляется в базу данных как `"hold"` вместо правильного `"held"`. Это приводит к ошибкам, так как в базе данных ожидается статус `"held"`.

## Пошаговое решение

### 1. Найти и открыть файл src/lib/supabase.js

Этот файл содержит конфигурацию клиента Supabase и является идеальным местом для исправления проблемы на уровне запросов к API.

### 2. Добавить перехватчик fetch

Добавьте следующий код перед созданием клиента Supabase:

```javascript
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
};
```

### 3. Использовать перехватчик в клиенте Supabase

Измените создание клиента Supabase, добавив опцию `global.fetch`:

```javascript
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
```

### 4. Исправить константы в src/constants/seatStatus.js

Откройте файл `src/constants/seatStatus.js` и убедитесь, что константа `HELD` имеет значение `'held'`, а не `'hold'`:

```javascript
export const SEAT_STATUS = {
  FREE: 'free',
  HELD: 'held', // ВАЖНО: используем 'held', а не 'hold'
  SOLD: 'sold',
  BOOKED: 'booked'
};
```

Также добавьте функцию для безопасного получения статуса:

```javascript
// Функция для безопасного получения статуса
export const getSafeStatus = (status) => {
  // Исправляем 'hold' на 'held' если он попадает в систему
  if (status === 'hold') {
    console.warn('⚠️ Исправляем некорректный статус "hold" на "held"');
    return SEAT_STATUS.HELD;
  }
  
  // Проверяем, является ли статус допустимым
  if (Object.values(SEAT_STATUS).includes(status)) {
    return status;
  }
  
  // Если статус недопустимый, возвращаем FREE
  console.warn(`⚠️ Некорректный статус "${status}", используем "free" по умолчанию`);
  return SEAT_STATUS.FREE;
};
```

### 5. Использовать getSafeStatus во всех местах получения статуса

В файлах, где происходит работа со статусами мест (например, `src/services/seatMapService.js`), замените прямое использование статусов на вызов функции `getSafeStatus`:

```javascript
// Было
const status = seat.status;

// Стало
import { getSafeStatus } from '../constants/seatStatus';
const status = getSafeStatus(seat.status);
```

### 6. Пересобрать проект и очистить кэш

```bash
# Остановите текущий сервер разработки
# Затем запустите заново
npm run dev

# Если production:
npm run build && npm run preview
```

В браузере нажмите Ctrl+Shift+R для полной перезагрузки с очисткой кэша.

### 7. Проверка

После внесения изменений:

1. Откройте DevTools браузера (F12)
2. Перейдите на вкладку Network
3. Выберите место на схеме зала
4. Найдите PATCH запрос к таблице `event_seats_fanaticka_7a3x9d`
5. Проверьте, что в теле запроса используется `"held"`, а не `"hold"`
6. Убедитесь, что ответ имеет статус 200 OK

## Дополнительно: Мониторинг проблемы

Если вы хотите отслеживать проблему без внесения изменений в код, добавьте следующий скрипт в начало файла `index.html` перед любыми другими скриптами:

```html
<script>
  (function() {
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const [url, options] = args;
      
      if (url.includes('event_seats_fanaticka_7a3x9d') && 
          options?.method === 'PATCH' || 
          options?.method === 'POST') {
        
        console.group('🔍 ПЕРЕХВАЧЕН ЗАПРОС К ТАБЛИЦЕ МЕСТ');
        console.log('URL:', url);
        console.log('Метод:', options.method);
        
        // Проверяем body
        let body = options.body;
        if (body) {
          const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
          console.log('Body до:', bodyStr);
          
          // Проверяем, есть ли "hold" в запросе
          if (bodyStr.includes('"hold"')) {
            console.error('❌ НАЙДЕНО "hold" В ЗАПРОСЕ!');
            console.trace('Стек вызовов:');
          }
        }
        
        console.groupEnd();
      }
      
      return originalFetch.apply(this, args);
    };
  })();
</script>
```

Этот скрипт будет выводить в консоль информацию о всех запросах к таблице мест и предупреждать, если в запросе используется некорректный статус "hold".