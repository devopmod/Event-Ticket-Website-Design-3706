# Анализ проблемы с таблицей events_fanaticka_7a3x9d

## 1. Поиск всех упоминаний таблицы events

### В src/services/eventService.js:
```javascript
const EVENTS_TABLE = 'events_fanaticka_7a3x9d';
```

### В src/services/venueService.js:
```javascript
// Строка 82 - неправильное название таблицы!
const {data: venue, error: eventError} = await supabase
  .from('events_fanaticka_7a3x9d')  // ✅ Правильно
  .select(`
    venue_id,
    venues:${VENUES_TABLE}!events_fanaticka_7a3x9d_venue_id_fkey(
      *,
      seats:${VENUE_SEATS_TABLE}(*)
    )
  `)
```

## 2. Проблемы с foreign key constraints

### В eventService.js:
```javascript
// Проблема: неправильное указание FK constraint
venue:${VENUES_TABLE}!events_fanaticka_7a3x9d_venue_id_fkey(id, name, description)
```

## 3. Анализ структуры данных

Проблема может быть в:
1. Неправильном названии FK constraint
2. Неправильной структуре данных при INSERT
3. Отсутствии обязательных полей

## 4. Решение

Нужно:
1. Проверить точное название FK constraint в Supabase
2. Упростить запросы без указания FK constraint
3. Добавить больше логирования для отладки