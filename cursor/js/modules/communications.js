/**
 * Модуль управления уведомлениями
 */
class CommunicationsModule {
    constructor(api, appState, notifications) {
        this.api = api;
        this.appState = appState;
        this.notifications = notifications;
    }

    /**
     * Рендерит HTML-разметку модуля уведомлений
     */
    render() {
        const container = document.getElementById('communications');
        if (!container) return;

        container.innerHTML = `
            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0"><i class="bi bi-envelope"></i> Отправка уведомлений</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label class="form-label">Тип уведомления:</label>
                                <select class="form-select" id="notificationType">
                                    <option value="REMINDER">Напоминание о записи</option>
                                    <option value="PROMOTION">Акция/Скидка</option>
                                    <option value="NEW_SERVICE">Новая услуга</option>
                                    <option value="BIRTHDAY">Поздравление с Днем рождения</option>
                                    <option value="CUSTOM">Произвольное сообщение</option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Кому отправить:</label>
                                <select class="form-select" id="notificationRecipients" multiple>
                                    <option value="ALL">Все клиенты</option>
                                    <option value="TODAY">Клиенты с записями сегодня</option>
                                    <option value="TOMORROW">Клиенты с записями завтра</option>
                                    <option value="SPECIFIC">Выбранные клиенты</option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Сообщение:</label>
                                <textarea class="form-control" id="notificationMessage" rows="4" placeholder="Текст сообщения..."></textarea>
                                <small class="text-muted">Доступные переменные: {client_name}, {date}, {time}, {service}, {specialist}</small>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Канал отправки:</label>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="sendSMS" checked>
                                    <label class="form-check-label" for="sendSMS">
                                        SMS
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="sendEmail">
                                    <label class="form-check-label" for="sendEmail">
                                        Email
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="sendTelegram">
                                    <label class="form-check-label" for="sendTelegram">
                                        Telegram
                                    </label>
                                </div>
                            </div>

                            <button class="btn btn-primary" onclick="window.sendNotification()">
                                <i class="bi bi-send"></i> Отправить уведомление
                            </button>
                            <button class="btn btn-outline-secondary" onclick="window.previewNotification()">
                                <i class="bi bi-eye"></i> Предпросмотр
                            </button>
                        </div>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header bg-success text-white">
                            <h5 class="mb-0"><i class="bi bi-clock-history"></i> История уведомлений</h5>
                        </div>
                        <div class="card-body">
                            <div id="notificationHistory" style="max-height: 400px; overflow-y: auto;">
                                <p class="text-center text-muted">Загрузка истории...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async load() {
        try {
            // Если контейнер пустой, сначала рендерим разметку
            const container = document.getElementById('communications');
            if (container && !container.querySelector('.row')) {
                this.render();
            }

            await Promise.all([
                this.loadHistory(),
                this.loadRecipients()
            ]);
        } catch (error) {
            this.notifications.error(error.message, 'Ошибка загрузки уведомлений');
        }
    }

    async loadHistory() {
        try {
            const data = await this.api.get(CONFIG.ENDPOINTS.NOTIFICATIONS || '/api/notifications/history');
            if (data.success && data.data) {
                this.renderHistory(data.data);
            }
        } catch (error) {
            console.error('Ошибка загрузки истории уведомлений:', error);
        }
    }

    renderHistory(history) {
        const container = document.getElementById('notificationHistory');
        if (!container) return;

        if (!history || history.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">Нет истории уведомлений</p>';
            return;
        }

        let html = '<div class="list-group">';
        history.slice(0, 20).forEach(notification => {
            const date = formatDate(notification.created_at);
            const time = formatTime(notification.created_at);
            
            const typeIcons = {
                'REMINDER': 'bi-bell',
                'PROMOTION': 'bi-tag',
                'NEW_SERVICE': 'bi-scissors',
                'BIRTHDAY': 'bi-gift',
                'CUSTOM': 'bi-envelope'
            };

            const typeColors = {
                'REMINDER': 'text-primary',
                'PROMOTION': 'text-success',
                'NEW_SERVICE': 'text-info',
                'BIRTHDAY': 'text-warning',
                'CUSTOM': 'text-secondary'
            };

            const icon = typeIcons[notification.type] || 'bi-envelope';
            const color = typeColors[notification.type] || 'text-secondary';

            html += `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <div class="d-flex align-items-center mb-1">
                                <i class="bi ${icon} ${color} me-2"></i>
                                <strong>${escapeHtml(notification.title || 'Уведомление')}</strong>
                            </div>
                            <p class="mb-1 small">${escapeHtml(notification.message || '')}</p>
                            <small class="text-muted">
                                ${notification.recipients_count || 0} получателей | 
                                ${date} ${time}
                            </small>
                        </div>
                        <div>
                            <span class="badge bg-${notification.status === 'SENT' ? 'success' : 'warning'}">
                                ${notification.status === 'SENT' ? 'Отправлено' : 'В очереди'}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    async loadRecipients() {
        // Загружаем список клиентов для выбора получателей
        try {
            const data = await this.api.get(CONFIG.ENDPOINTS.CLIENTS);
            if (data.success && data.data) {
                // Можно добавить динамическое заполнение списка получателей
            }
        } catch (error) {
            console.error('Ошибка загрузки получателей:', error);
        }
    }

    async send() {
        const typeSelect = document.getElementById('notificationType');
        const recipientsSelect = document.getElementById('notificationRecipients');
        const messageTextarea = document.getElementById('notificationMessage');
        const sendSMS = document.getElementById('sendSMS');
        const sendEmail = document.getElementById('sendEmail');
        const sendTelegram = document.getElementById('sendTelegram');

        if (!messageTextarea || !messageTextarea.value.trim()) {
            this.notifications.warning('Введите текст сообщения');
            return;
        }

        const recipientType = recipientsSelect?.value || 'ALL';
        const recipientIds = recipientType === 'SPECIFIC' 
            ? Array.from(recipientsSelect?.selectedOptions || [])
                .filter(opt => opt.value !== 'SPECIFIC' && opt.value !== 'ALL' && opt.value !== 'TODAY' && opt.value !== 'TOMORROW')
                .map(opt => parseInt(opt.value))
            : null;

        const channels = [];
        if (sendSMS?.checked) channels.push('SMS');
        if (sendEmail?.checked) channels.push('EMAIL');
        if (sendTelegram?.checked) channels.push('TELEGRAM');

        const notificationData = {
            type: typeSelect?.value || 'CUSTOM',
            recipient_type: recipientType,
            recipient_ids: recipientIds,
            message: messageTextarea.value,
            channels: channels
        };

        try {
            const result = await this.api.post(CONFIG.ENDPOINTS.NOTIFICATIONS || '/api/notifications', notificationData);
            if (result.success) {
                this.notifications.success('Уведомление отправлено');
                messageTextarea.value = '';
                await this.loadHistory();
            } else {
                this.notifications.error(result.error || 'Ошибка отправки');
            }
        } catch (error) {
            this.notifications.error(error.message);
        }
    }

    preview() {
        const typeSelect = document.getElementById('notificationType');
        const messageTextarea = document.getElementById('notificationMessage');
        
        if (!messageTextarea || !messageTextarea.value.trim()) {
            this.notifications.warning('Введите текст сообщения для предпросмотра');
            return;
        }

        const type = typeSelect?.value || 'CUSTOM';
        const message = messageTextarea.value;

        // Заменяем переменные на примеры
        const preview = message
            .replace(/{client_name}/g, 'Иван Иванов')
            .replace(/{date}/g, formatDate(new Date()))
            .replace(/{time}/g, formatTime(new Date().toTimeString()))
            .replace(/{service}/g, 'Стрижка')
            .replace(/{specialist}/g, 'Мария Петрова');

        const modal = new bootstrap.Modal(document.createElement('div'));
        // TODO: Создать модальное окно для предпросмотра
        this.notifications.info('Предпросмотр уведомления', preview);
    }
}

