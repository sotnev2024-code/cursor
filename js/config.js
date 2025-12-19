/**
 * Конфигурация приложения
 */
const CONFIG = {
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

