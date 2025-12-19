/**
 * Модуль управления всеми записями
 */
class BookingsListModule {
    constructor(api, appState, notifications) {
        this.api = api;
        this.appState = appState;
        this.notifications = notifications;
        this.selectedBookings = new Set();
    }

    /**
     * Рендерит HTML-разметку списка всех записей
     */
    render() {
        const container = document.getElementById('bookingsList');
        if (!container) return;

        container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-4">
                    <div class="input-group">
                        <input type="date" class="form-control" id="filterDate">
                        <button class="btn btn-outline-secondary" onclick="window.filterByDate()">
                            <i class="bi bi-filter"></i> Фильтр по дате
                        </button>
                    </div>
                </div>
                <div class="col-md-4">
                    <select class="form-select" id="filterStatus" onchange="window.filterBookings()">
                        <option value="">Все статусы</option>
                        <option value="CONFIRMED">Подтвержденные</option>
                        <option value="HOLD">Ожидание</option>
                        <option value="CANCELLED">Отмененные</option>
                        <option value="COMPLETED">Завершенные</option>
                    </select>
                </div>
                <div class="col-md-4 text-end">
                    <button class="btn btn-success" onclick="window.showBulkActionsModal()">
                        <i class="bi bi-gear"></i> Групповые действия
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-header bg-warning text-dark">
                    <h5 class="mb-0"><i class="bi bi-list-task"></i> Управление записями</h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th><input type="checkbox" id="selectAllBookings"></th>
                                    <th>Дата</th>
                                    <th>Время</th>
                                    <th>Клиент</th>
                                    <th>Специалист</th>
                                    <th>Услуга</th>
                                    <th>Сумма</th>
                                    <th>Статус</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody id="bookingsTableBody">
                                <!-- Данные загрузятся через JS -->
                            </tbody>
                        </table>
                    </div>

                    <div class="alert alert-info" id="bookingsInfo">
                        Загрузка списка записей...
                    </div>
                </div>
            </div>
        `;
    }

    async load() {
        try {
            // Если контейнер пустой, сначала рендерим разметку
            const container = document.getElementById('bookingsList');
            if (container && !container.querySelector('.card')) {
                this.renderTable();
            }

            const data = await this.api.get(CONFIG.ENDPOINTS.BOOKINGS || '/api/bookings');
            if (data.success && data.data) {
                this.appState.setBookings(data.data);
                this.renderTable();
            }
        } catch (error) {
            this.notifications.error(error.message, 'Ошибка загрузки записей');
        }
    }

    renderTable() {
        const container = document.getElementById('bookingsTableBody');
        const info = document.getElementById('bookingsInfo');
        if (!container) return;

        const bookings = this.appState.bookings || [];

        if (bookings.length === 0) {
            container.innerHTML = '';
            if (info) {
                info.innerHTML = '<p class="text-center text-muted">Нет записей</p>';
            }
            return;
        }

        if (info) {
            info.style.display = 'none';
        }

        let html = '';
        bookings.forEach(booking => {
            const statusBadges = {
                'CONFIRMED': 'bg-success',
                'HOLD': 'bg-warning',
                'CANCELLED': 'bg-danger',
                'COMPLETED': 'bg-info',
                'PENDING': 'bg-secondary'
            };

            const statusLabels = {
                'CONFIRMED': 'Подтверждена',
                'HOLD': 'Ожидание',
                'CANCELLED': 'Отменена',
                'COMPLETED': 'Завершена',
                'PENDING': 'Ожидает'
            };

            const status = booking.status || 'PENDING';
            const isSelected = this.selectedBookings.has(booking.id);

            html += `
                <tr class="${isSelected ? 'table-active' : ''}">
                    <td>
                        <input type="checkbox" class="form-check-input booking-checkbox" 
                               value="${booking.id}" 
                               ${isSelected ? 'checked' : ''}
                               onchange="window.bookingsListModule.toggleSelection(${booking.id})">
                    </td>
                    <td>${formatDate(booking.date)}</td>
                    <td>${formatTime(booking.time)}</td>
                    <td>${escapeHtml(booking.client_name || booking.client?.name || '—')}</td>
                    <td>${escapeHtml(booking.specialist_name || booking.specialist?.name || '—')}</td>
                    <td>${escapeHtml(booking.service_name || booking.service?.name || '—')}</td>
                    <td><strong>${booking.price || 0} ₽</strong></td>
                    <td>
                        <span class="badge ${statusBadges[status] || 'bg-secondary'}">
                            ${statusLabels[status] || status}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="window.bookingsListModule.edit(${booking.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="window.bookingsListModule.delete(${booking.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        container.innerHTML = html;
        this.updateSelectAllCheckbox();
    }

    toggleSelection(bookingId) {
        if (this.selectedBookings.has(bookingId)) {
            this.selectedBookings.delete(bookingId);
        } else {
            this.selectedBookings.add(bookingId);
        }
        this.renderTable();
    }

    selectAll() {
        const checkbox = document.getElementById('selectAllBookings');
        if (!checkbox) return;

        const bookings = this.appState.bookings || [];
        if (checkbox.checked) {
            bookings.forEach(booking => this.selectedBookings.add(booking.id));
        } else {
            this.selectedBookings.clear();
        }
        this.renderTable();
    }

    updateSelectAllCheckbox() {
        const checkbox = document.getElementById('selectAllBookings');
        if (!checkbox) return;

        const bookings = this.appState.bookings || [];
        checkbox.checked = bookings.length > 0 && this.selectedBookings.size === bookings.length;

        checkbox.onchange = () => this.selectAll();
    }

    async filterByDate() {
        const dateInput = document.getElementById('filterDate');
        if (!dateInput || !dateInput.value) {
            this.load();
            return;
        }

        try {
            const data = await this.api.get(`${CONFIG.ENDPOINTS.BOOKINGS || '/api/bookings'}?date=${dateInput.value}`);
            if (data.success && data.data) {
                this.appState.setBookings(data.data);
                this.renderTable();
            }
        } catch (error) {
            this.notifications.error(error.message, 'Ошибка фильтрации');
        }
    }

    async filterBookings() {
        const statusSelect = document.getElementById('filterStatus');
        const dateInput = document.getElementById('filterDate');
        
        if (!statusSelect) return;

        const status = statusSelect.value;
        const date = dateInput?.value || '';

        try {
            let url = `${CONFIG.ENDPOINTS.BOOKINGS || '/api/bookings'}?`;
            if (status) url += `status=${status}&`;
            if (date) url += `date=${date}&`;
            
            const data = await this.api.get(url);
            if (data.success && data.data) {
                this.appState.setBookings(data.data);
                this.renderTable();
            }
        } catch (error) {
            this.notifications.error(error.message, 'Ошибка фильтрации');
        }
    }

    edit(bookingId) {
        if (window.bookingModal) {
            window.bookingModal.showEdit(bookingId);
        } else {
            this.notifications.error('Модальное окно редактирования не инициализировано');
        }
    }

    async delete(bookingId) {
        if (!confirm('Удалить эту запись?')) {
            return;
        }

        try {
            const result = await this.api.delete(`${CONFIG.ENDPOINTS.BOOKINGS || '/api/bookings'}/${bookingId}`);
            if (result.success) {
                this.notifications.success('Запись удалена');
                await this.load();
            } else {
                this.notifications.error(result.error || 'Ошибка удаления');
            }
        } catch (error) {
            this.notifications.error(error.message);
        }
    }

    showBulkActionsModal() {
        if (this.selectedBookings.size === 0) {
            this.notifications.warning('Выберите записи для групповых действий');
            return;
        }

        // TODO: Реализовать модальное окно групповых действий
        this.notifications.info(`Выбрано записей: ${this.selectedBookings.size}. Групповые действия в разработке.`);
    }
}

