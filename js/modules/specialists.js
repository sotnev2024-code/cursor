/**
 * Модуль управления специалистами
 */
class SpecialistsModule {
    constructor(api, appState, notifications) {
        this.api = api;
        this.appState = appState;
        this.notifications = notifications;
        this.currentRating = 0;
    }

    async load() {
        try {
            // Если контейнер пустой, сначала рендерим разметку
            const tabContainer = document.getElementById('specialists');
            if (tabContainer && !tabContainer.querySelector('#specialistsGrid')) {
                this.render();
                return; // render() уже вызывает load()
            }

            const data = await this.api.get(CONFIG.ENDPOINTS.SPECIALISTS);
            if (data.success && data.data) {
                this.appState.setSpecialists(data.data);
                this.renderList();
                this.updateSelects();
            }
        } catch (error) {
            this.notifications.error(error.message, 'Ошибка загрузки специалистов');
        }
    }

    /**
     * Рендерит HTML-разметку модуля специалистов
     */
    render() {
        const tabContainer = document.getElementById('specialists');
        if (!tabContainer) return;

        // Если базовая структура уже есть, просто обновляем список
        if (tabContainer.querySelector('#specialistsGrid')) {
            this.renderList();
            return;
        }

        // Создаем базовую структуру
        tabContainer.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-8">
                    <div class="input-group">
                        <input type="text" class="form-control" id="specialistSearch" placeholder="Поиск специалиста...">
                        <button class="btn btn-primary" onclick="window.searchSpecialists()">
                            <i class="bi bi-search"></i> Найти
                        </button>
                    </div>
                </div>
                <div class="col-md-4 text-end">
                    <button class="btn btn-success" onclick="window.showAddSpecialistModal()">
                        <i class="bi bi-plus-circle"></i> Добавить специалиста
                    </button>
                    <button class="btn btn-outline-primary" onclick="window.exportSpecialists()">
                        <i class="bi bi-download"></i> Экспорт
                    </button>
                </div>
            </div>

            <div class="row">
                <div class="col-md-8">
                    <div class="row" id="specialistsGrid">
                        <div class="col-md-12 text-center text-muted py-5">
                            <i class="bi bi-person-badge" style="font-size: 3rem;"></i>
                            <p>Загрузка специалистов...</p>
                        </div>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0"><i class="bi bi-graph-up"></i> Статистика специалистов</h5>
                        </div>
                        <div class="card-body">
                            <div id="specialistsStats">
                                <p class="text-center text-muted">Загрузка статистики...</p>
                            </div>
                        </div>
                    </div>

                    <div class="card mt-3">
                        <div class="card-header bg-success text-white">
                            <h5 class="mb-0"><i class="bi bi-calendar-check"></i> Расписание на сегодня</h5>
                        </div>
                        <div class="card-body">
                            <div id="todaySchedule">
                                <p class="text-center text-muted">Загрузка расписания...</p>
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
            const data = await this.api.get(CONFIG.ENDPOINTS.SPECIALISTS);
            if (data.success && data.data) {
                this.appState.setSpecialists(data.data);
                this.renderList();
                this.updateSelects();
                this.loadStats();
                this.loadTodaySchedule();
            }
        } catch (error) {
            this.notifications.error(error.message, 'Ошибка загрузки специалистов');
        }
    }

    renderList() {
        const container = document.getElementById('specialistsGrid');
        if (!container) return;

        const specialists = this.appState.specialists;

        if (specialists.length === 0) {
            container.innerHTML = `
                <div class="col-md-12 text-center text-muted py-5">
                    <i class="bi bi-person-badge" style="font-size: 3rem;"></i>
                    <p>Нет специалистов</p>
                    <button class="btn btn-success mt-2" onclick="window.specialistsModule.showAddModal()">
                        <i class="bi bi-plus-circle"></i> Добавить первого специалиста
                    </button>
                </div>
            `;
            return;
        }

        let html = '';
        specialists.forEach(specialist => {
            const rating = specialist.rating || 0;
            const ratingStars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
            const servicesCount = specialist.services ? specialist.services.length : 0;
            const photo = specialist.photo 
                ? `<img src="${escapeHtml(specialist.photo)}" alt="${escapeHtml(specialist.name)}" class="specialist-avatar">`
                : `<i class="bi bi-person" style="font-size: 2rem; line-height: 74px;"></i>`;

            html += `
                <div class="col-md-4 mb-3">
                    <div class="card specialist-card h-100" onclick="window.specialistsModule.selectSpecialist(${specialist.id})">
                        <div class="card-body">
                            <div class="d-flex align-items-start mb-3">
                                <div class="specialist-avatar me-3">
                                    ${photo}
                                </div>
                                <div class="flex-grow-1">
                                    <h5 class="card-title mb-1">${escapeHtml(specialist.name)}</h5>
                                    <p class="text-muted mb-1">${escapeHtml(specialist.position || 'Специалист')}</p>
                                    <div class="star-rating mb-2">${ratingStars}</div>
                                </div>
                            </div>
                            <p class="card-text small text-muted mb-2">
                                <i class="bi bi-clock"></i> ${specialist.start_time || '09:00'} - ${specialist.end_time || '18:00'}
                            </p>
                            <p class="card-text small mb-2">
                                <i class="bi bi-scissors"></i> ${servicesCount} услуг
                            </p>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="badge ${specialist.is_active ? 'bg-success' : 'bg-secondary'}">
                                    ${specialist.is_active ? 'Активен' : 'Неактивен'}
                                </span>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary" onclick="window.specialistsModule.edit(${specialist.id}, event)">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button class="btn btn-outline-danger" onclick="window.specialistsModule.delete(${specialist.id}, event)">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        this.loadStats();
        this.loadTodaySchedule();
    }

    selectSpecialist(specialistId) {
        const specialist = this.appState.specialists.find(s => s.id == specialistId);
        if (specialist) {
            this.appState.selectedSpecialist = specialist;
            this.notifications.info(`${specialist.name} выбран для просмотра`, 'Специалист выбран');
        }
    }

    showAddModal() {
        if (window.specialistModal) {
            window.specialistModal.showAdd();
        }
    }

    edit(specialistId, event) {
        if (event) event.stopPropagation();
        if (window.specialistModal) {
            window.specialistModal.showEdit(specialistId);
        }
    }

    setRating(rating) {
        if (window.specialistModal) {
            window.specialistModal.setRating(rating);
        }
    }

    updateRatingStars() {
        if (window.specialistModal) {
            window.specialistModal.updateRatingStars();
        }
    }

    previewAvatar(event) {
        if (window.specialistModal) {
            window.specialistModal.previewAvatar(event);
        }
    }

    async loadServicesForSpecialist(selectedServices = []) {
        try {
            const data = await this.api.get(CONFIG.ENDPOINTS.SERVICES);
            const container = document.getElementById('specialistServicesList');
            if (!container) return;

            if (data.success && data.data) {
                let html = '<div class="row">';
                data.data.forEach(service => {
                    const isSelected = selectedServices.some(s => s.id == service.id);
                    html += `
                        <div class="col-md-6 mb-2">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox"
                                       id="service_${service.id}"
                                       value="${service.id}"
                                       ${isSelected ? 'checked' : ''}>
                                <label class="form-check-label" for="service_${service.id}">
                                    ${escapeHtml(service.name)} (${service.duration} мин)
                                </label>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
                container.innerHTML = html;
            }
        } catch (error) {
            console.error('Ошибка загрузки услуг:', error);
        }
    }

    async save() {
        const form = document.getElementById('specialistForm');
        if (!form || !form.checkValidity()) {
            if (form) form.reportValidity();
            return;
        }

        const specialistData = {
            name: document.getElementById('specialistName').value,
            position: document.getElementById('specialistPosition').value,
            description: document.getElementById('specialistDescription').value,
            phone: document.getElementById('specialistPhone').value,
            email: document.getElementById('specialistEmail').value,
            start_time: document.getElementById('specialistStartTime').value,
            end_time: document.getElementById('specialistEndTime').value,
            step: parseInt(document.getElementById('specialistStep').value) || 30,
            rating: parseFloat(document.getElementById('specialistRating').value) || 0,
            comment: document.getElementById('specialistComment').value,
            schedule_type: document.getElementById('specialistScheduleType').value || '5x2',
            is_active: true
        };

        // Дата начала рабочей недели для графиков 5x2 и 2x2
        const scheduleType = specialistData.schedule_type;
        if (scheduleType === '5x2' || scheduleType === '2x2') {
            const scheduleStartDate = document.getElementById('scheduleStartDate');
            if (scheduleStartDate && scheduleStartDate.value) {
                specialistData.schedule_start_date = scheduleStartDate.value;
            } else {
                this.notifications.error('Выберите дату начала рабочей недели');
                return;
            }
        } else {
            specialistData.schedule_start_date = null;
        }

        // Даты работы для свободного графика
        if (scheduleType === 'flexible') {
            if (window.specialistModal) {
                specialistData.work_dates = window.specialistModal.getWorkDates();
            } else {
                specialistData.work_dates = [];
            }
        } else {
            specialistData.work_dates = [];
        }

        // Услуги (преобразуем значения в числа)
        const selectedServices = [];
        document.querySelectorAll('#specialistServicesList input[type="checkbox"]:checked').forEach(checkbox => {
            selectedServices.push(parseInt(checkbox.value));
        });
        specialistData.services = selectedServices;

        // Фото
        const avatarInput = document.getElementById('avatarInput');
        if (avatarInput && avatarInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = (e) => {
                specialistData.photo = e.target.result;
                this.sendData(specialistData);
            };
            reader.readAsDataURL(avatarInput.files[0]);
        } else {
            this.sendData(specialistData);
        }
    }

    async sendData(specialistData) {
        const form = document.getElementById('specialistForm');
        const editId = form ? form.dataset.editId : null;
        const method = editId ? 'PUT' : 'POST';
        const url = editId ? `${CONFIG.ENDPOINTS.SPECIALISTS}/${editId}` : CONFIG.ENDPOINTS.SPECIALISTS;

        try {
            const result = editId 
                ? await this.api.put(url, specialistData)
                : await this.api.post(url, specialistData);

            if (result.success) {
                this.notifications.success(editId ? 'Специалист обновлен' : 'Специалист добавлен');
                await this.loadData();
                const modal = bootstrap.Modal.getInstance(document.getElementById('addSpecialistModal'));
                if (modal) modal.hide();
            } else {
                this.notifications.error(result.error || 'Ошибка сохранения');
            }
        } catch (error) {
            this.notifications.error(error.message);
        }
    }

    async delete(specialistId, event) {
        if (event) event.stopPropagation();

        if (!confirm('Удалить этого специалиста? Все связанные записи будут отменены.')) {
            return;
        }

        try {
            const result = await this.api.delete(`${CONFIG.ENDPOINTS.SPECIALISTS}/${specialistId}`);
            if (result.success) {
                this.notifications.success('Специалист удален');
                await this.loadData();
            } else {
                this.notifications.error(result.error || 'Ошибка удаления');
            }
        } catch (error) {
            this.notifications.error(error.message);
        }
    }

    loadStats() {
        const container = document.getElementById('specialistsStats');
        if (!container) return;

        const specialists = this.appState.specialists;
        const activeSpecialists = specialists.filter(s => s.is_active).length;
        const totalServices = specialists.reduce((sum, s) => sum + (s.services ? s.services.length : 0), 0);
        const avgRating = specialists.length > 0 
            ? specialists.reduce((sum, s) => sum + (s.rating || 0), 0) / specialists.length 
            : 0;

        container.innerHTML = `
            <div class="list-group">
                <div class="list-group-item d-flex justify-content-between">
                    <span>Всего специалистов:</span>
                    <strong>${specialists.length}</strong>
                </div>
                <div class="list-group-item d-flex justify-content-between">
                    <span>Активных:</span>
                    <strong class="text-success">${activeSpecialists}</strong>
                </div>
                <div class="list-group-item d-flex justify-content-between">
                    <span>Средний рейтинг:</span>
                    <strong class="text-warning">${avgRating.toFixed(1)} ★</strong>
                </div>
                <div class="list-group-item d-flex justify-content-between">
                    <span>Всего услуг:</span>
                    <strong>${totalServices}</strong>
                </div>
            </div>
        `;
    }

    loadTodaySchedule() {
        const today = new Date().toISOString().split('T')[0];
        const container = document.getElementById('todaySchedule');
        if (!container) return;

        let html = '<div class="list-group">';
        this.appState.specialists.forEach(specialist => {
            const isWorking = true; // TODO: Заменить на реальную проверку
            html += `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="workday-indicator ${isWorking ? 'working' : 'dayoff'}"></span>
                            <strong>${escapeHtml(specialist.name)}</strong>
                        </div>
                        <small class="text-muted">${specialist.start_time || '09:00'}-${specialist.end_time || '18:00'}</small>
                    </div>
                    <small class="text-muted">${isWorking ? 'Рабочий день' : 'Выходной'}</small>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    updateSelects() {
        const select = document.getElementById('specialistSelect');
        if (!select) return;

        select.innerHTML = '<option value="">Выберите специалиста</option><option value="any">Любой специалист</option>';
        this.appState.specialists.forEach(specialist => {
            const option = document.createElement('option');
            option.value = specialist.id;
            option.textContent = `${escapeHtml(specialist.name)} (${escapeHtml(specialist.position || 'Специалист')})`;
            select.appendChild(option);
        });

        // Фильтр в календаре
        const calendarFilter = document.getElementById('calendarSpecialistFilter');
        if (calendarFilter) {
            calendarFilter.innerHTML = '<option value="">Все специалисты</option>';
            this.appState.specialists.forEach(specialist => {
                const option = document.createElement('option');
                option.value = specialist.id;
                option.textContent = escapeHtml(specialist.name);
                calendarFilter.appendChild(option);
            });
        }
    }
}

