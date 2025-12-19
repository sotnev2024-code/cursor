/**
 * Модуль модального окна редактирования записи
 */
class BookingModal {
    constructor(bookingsListModule) {
        this.modalElement = document.getElementById('editBookingModal');
        this.bookingsListModule = bookingsListModule;
        this.currentBooking = null;
        this.render();
    }

    /**
     * Рендерит HTML-разметку модального окна
     */
    render() {
        if (!this.modalElement) return;

        this.modalElement.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Редактирование записи</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="bookingEditForm">
                            <!-- Информация о клиенте (только для просмотра) -->
                            <div class="mb-3">
                                <label class="form-label">Клиент</label>
                                <input type="text" class="form-control" id="editClientName" readonly>
                            </div>

                            <!-- Услуга (только для просмотра) -->
                            <div class="mb-3">
                                <label class="form-label">Услуга</label>
                                <input type="text" class="form-control" id="editServiceName" readonly>
                            </div>

                            <!-- Специалист -->
                            <div class="mb-3">
                                <label class="form-label">Специалист *</label>
                                <select class="form-select" id="editSpecialist" required onchange="window.bookingModal.onSpecialistChange()">
                                    <option value="">Загрузка...</option>
                                </select>
                                <div class="form-text" id="editSpecialistInfo"></div>
                            </div>

                            <!-- Дата -->
                            <div class="mb-3">
                                <label class="form-label">Дата *</label>
                                <div id="editAvailableDatesContainer" class="d-flex flex-wrap gap-2 mb-2">
                                    <div class="text-muted">Загрузка доступных дат...</div>
                                </div>
                                <input type="date" class="form-control" id="editBookingDate" required onchange="window.bookingModal.onDateChange()">
                            </div>

                            <!-- Время -->
                            <div class="mb-3">
                                <label class="form-label">Время *</label>
                                <div id="editAvailableTimesContainer" class="d-flex flex-wrap gap-2 mb-2">
                                    <div class="text-muted">Сначала выберите дату</div>
                                </div>
                                <input type="time" class="form-control" id="editBookingTime" required>
                            </div>

                            <!-- Статус -->
                            <div class="mb-3">
                                <label class="form-label">Статус</label>
                                <select class="form-select" id="editBookingStatus">
                                    <option value="PENDING">Ожидает</option>
                                    <option value="CONFIRMED">Подтверждена</option>
                                    <option value="HOLD">Ожидание</option>
                                    <option value="CANCELLED">Отменена</option>
                                    <option value="COMPLETED">Завершена</option>
                                </select>
                            </div>

                            <!-- Комментарий -->
                            <div class="mb-3">
                                <label class="form-label">Комментарий</label>
                                <textarea class="form-control" id="editBookingComment" rows="3"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                        <button type="button" class="btn btn-primary" onclick="window.bookingModal.save()">
                            <i class="bi bi-check-circle"></i> Сохранить изменения
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Показывает модальное окно для редактирования записи
     */
    async showEdit(bookingId) {
        try {
            // Загружаем данные записи
            const result = await this.bookingsListModule.api.get(`${CONFIG.ENDPOINTS.BOOKINGS}/${bookingId}`);
            if (!result.success || !result.data) {
                this.bookingsListModule.notifications.error('Не удалось загрузить данные записи');
                return;
            }

            this.currentBooking = result.data;
            this.fillForm();
            
            // Загружаем специалистов для этой услуги
            await this.loadSpecialistsForService(this.currentBooking.service_id);
            
            // Загружаем доступные даты для текущего специалиста (после заполнения формы)
            setTimeout(async () => {
                await this.loadAvailableDates();
                // Если дата уже выбрана, загружаем доступное время
                const dateInput = document.getElementById('editBookingDate');
                if (dateInput && dateInput.value) {
                    await this.loadAvailableTimes();
                }
            }, 100);

            // Показываем модальное окно
            const modal = new bootstrap.Modal(this.modalElement);
            modal.show();
        } catch (error) {
            this.bookingsListModule.notifications.error(error.message || 'Ошибка загрузки записи');
        }
    }

    /**
     * Заполняет форму данными записи
     */
    fillForm() {
        if (!this.currentBooking) return;

        const clientNameInput = document.getElementById('editClientName');
        const serviceNameInput = document.getElementById('editServiceName');
        const specialistSelect = document.getElementById('editSpecialist');
        const dateInput = document.getElementById('editBookingDate');
        const timeInput = document.getElementById('editBookingTime');
        const statusSelect = document.getElementById('editBookingStatus');
        const commentTextarea = document.getElementById('editBookingComment');

        if (clientNameInput) {
            clientNameInput.value = this.currentBooking.client_name || '—';
        }
        if (serviceNameInput) {
            serviceNameInput.value = this.currentBooking.service_name || '—';
        }
        if (specialistSelect) {
            specialistSelect.value = this.currentBooking.specialist_id || '';
        }
        if (dateInput) {
            dateInput.value = this.currentBooking.date || '';
        }
        if (timeInput) {
            timeInput.value = this.currentBooking.time || '';
        }
        if (statusSelect) {
            statusSelect.value = this.currentBooking.status || 'PENDING';
        }
        if (commentTextarea) {
            commentTextarea.value = this.currentBooking.comment || '';
        }
    }

    /**
     * Загружает специалистов, которые могут выполнить данную услугу
     */
    async loadSpecialistsForService(serviceId) {
        const specialistSelect = document.getElementById('editSpecialist');
        if (!specialistSelect) return;

        specialistSelect.innerHTML = '<option value="">Загрузка специалистов...</option>';

        try {
            const specialists = this.bookingsListModule.appState.specialists || [];
            
            // Фильтруем специалистов, которые предоставляют эту услугу
            const availableSpecialists = specialists.filter(specialist => {
                if (!specialist.is_active) return false;
                
                if (specialist.services && Array.isArray(specialist.services)) {
                    return specialist.services.some(s => {
                        const serviceIdToCheck = typeof s === 'object' ? s.id : s;
                        return serviceIdToCheck == serviceId;
                    });
                }
                return false;
            });

            specialistSelect.innerHTML = '<option value="">Выберите специалиста</option>';
            
            if (availableSpecialists.length > 0) {
                availableSpecialists.forEach(specialist => {
                    const option = document.createElement('option');
                    option.value = specialist.id;
                    option.textContent = escapeHtml(specialist.name || 'Без имени');
                    if (specialist.id == this.currentBooking.specialist_id) {
                        option.selected = true;
                    }
                    specialistSelect.appendChild(option);
                });
            } else {
                // Если не найдено специалистов с услугой, показываем всех активных
                specialists.forEach(specialist => {
                    if (specialist.is_active) {
                        const option = document.createElement('option');
                        option.value = specialist.id;
                        option.textContent = escapeHtml(specialist.name || 'Без имени');
                        if (specialist.id == this.currentBooking.specialist_id) {
                            option.selected = true;
                        }
                        specialistSelect.appendChild(option);
                    }
                });
            }
        } catch (error) {
            console.error('Ошибка загрузки специалистов:', error);
            specialistSelect.innerHTML = '<option value="">Ошибка загрузки</option>';
        }
    }

    /**
     * Обработчик изменения специалиста
     */
    async onSpecialistChange() {
        const specialistSelect = document.getElementById('editSpecialist');
        const specialistId = specialistSelect?.value;
        
        if (specialistId) {
            const specialist = this.bookingsListModule.appState.specialists.find(s => s.id == specialistId);
            const infoDiv = document.getElementById('editSpecialistInfo');
            if (infoDiv && specialist) {
                infoDiv.innerHTML = `<small>${escapeHtml(specialist.position || '')}</small>`;
            }
            
            // Загружаем доступные даты для нового специалиста
            await this.loadAvailableDates();
        }
    }

    /**
     * Загружает доступные даты для выбранного специалиста и услуги
     */
    async loadAvailableDates() {
        const container = document.getElementById('editAvailableDatesContainer');
        const dateInput = document.getElementById('editBookingDate');
        if (!container || !dateInput) return;

        const specialistSelect = document.getElementById('editSpecialist');
        const specialistId = specialistSelect?.value;
        const serviceId = this.currentBooking?.service_id;

        if (!specialistId || !serviceId) {
            container.innerHTML = '<div class="text-muted">Выберите специалиста</div>';
            return;
        }

        container.innerHTML = '<div class="text-muted"><i class="bi bi-hourglass-split"></i> Загрузка доступных дат...</div>';

        try {
            const params = new URLSearchParams({
                service_id: serviceId,
                specialist_id: specialistId,
                start_date: new Date().toISOString().split('T')[0],
                days_ahead: '30'
            });

            const result = await this.bookingsListModule.api.get(`${CONFIG.ENDPOINTS.BOOKINGS}/available-dates?${params}`);
            
            if (result.success && result.data && result.data.length > 0) {
                container.innerHTML = '<small class="text-muted">Доступные даты:</small>';
                const sortedDates = result.data.sort();
                
                sortedDates.forEach(dateStr => {
                    const date = new Date(dateStr + 'T00:00:00');
                    const dateBtn = document.createElement('button');
                    dateBtn.type = 'button';
                    dateBtn.className = 'btn btn-sm btn-outline-primary';
                    dateBtn.textContent = date.toLocaleDateString('ru-RU', { 
                        weekday: 'short', 
                        day: 'numeric', 
                        month: 'short' 
                    });
                    dateBtn.onclick = () => {
                        dateInput.value = dateStr;
                        this.onDateChange();
                    };
                    container.appendChild(dateBtn);
                });
            } else {
                container.innerHTML = '<div class="text-warning"><small>Нет доступных дат</small></div>';
            }
        } catch (error) {
            console.error('Ошибка загрузки дат:', error);
            container.innerHTML = '<div class="text-danger"><small>Ошибка загрузки дат</small></div>';
        }
    }

    /**
     * Обработчик изменения даты
     */
    async onDateChange() {
        const dateInput = document.getElementById('editBookingDate');
        const date = dateInput?.value;
        
        if (!date) {
            const timesContainer = document.getElementById('editAvailableTimesContainer');
            if (timesContainer) {
                timesContainer.innerHTML = '<div class="text-muted">Сначала выберите дату</div>';
            }
            return;
        }

        await this.loadAvailableTimes();
    }

    /**
     * Загружает доступное время для выбранной даты, специалиста и услуги
     */
    async loadAvailableTimes() {
        const container = document.getElementById('editAvailableTimesContainer');
        const timeInput = document.getElementById('editBookingTime');
        if (!container || !timeInput) return;

        const specialistSelect = document.getElementById('editSpecialist');
        const dateInput = document.getElementById('editBookingDate');
        const specialistId = specialistSelect?.value;
        const date = dateInput?.value;
        const serviceId = this.currentBooking?.service_id;

        if (!specialistId || !date || !serviceId) {
            container.innerHTML = '<div class="text-muted">Заполните все поля</div>';
            return;
        }

        container.innerHTML = '<div class="text-muted"><i class="bi bi-hourglass-split"></i> Загрузка доступного времени...</div>';

        try {
            const params = new URLSearchParams({
                service_id: serviceId,
                specialist_id: specialistId,
                date: date
            });

            const result = await this.bookingsListModule.api.get(`${CONFIG.ENDPOINTS.BOOKINGS}/available-times?${params}`);
            
            if (result.success && result.data && result.data.length > 0) {
                container.innerHTML = '<small class="text-muted">Доступное время:</small>';
                
                result.data.forEach(timeSlot => {
                    const timeBtn = document.createElement('button');
                    timeBtn.type = 'button';
                    timeBtn.className = 'btn btn-sm btn-outline-success';
                    timeBtn.textContent = timeSlot.time;
                    timeBtn.onclick = () => {
                        timeInput.value = timeSlot.time;
                    };
                    container.appendChild(timeBtn);
                });
            } else {
                container.innerHTML = '<div class="text-warning"><small>Нет доступного времени для выбранной даты</small></div>';
            }
        } catch (error) {
            console.error('Ошибка загрузки времени:', error);
            container.innerHTML = '<div class="text-danger"><small>Ошибка загрузки времени</small></div>';
        }
    }

    /**
     * Сохраняет изменения записи
     */
    async save() {
        const specialistSelect = document.getElementById('editSpecialist');
        const dateInput = document.getElementById('editBookingDate');
        const timeInput = document.getElementById('editBookingTime');
        const statusSelect = document.getElementById('editBookingStatus');
        const commentTextarea = document.getElementById('editBookingComment');

        if (!specialistSelect || !dateInput || !timeInput) {
            this.bookingsListModule.notifications.error('Не все поля заполнены');
            return;
        }

        const specialistId = parseInt(specialistSelect.value);
        const date = dateInput.value;
        const time = timeInput.value;
        const status = statusSelect?.value || 'PENDING';
        const comment = commentTextarea?.value || '';

        if (!specialistId || !date || !time) {
            this.bookingsListModule.notifications.error('Заполните все обязательные поля');
            return;
        }

        try {
            const result = await this.bookingsListModule.api.put(
                `${CONFIG.ENDPOINTS.BOOKINGS}/${this.currentBooking.id}`,
                {
                    specialist_id: specialistId,
                    date: date,
                    time: time,
                    status: status,
                    comment: comment,
                    // Сохраняем остальные поля без изменений
                    client_id: this.currentBooking.client_id,
                    service_id: this.currentBooking.service_id,
                    duration: this.currentBooking.duration,
                    price: this.currentBooking.price
                }
            );

            if (result.success) {
                this.bookingsListModule.notifications.success('Запись успешно обновлена');
                
                // Закрываем модальное окно
                const modal = bootstrap.Modal.getInstance(this.modalElement);
                if (modal) {
                    modal.hide();
                }
                
                // Обновляем список записей
                await this.bookingsListModule.load();
            } else {
                this.bookingsListModule.notifications.error(result.error || 'Ошибка обновления записи');
            }
        } catch (error) {
            this.bookingsListModule.notifications.error(error.message || 'Ошибка обновления записи');
        }
    }
}

