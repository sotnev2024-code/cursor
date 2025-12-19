/**
 * Модуль дашборда
 */
class DashboardModule {
    constructor(api, appState, notifications) {
        this.api = api;
        this.appState = appState;
        this.notifications = notifications;
    }

    /**
     * Рендерит HTML-разметку дашборда
     */
    render() {
        const container = document.getElementById('dashboard');
        if (!container) return;

        container.innerHTML = `
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="stat-card primary">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h2 id="todayBookingsCount">0</h2>
                                <p class="mb-0">Записей сегодня</p>
                            </div>
                            <i class="bi bi-calendar-check" style="font-size: 2.5rem; opacity: 0.8;"></i>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card success">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h2 id="clientsCount">0</h2>
                                <p class="mb-0">Активных клиентов</p>
                            </div>
                            <i class="bi bi-people" style="font-size: 2.5rem; opacity: 0.8;"></i>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card warning">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h2 id="revenueToday">0</h2>
                                <p class="mb-0">Выручка сегодня</p>
                            </div>
                            <i class="bi bi-cash-stack" style="font-size: 2.5rem; opacity: 0.8;"></i>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card info">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h2 id="pendingNotifications">0</h2>
                                <p class="mb-0">Уведомления</p>
                            </div>
                            <i class="bi bi-bell" style="font-size: 2.5rem; opacity: 0.8;"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0"><i class="bi bi-calendar3"></i> Ближайшие записи</h5>
                        </div>
                        <div class="card-body">
                            <div id="upcomingBookings" class="table-responsive">
                                <p class="text-center text-muted">Загрузка...</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header bg-success text-white">
                            <h5 class="mb-0"><i class="bi bi-graph-up"></i> Топ специалистов</h5>
                        </div>
                        <div class="card-body">
                            <div id="topSpecialists">
                                <p class="text-center text-muted">Загрузка...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header bg-warning text-dark">
                            <h5 class="mb-0"><i class="bi bi-clock-history"></i> Срочные действия</h5>
                        </div>
                        <div class="card-body">
                            <div id="urgentActions">
                                <div class="alert alert-warning">
                                    <i class="bi bi-exclamation-triangle"></i>
                                    <strong>Требуют внимания:</strong>
                                    <ul class="mb-0 mt-2">
                                        <li id="holdBookingsCount">0 бронирований в статусе HOLD</li>
                                        <li id="tomorrowBookingsCount">0 завтрашних записей</li>
                                        <li id="unconfirmedCount">0 неподтвержденных записей</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header bg-info text-white">
                            <h5 class="mb-0"><i class="bi bi-activity"></i> Активность</h5>
                        </div>
                        <div class="card-body">
                            <div id="recentActivity">
                                <p class="text-center text-muted">Загрузка активности...</p>
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
            const container = document.getElementById('dashboard');
            if (container && !container.querySelector('.row')) {
                this.render();
            }

            const data = await this.api.get(CONFIG.ENDPOINTS.DASHBOARD);
            if (data.success) {
                this.updateStats(data.data);
                this.renderUpcomingBookings(data.data.upcomingBookings || []);
                this.renderTopSpecialists(data.data.topSpecialists || []);
                this.renderUrgentActions(data.data);
                this.renderRecentActivity(data.data.recentActivity || []);
            }
        } catch (error) {
            console.error('Ошибка загрузки дашборда:', error);
            this.notifications.error(error.message || 'Ошибка загрузки дашборда');
        }
    }

    updateStats(data) {
        const todayBookings = document.getElementById('todayBookingsCount');
        const clientsCount = document.getElementById('clientsCount');
        const revenueToday = document.getElementById('revenueToday');
        const pendingNotifications = document.getElementById('pendingNotifications');

        if (todayBookings) todayBookings.textContent = data.todayBookings || 0;
        if (clientsCount) clientsCount.textContent = data.clientsCount || 0;
        if (revenueToday) {
            const revenue = data.revenueToday || 0;
            revenueToday.textContent = this.formatCurrency(revenue);
        }
        if (pendingNotifications) pendingNotifications.textContent = data.pendingNotifications || 0;
    }

    /**
     * Форматирует валюту
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(amount);
    }

    renderUpcomingBookings(bookings) {
        const container = document.getElementById('upcomingBookings');
        if (!container) return;
        
        if (bookings.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">Нет ближайших записей</p>';
            return;
        }
        
        let html = '<table class="table table-hover table-sm">';
        html += '<thead><tr><th>Дата</th><th>Время</th><th>Клиент</th><th>Специалист</th><th>Услуга</th><th>Статус</th><th>Действия</th></tr></thead><tbody>';
        
        bookings.forEach(booking => {
            const statusBadges = {
                'CONFIRMED': 'bg-success',
                'HOLD': 'bg-warning',
                'PENDING': 'bg-secondary',
                'COMPLETED': 'bg-info',
                'CANCELLED': 'bg-danger'
            };
            
            const statusLabels = {
                'CONFIRMED': 'Подтверждена',
                'HOLD': 'Ожидание',
                'PENDING': 'Ожидает',
                'COMPLETED': 'Завершена',
                'CANCELLED': 'Отменена'
            };
            
            const status = booking.status || 'PENDING';
            const isToday = booking.date === new Date().toISOString().split('T')[0];
            const dateLabel = isToday ? 'Сегодня' : formatDate(booking.date);
            
            html += `<tr>
                <td>${dateLabel}</td>
                <td>${formatTime(booking.time)}</td>
                <td>${escapeHtml(booking.client_name || '—')}</td>
                <td>${escapeHtml(booking.specialist_name || '—')}</td>
                <td>${escapeHtml(booking.service_name || '—')}</td>
                <td><span class="badge ${statusBadges[status] || 'bg-secondary'}">${statusLabels[status] || status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="window.bookingModal?.showEdit(${booking.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                </td>
            </tr>`;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    }

    renderTopSpecialists(specialists) {
        const container = document.getElementById('topSpecialists');
        if (!container) return;
        
        if (specialists.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">Нет данных</p>';
            return;
        }
        
        let html = '<ul class="list-group list-group-flush">';
        
        specialists.forEach((specialist, index) => {
            html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <strong>${index + 1}. ${escapeHtml(specialist.name || 'Без имени')}</strong><br>
                    <small class="text-muted">${escapeHtml(specialist.position || '')}</small>
                </div>
                <span class="badge bg-primary rounded-pill">${specialist.bookings_count || 0}</span>
            </li>`;
        });
        
