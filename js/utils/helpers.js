/**
 * Вспомогательные функции
 */

/**
 * Экранирование HTML для защиты от XSS
 */
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Форматирование даты
 */
function formatDate(date, locale = 'ru-RU') {
    if (!date) return '';
    try {
        const d = new Date(date);
        return d.toLocaleDateString(locale, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Ошибка форматирования даты:', error);
        return '';
    }
}

/**
 * Форматирование времени
 */
function formatTime(time) {
    return time ? time.slice(0, 5) : '';
}

/**
 * Дебаунсинг функции
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle функции
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Безопасная вставка HTML
 */
function safeHtml(html) {
    if (typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(html);
    }
    return escapeHtml(html);
}

