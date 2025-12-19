/**
 * Конфигурация приложения
 */
const CONFIG = {
    // Базовый URL API. Для локальной разработки можно временно раскомментировать строку ниже.
    // API_BASE_URL: 'http://localhost:5000/api',
    // Для продакшена (Timeweb, любой хостинг с тем же доменом) используем относительный путь:
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
        AUTO_REFRESH_INTERVAL: 300000, // 5 минут
        ITEMS_PER_PAGE: 20,
        DATE_FORMAT: 'ru-RU'
    }
};