        html += '</ul>';
        container.innerHTML = html;
    }

    renderUrgentActions(data) {
        const holdBookings = document.getElementById('holdBookingsCount');
        const tomorrowBookings = document.getElementById('tomorrowBookingsCount');
        const unconfirmedCount = document.getElementById('unconfirmedCount');
        
        if (holdBookings) {
            holdBookings.textContent = `${data.holdBookingsCount || 0} бронирований в статусе HOLD`;
        }
        if (tomorrowBookings) {
            tomorrowBookings.textContent = `${data.tomorrowBookingsCount || 0} завтрашних записей`;
        }
        if (unconfirmedCount) {
            unconfirmedCount.textContent = `${data.unconfirmedCount || 0} неподтвержденных записей`;
        }
    }

    renderRecentActivity(activities) {
        const container = document.getElementById('recentActivity');
        if (!container) return;
        
        if (activities.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">Нет активности</p>';
            return;
        }
        
        let html = '<div class="list-group list-group-flush">';
        
        activities.forEach(activity => {
            const date = new Date(activity.created_at);
            const timeAgo = this.getTimeAgo(date);
            
            html += `<div class="list-group-item">
                <div class="d-flex w-100 justify-content-between">
                    <div>
                        <h6 class="mb-1">Запись ${activity.type}</h6>
                        <p class="mb-1">
                            <strong>${escapeHtml(activity.client_name || '—')}</strong> - 
                            ${escapeHtml(activity.service_name || '—')}
                        </p>
                        <small>${formatDate(activity.date)} в ${formatTime(activity.time)}</small>
                    </div>
                    <small class="text-muted">${timeAgo}</small>
                </div>
            </div>`;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Получает время назад в читаемом формате
     */
    getTimeAgo(date) {
        const now = new Date();
        const diff = Math.floor((now - date) / 1000); // разница в секундах
        
        if (diff < 60) return 'только что';
        if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} дн назад`;
        return formatDate(date.toISOString());
    }
}
