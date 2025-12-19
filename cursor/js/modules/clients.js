/**
 * Модуль управления клиентами
 */
class ClientsModule {
    constructor(api, appState, notifications) {
        this.api = api;
        this.appState = appState;
        this.notifications = notifications;
        this.selectedClient = null;
    }

    async load() {
        try {
            const data = await this.api.get(CONFIG.ENDPOINTS.CLIENTS);
            if (data.success && data.data) {
                this.appState.setClients(data.data);
                this.render();
                this.updateSelects();
            }
        } catch (error) {
            this.notifications.error(error.message, 'Ошибка загрузки клиентов');
        }
    }

    /**
     * Рендерит HTML-разметку модуля клиентов
     */
    render() {
        const tabContainer = document.getElementById('clients');
        if (!tabContainer) return;

        // Если базовая структура уже есть, просто обновляем список
        if (tabContainer.querySelector('#clientsList')) {
            this.renderList();
            return;
        }

        // Создаем базовую структуру
        tabContainer.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <div class="input-group">
                        <input type="text" class="form-control" id="clientSearch" placeholder="Поиск клиента по имени или телефону...">
                        <button class="btn btn-primary" onclick="window.searchClients()">
                            <i class="bi bi-search"></i> Найти
                        </button>
                    </div>
                </div>
                <div class="col-md-6 text-end">
                    <button class="btn btn-success" onclick="window.showAddClientModal()">
                        <i class="bi bi-plus-circle"></i> Добавить клиента
                    </button>
                    <button class="btn btn-outline-primary" onclick="window.exportClients()">
                        <i class="bi bi-download"></i> Экспорт
                    </button>
                </div>
            </div>

            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header bg-secondary text-white">
                            <h5 class="mb-0"><i class="bi bi-people"></i> Список клиентов</h5>
                        </div>
                        <div class="card-body">
                            <div id="clientsList" class="table-responsive">
                                <p class="text-center text-muted">Загрузка клиентов...</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header bg-info text-white">
                            <h5 class="mb-0"><i class="bi bi-person-badge"></i> Детали клиента</h5>
                        </div>
                        <div class="card-body">
                            <div id="clientDetails" class="text-center text-muted">
                                <i class="bi bi-person" style="font-size: 3rem;"></i>
                                <p>Выберите клиента для просмотра деталей</p>
                            </div>
                            <div id="clientActions" style="display: none;">
                                <hr>
                                <div class="d-grid gap-2">
                                    <button class="btn btn-outline-primary" onclick="window.showEditClientModal()">
                                        <i class="bi bi-pencil"></i> Редактировать
                                    </button>
                                    <button class="btn btn-outline-warning" onclick="window.showClientHistory()">
                                        <i class="bi bi-clock-history"></i> История посещений
                                    </button>
                                    <button class="btn btn-outline-success" onclick="window.createBookingForClient()">
                                        <i class="bi bi-calendar-plus"></i> Новая запись
                                    </button>
                                    <button class="btn btn-outline-danger" onclick="window.deleteClient()">
                                        <i class="bi bi-trash"></i> Удалить
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // После создания структуры загружаем данные
        this.loadData();
    }

    async loadData() {
        try {
            const data = await this.api.get(CONFIG.ENDPOINTS.CLIENTS);
            if (data.success && data.data) {
                this.appState.setClients(data.data);
                this.renderList();
                this.updateSelects();
            }
        } catch (error) {
            this.notifications.error(error.message, 'Ошибка загрузки клиентов');
        }
    }

