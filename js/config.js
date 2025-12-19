   /**
    * Конфигурация приложения
    */
   const CONFIG = {
       // Базовый URL API. Для локальной разработки можно временно раскомментировать строку ниже.
       // API_BASE_URL: 'http://localhost:5000/api',
       // Для продакшена (на сервере) используем относительный путь, чтобы работал HTTPS-домен:
       API_BASE_URL: '/api',
       ENDPOINTS: {
           SPECIALISTS: '/specialists',
           CLIENTS: '/clients',
           SERVICES: '/services',
           BOOKINGS: '/bookings',
           CATEGORIES: '/categories',
           STATISTICS: '/statistics',
           NOTIFICATIONS: '/notifications',
           SETTINGS: '/settings',
           DASHBOARD: '/dashboard',
           BACKUP: '/backup'
       },
       SETTINGS: {
           DEBOUNCE_DELAY: 300,
           AUTO_REFRESH_INTERVAL: 300000,
           DATE_FORMAT: 'ru-RU'
       }
   };
