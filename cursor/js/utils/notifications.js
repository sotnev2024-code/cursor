/**
 * Сервис уведомлений
 */
class NotificationService {
    constructor() {
        this.toastContainer = document.getElementById('messageToast');
        this.toastTitle = document.getElementById('toastTitle');
        this.toastMessage = document.getElementById('toastMessage');
    }

    show(title, message, type = 'info') {
        if (!this.toastContainer || !this.toastTitle || !this.toastMessage) {
            console.warn('Toast элементы не найдены в DOM');
            return;
        }

        const headerColors = {
            'success': 'bg-success text-white',
            'error': 'bg-danger text-white',
            'warning': 'bg-warning text-dark',
            'info': 'bg-info text-white'
        };

        this.toastTitle.textContent = title;
        this.toastMessage.textContent = message;
        this.toastTitle.parentElement.className = 
            'toast-header ' + (headerColors[type] || 'bg-info text-white');

        const toast = new bootstrap.Toast(this.toastContainer);
        toast.show();
    }

    success(message, title = 'Успех') {
        this.show(title, message, 'success');
    }

    error(message, title = 'Ошибка') {
        this.show(title, message, 'error');
    }

    warning(message, title = 'Предупреждение') {
        this.show(title, message, 'warning');
    }

    info(message, title = 'Информация') {
        this.show(title, message, 'info');
    }
}

// Создаем глобальный экземпляр
const notifications = new NotificationService();

// Для обратной совместимости
function showToast(title, message, type = 'info') {
    notifications.show(title, message, type);
}