    renderList() {
        const container = document.getElementById('clientsList');
        if (!container) return;

        const clients = this.appState.clients;

        if (clients.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">Нет клиентов</p>';
            return;
        }

        let html = '<table class="table table-hover">';
        html += `
            <thead>
                <tr>
                    <th>Имя</th>
                    <th>Телефон</th>
                    <th>Email</th>
                    <th>Последнее посещение</th>
                    <th>Всего записей</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
        `;

        clients.forEach(client => {
            html += `
                <tr onclick="window.clientsModule.selectClient(${client.id})" style="cursor: pointer;">
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="client-avatar me-2">
                                ${client.photo 
                                    ? `<img src="${escapeHtml(client.photo)}" alt="${escapeHtml(client.name)}" class="client-avatar">`
                                    : `<i class="bi bi-person"></i>`
                                }
                            </div>
                            <strong>${escapeHtml(client.name || 'Без имени')}</strong>
                        </div>
                    </td>
                    <td>${escapeHtml(client.phone || '—')}</td>
                    <td>${escapeHtml(client.email || '—')}</td>
                    <td>${client.last_visit ? formatDate(client.last_visit) : '—'}</td>
                    <td><span class="badge bg-info">${client.bookings_count || 0}</span></td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="window.clientsModule.edit(${client.id}, event)">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="window.clientsModule.delete(${client.id}, event)">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    selectClient(clientId) {
        const client = this.appState.clients.find(c => c.id == clientId);
        if (!client) return;

        this.selectedClient = client;
        this.appState.selectedClient = client;
        this.renderDetails(client);
    }

    renderDetails(client) {
        const container = document.getElementById('clientDetails');
        const actions = document.getElementById('clientActions');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center mb-3">
                <div class="client-avatar mx-auto mb-2">
                    ${client.photo 
                        ? `<img src="${escapeHtml(client.photo)}" alt="${escapeHtml(client.name)}" class="client-avatar">`
                        : `<i class="bi bi-person" style="font-size: 2rem;"></i>`
                    }
                </div>
                <h5>${escapeHtml(client.name || 'Без имени')}</h5>
            </div>
            <div class="list-group">
                <div class="list-group-item">
                    <strong>Телефон:</strong> ${escapeHtml(client.phone || '—')}
                </div>
                <div class="list-group-item">
                    <strong>Email:</strong> ${escapeHtml(client.email || '—')}
                </div>
                <div class="list-group-item">
                    <strong>Дата регистрации:</strong> ${client.created_at ? formatDate(client.created_at) : '—'}
                </div>
                <div class="list-group-item">
                    <strong>Последнее посещение:</strong> ${client.last_visit ? formatDate(client.last_visit) : '—'}
                </div>
                <div class="list-group-item">
                    <strong>Всего записей:</strong> <span class="badge bg-primary">${client.bookings_count || 0}</span>
                </div>
                ${client.source ? `
                <div class="list-group-item">
                    <strong>Источник:</strong> ${escapeHtml(this.getSourceLabel(client.source))}
                </div>
                ` : ''}
                ${client.telegram_id ? `
                <div class="list-group-item">
                    <strong>Telegram ID:</strong> <code>${escapeHtml(client.telegram_id)}</code>
                </div>
                ` : ''}
                ${client.notes ? `
                <div class="list-group-item">
                    <strong>Комментарий:</strong> <div class="mt-1">${escapeHtml(client.notes)}</div>
                </div>
                ` : ''}
            </div>
        `;

        if (actions) {
            actions.style.display = 'block';
        }
    }

    getSourceLabel(source) {
        const sources = {
            'telegram': 'Telegram (мини-приложение)',
            'website': 'Сайт',
            'phone': 'Телефонный звонок',
            'walk_in': 'Пришел сам',
            'referral': 'Рекомендация',
            'social_media': 'Социальные сети',
            'other': 'Другое'
        };
        return sources[source] || source;
    }

    async search(query) {
        if (!query || query.trim() === '') {
            this.render();
            return;
        }

        const clients = this.appState.clients;
        const filtered = clients.filter(client => {
            const name = (client.name || '').toLowerCase();
            const phone = (client.phone || '').toLowerCase();
            const email = (client.email || '').toLowerCase();
            const searchTerm = query.toLowerCase();
            
            return name.includes(searchTerm) || 
                   phone.includes(searchTerm) || 
                   email.includes(searchTerm);
        });

        const container = document.getElementById('clientsList');
        if (!container) return;

        if (filtered.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">Клиенты не найдены</p>';
            return;
        }

        // Используем тот же рендеринг, но с отфильтрованными данными
        let html = '<table class="table table-hover">';
        html += `
            <thead>
                <tr>
                    <th>Имя</th>
                    <th>Телефон</th>
                    <th>Email</th>
                    <th>Последнее посещение</th>
                    <th>Всего записей</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
        `;

        filtered.forEach(client => {
            html += `
                <tr onclick="window.clientsModule.selectClient(${client.id})" style="cursor: pointer;">
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="client-avatar me-2">
                                ${client.photo 
                                    ? `<img src="${escapeHtml(client.photo)}" alt="${escapeHtml(client.name)}" class="client-avatar">`
                                    : `<i class="bi bi-person"></i>`
                                }
                            </div>
                            <strong>${escapeHtml(client.name || 'Без имени')}</strong>
                        </div>
                    </td>
                    <td>${escapeHtml(client.phone || '—')}</td>
                    <td>${escapeHtml(client.email || '—')}</td>
                    <td>${client.last_visit ? formatDate(client.last_visit) : '—'}</td>
                    <td><span class="badge bg-info">${client.bookings_count || 0}</span></td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="window.clientsModule.edit(${client.id}, event)">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="window.clientsModule.delete(${client.id}, event)">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    showAddModal() {
        if (window.clientModal) {
            window.clientModal.showAdd();
        }
    }

    edit(clientId, event) {
        if (event) event.stopPropagation();
        if (window.clientModal) {
            window.clientModal.showEdit(clientId);
        }
    }

    async saveClient() {
        const form = document.getElementById('clientForm');
        if (!form || !form.checkValidity()) {
            if (form) form.reportValidity();
            return;
        }

        const clientData = {
            name: document.getElementById('clientName').value,
            phone: document.getElementById('clientPhone').value,
            email: document.getElementById('clientEmail').value,
            telegram_id: document.getElementById('clientTelegramId').value,
            birthday: document.getElementById('clientBirthday').value || null,
            source: document.getElementById('clientSource').value,
            notes: document.getElementById('clientNotes').value
        };

        // Фото
        const avatarInput = document.getElementById('clientAvatarInput');
        if (avatarInput && avatarInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = (e) => {
                clientData.photo = e.target.result;
                this.sendClientData(clientData, form);
            };
            reader.readAsDataURL(avatarInput.files[0]);
        } else {
            this.sendClientData(clientData, form);
        }
    }

    async sendClientData(clientData, form) {
        const editId = form ? form.dataset.editId : null;
        const url = editId ? `${CONFIG.ENDPOINTS.CLIENTS}/${editId}` : CONFIG.ENDPOINTS.CLIENTS;

        try {
            const result = editId 
                ? await this.api.put(url, clientData)
                : await this.api.post(url, clientData);

            if (result.success) {
                this.notifications.success(editId ? 'Клиент обновлен' : 'Клиент добавлен');
                await this.load();
                const modal = bootstrap.Modal.getInstance(document.getElementById('addClientModal'));
                if (modal) modal.hide();
            } else {
                this.notifications.error(result.error || 'Ошибка сохранения');
            }
        } catch (error) {
            this.notifications.error(error.message);
        }
    }

    async delete(clientId, event) {
        if (event) event.stopPropagation();

        if (!confirm('Удалить этого клиента? Все связанные записи будут сохранены.')) {
            return;
        }

        try {
            const result = await this.api.delete(`${CONFIG.ENDPOINTS.CLIENTS}/${clientId}`);
            if (result.success) {
                this.notifications.success('Клиент удален');
                await this.load();
            } else {
                this.notifications.error(result.error || 'Ошибка удаления');
            }
        } catch (error) {
            this.notifications.error(error.message);
        }
    }

    async showHistory(clientId) {
        try {
            // Загружаем историю записей клиента
            const result = await this.api.get(`${CONFIG.ENDPOINTS.CLIENTS}/${clientId}/bookings`);
            
            if (!result.success) {
                this.notifications.error(result.error || 'Ошибка загрузки истории');
                return;
            }

            const bookings = result.data || [];
            const client = this.appState.clients.find(c => c.id == clientId);
            const clientName = client ? client.name : 'Клиент';

            // Создаем модальное окно для истории
            this.renderHistoryModal(clientId, clientName, bookings);
        } catch (error) {
            this.notifications.error(error.message);
        }
    }

    renderHistoryModal(clientId, clientName, bookings) {
        // Создаем или обновляем модальное окно истории
        let historyModal = document.getElementById('clientHistoryModal');
        if (!historyModal) {
            historyModal = document.createElement('div');
            historyModal.id = 'clientHistoryModal';
            historyModal.className = 'modal fade';
            document.body.appendChild(historyModal);
        }

        let bookingsHtml = '';
        if (bookings.length === 0) {
            bookingsHtml = '<p class="text-center text-muted">У клиента пока нет записей</p>';
        } else {
            bookingsHtml = '<div class="table-responsive"><table class="table table-hover"><thead><tr><th>Дата</th><th>Время</th><th>Специалист</th><th>Услуга</th><th>Длительность</th><th>Статус</th><th>Сумма</th></tr></thead><tbody>';
            
            bookings.forEach(booking => {
                const date = booking.date ? new Date(booking.date + 'T00:00:00').toLocaleDateString('ru-RU', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                }) : '—';
                const time = booking.time ? (typeof booking.time === 'string' ? booking.time : booking.time.substring(0, 5)) : '—';
                const specialistName = booking.specialist_name || '—';
                const serviceName = booking.service_name || '—';
                const duration = booking.service_duration || booking.duration || '—';
                const status = booking.status || 'confirmed';
                const statusClass = {
                    'confirmed': 'success',
                    'completed': 'primary',
                    'cancelled': 'danger',
                    'no_show': 'warning'
                }[status] || 'secondary';
                const statusText = {
                    'confirmed': 'Подтверждена',
                    'completed': 'Завершена',
                    'cancelled': 'Отменена',
                    'no_show': 'Не явился'
                }[status] || status;
                const price = booking.price || booking.service_price ? `${booking.price || booking.service_price} ₽` : '—';

                bookingsHtml += `
                    <tr>
                        <td>${escapeHtml(date)}</td>
                        <td>${escapeHtml(time)}</td>
                        <td>${escapeHtml(specialistName)}</td>
                        <td>${escapeHtml(serviceName)}</td>
                        <td>${duration} мин</td>
                        <td><span class="badge bg-${statusClass}">${escapeHtml(statusText)}</span></td>
                        <td>${escapeHtml(price)}</td>
                    </tr>
                `;
            });
            
            bookingsHtml += '</tbody></table></div>';
        }

        historyModal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">История записей: ${escapeHtml(clientName)}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${bookingsHtml}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
                    </div>
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(historyModal);
        modal.show();
    }

    createBookingForClient(clientId) {
        // Переключаемся на вкладку бронирования и устанавливаем клиента
        const bookingTab = document.querySelector('a[href="#booking"]');
        if (bookingTab) {
            const tab = new bootstrap.Tab(bookingTab);
            tab.show();
            
            const clientSelect = document.getElementById('clientSelect');
            if (clientSelect) {
                clientSelect.value = clientId;
            }
        }
    }

    updateSelects() {
        const select = document.getElementById('clientSelect');
        if (!select) return;

        select.innerHTML = '<option value="">Новый клиент</option>';
        this.appState.clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = `${escapeHtml(client.name || 'Без имени')} (${escapeHtml(client.phone || '')})`;
            select.appendChild(option);
        });
    }

    async export() {
        // TODO: Реализовать экспорт клиентов
        this.notifications.info('Функция экспорта клиентов в разработке');
    }
}
