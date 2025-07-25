// Этот файл дублирует функциональность из eventService.js и venueService.js
// Удаляем его, так как:
// 1. fetchSeatMapData - дублирует fetchEventById + fetchVenueById
// 2. holdSeat/releaseSeats - дублирует функции из eventService.js  
// 3. cleanupExpiredReservations - дублирует функцию из venueService.js
// 4. initializeSeatMapRealtime - дублирует initializeRealtimeSubscription

// Этот файл можно безопасно удалить
console.warn('seatMapService.js is deprecated. Use eventService.js and venueService.js instead.');