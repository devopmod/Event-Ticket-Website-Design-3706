import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translations
const resources = {
  en: {
    translation: {
      // Navigation
      "nav.home": "Home",
      "nav.concerts": "Concerts",
      "nav.admin": "Admin",
      
      // Home page
      "home.title": "Live the Experience",
      "home.subtitle": "Discover amazing events, concerts, and bus tours across Europe",
      "home.search": "Search by Artist, Event or Venue",
      "home.bonus": "GET A BONUS TICKET",
      
      // Concert list page
      "concerts.title": "Concerts",
      "concerts.subtitle": "Comfortable transportation to your favorite events across Europe",
      "concerts.filters": "Filters",
      "concerts.clear": "Clear All",
      "concerts.category": "Category",
      "concerts.dateRange": "Date Range",
      "concerts.city": "City",
      "concerts.priceFrom": "Price From",
      "concerts.from": "From",
      "concerts.to": "To",
      "concerts.noEvents": "No events found",
      "concerts.tryAdjusting": "Try adjusting your filters to see more results",
      "concerts.showing": "Showing",
      "concerts.of": "of",
      "concerts.results": "results",
      "concerts.bookNow": "Book Now",
      
      // Concert detail
      "concert.buyTickets": "Buy Tickets Now",
      "concert.back": "Back to concerts",
      "concert.general": "General Admission",
      "concert.vip": "VIP",
      "concert.premium": "Premium",
      "concert.prices": "Ticket Prices",
      "concert.attending": "people attending",
      "concert.doors": "Doors open at",
      
      // Common
      "common.from": "from"
    }
  },
  ru: {
    translation: {
      // Navigation
      "nav.home": "Главная",
      "nav.concerts": "Концерты",
      "nav.admin": "Админ",
      
      // Home page
      "home.title": "Проживи Впечатление",
      "home.subtitle": "Открывайте удивительные события, концерты и автобусные туры по Европе",
      "home.search": "Поиск по артистам, событиям или местам",
      "home.bonus": "ПОЛУЧИТЬ БОНУСНЫЙ БИЛЕТ",
      
      // Concert list page
      "concerts.title": "Концерты",
      "concerts.subtitle": "Комфортная транспортировка на ваши любимые мероприятия по Европе",
      "concerts.filters": "Фильтры",
      "concerts.clear": "Очистить всё",
      "concerts.category": "Категория",
      "concerts.dateRange": "Диапазон дат",
      "concerts.city": "Город",
      "concerts.priceFrom": "Цена от",
      "concerts.from": "От",
      "concerts.to": "До",
      "concerts.noEvents": "События не найдены",
      "concerts.tryAdjusting": "Попробуйте изменить фильтры для отображения результатов",
      "concerts.showing": "Показано",
      "concerts.of": "из",
      "concerts.results": "результатов",
      "concerts.bookNow": "Забронировать",
      
      // Concert detail
      "concert.buyTickets": "Купить билеты сейчас",
      "concert.back": "Назад к концертам",
      "concert.general": "Стандартный вход",
      "concert.vip": "VIP",
      "concert.premium": "Премиум",
      "concert.prices": "Цены на билеты",
      "concert.attending": "человек посетят",
      "concert.doors": "Двери открываются в",
      
      // Common
      "common.from": "от"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: true
    }
  });

export default i18n;