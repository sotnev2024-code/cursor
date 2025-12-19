/**
 * Модуль модального окна специалиста
 */
class SpecialistModal {
    constructor(specialistsModule) {
        this.modalElement = document.getElementById('addSpecialistModal');
        this.specialistsModule = specialistsModule;
        this.currentRating = 0;
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
                        <h5 class="modal-title">Добавление специалиста</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="specialistForm">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3 text-center">
                                        <div class="specialist-avatar mx-auto mb-3" id="avatarPreview">
                                            <i class="bi bi-person" style="font-size: 2rem;"></i>
                                        </div>
                                        <button type="button" class="btn btn-sm btn-outline-secondary" onclick="document.getElementById('avatarInput').click()">
                                            <i class="bi bi-upload"></i> Загрузить фото
                                        </button>
                                        <input type="file" id="avatarInput" accept="image/*" style="display: none;" onchange="window.specialistModal.previewAvatar(event)">
                                    </div>
                                </div>
                                <div class="col-md-8">
                                    <div class="mb-3">
                                        <label class="form-label">ФИО *</label>
                                        <input type="text" class="form-control" id="specialistName" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Должность *</label>
                                        <input type="text" class="form-control" id="specialistPosition" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Описание</label>
                                        <textarea class="form-control" id="specialistDescription" rows="3"></textarea>
                                    </div>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Телефон</label>
                                        <input type="tel" class="form-control" id="specialistPhone">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Email</label>
                                        <input type="email" class="form-control" id="specialistEmail">
                                    </div>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">График работы</label>
                                        <div class="input-group mb-2">
                                            <input type="time" class="form-control" id="specialistStartTime" value="09:00">
                                            <span class="input-group-text">до</span>
                                            <input type="time" class="form-control" id="specialistEndTime" value="18:00">
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Шаг записи (мин)</label>
                                        <select class="form-select" id="specialistStep">
                                            <option value="15">15 минут</option>
                                            <option value="30">30 минут</option>
                                            <option value="45">45 минут</option>
                                            <option value="60">60 минут</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Тип графика работы *</label>
                                <select class="form-select" id="specialistScheduleType" onchange="window.specialistModal.onScheduleTypeChange()">
                                    <option value="5x2">5x2 (5 рабочих дней, 2 выходных)</option>
                                    <option value="2x2">2x2 (2 рабочих дня, 2 выходных)</option>
                                    <option value="flexible">Свободный график (выбор дат)</option>
                                </select>
                            </div>

                            <div class="mb-3" id="scheduleStartDateContainer" style="display: none;">
                                <label class="form-label">Дата начала рабочей недели *</label>
                                <input type="date" class="form-control" id="scheduleStartDate" min="" required>
                                <small class="form-text text-muted">Выберите дату, с которой начинается рабочий цикл</small>
                            </div>

                            <div class="mb-3" id="flexibleScheduleContainer" style="display: none;">
                                <label class="form-label">Выберите даты работы</label>
                                <div class="border rounded p-3">
                                    <div class="mb-2">
                                        <input type="date" class="form-control" id="workDateInput" min="">
                                        <button type="button" class="btn btn-sm btn-primary mt-2" onclick="window.specialistModal.addWorkDate()">
                                            <i class="bi bi-plus"></i> Добавить дату
                                        </button>
                                    </div>
                                    <div id="workDatesList" class="mt-3">
                                        <p class="text-muted small">Выберите даты работы для свободного графика</p>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Рейтинг</label>
                                <div class="star-rating" id="ratingStars">
                                    <i class="bi bi-star" onclick="window.specialistModal.setRating(1)"></i>
                                    <i class="bi bi-star" onclick="window.specialistModal.setRating(2)"></i>
                                    <i class="bi bi-star" onclick="window.specialistModal.setRating(3)"></i>
                                    <i class="bi bi-star" onclick="window.specialistModal.setRating(4)"></i>
                                    <i class="bi bi-star" onclick="window.specialistModal.setRating(5)"></i>
                                </div>
                                <input type="hidden" id="specialistRating" value="0">
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Услуги специалиста</label>
                                <div id="specialistServicesList" class="border rounded p-3" style="max-height: 200px; overflow-y: auto;">
                                    <p class="text-muted">Загрузка услуг...</p>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Комментарий</label>
                                <textarea class="form-control" id="specialistComment" rows="2"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                        <button type="button" class="btn btn-primary" onclick="window.specialistsModule.save()">Сохранить специалиста</button>
                    </div>
                </div>
            </div>
        `;

        // Обновляем ссылку на форму
        this.form = document.getElementById('specialistForm');
    }

    /**
     * Показать модальное окно для добавления нового специалиста
     */
    showAdd() {
        this.currentRating = 0;
        this.workDates = [];
        if (this.form) {
            this.form.reset();
            this.form.removeAttribute('data-edit-id');
        }
        
        const avatarPreview = document.getElementById('avatarPreview');
        if (avatarPreview) {
            avatarPreview.innerHTML = '<i class="bi bi-person" style="font-size: 2rem;"></i>';
        }
        
        // Устанавливаем минимальную дату на сегодня
        const dateInput = document.getElementById('workDateInput');
        if (dateInput) {
            dateInput.min = new Date().toISOString().split('T')[0];
        }
        
        // Устанавливаем минимальную дату для начала рабочей недели
        const scheduleStartDate = document.getElementById('scheduleStartDate');
        if (scheduleStartDate) {
            scheduleStartDate.min = new Date().toISOString().split('T')[0];
            scheduleStartDate.value = '';
        }
        
        // Сбрасываем тип графика
        const scheduleType = document.getElementById('specialistScheduleType');
        if (scheduleType) {
            scheduleType.value = '5x2';
            this.onScheduleTypeChange();
        }
        
        this.updateRatingStars();
        this.updateWorkDatesList();
        
        // Загружаем список услуг для выбора
        if (this.specialistsModule) {
            this.specialistsModule.loadServicesForSpecialist();
        }
        
        if (this.modalElement) {
            const modal = new bootstrap.Modal(this.modalElement);
            modal.show();
        }
    }

    /**
     * Показать модальное окно для редактирования специалиста
     */
    showEdit(specialistId) {
        if (!window.specialistsModule) return;
        
        const specialists = window.specialistsModule.appState?.specialists || [];
        const specialist = specialists.find(s => s.id == specialistId);
        if (!specialist) return;

        // Заполняем форму данными специалиста
        const elements = {
            name: document.getElementById('specialistName'),
            position: document.getElementById('specialistPosition'),
            description: document.getElementById('specialistDescription'),
            phone: document.getElementById('specialistPhone'),
            email: document.getElementById('specialistEmail'),
            startTime: document.getElementById('specialistStartTime'),
            endTime: document.getElementById('specialistEndTime'),
            step: document.getElementById('specialistStep'),
            comment: document.getElementById('specialistComment'),
            rating: document.getElementById('specialistRating'),
            avatarPreview: document.getElementById('avatarPreview')
        };

        if (elements.name) elements.name.value = specialist.name || '';
        if (elements.position) elements.position.value = specialist.position || '';
        if (elements.description) elements.description.value = specialist.description || '';
        if (elements.phone) elements.phone.value = specialist.phone || '';
        if (elements.email) elements.email.value = specialist.email || '';
        if (elements.startTime) elements.startTime.value = specialist.start_time || '09:00';
        if (elements.endTime) elements.endTime.value = specialist.end_time || '18:00';
        if (elements.step) elements.step.value = specialist.step || '30';
        if (elements.comment) elements.comment.value = specialist.comment || '';

        // Устанавливаем рейтинг
        this.currentRating = specialist.rating || 0;
        if (elements.rating) elements.rating.value = this.currentRating;
        this.updateRatingStars();

        // Устанавливаем тип графика
        const scheduleType = document.getElementById('specialistScheduleType');
        if (scheduleType) {
            scheduleType.value = specialist.schedule_type || '5x2';
            this.onScheduleTypeChange();
        }
        
        // Устанавливаем дату начала рабочей недели
        const scheduleStartDate = document.getElementById('scheduleStartDate');
        if (scheduleStartDate && specialist.schedule_start_date) {
            scheduleStartDate.value = specialist.schedule_start_date;
        }

        // Устанавливаем даты работы для свободного графика
        this.workDates = specialist.work_dates || [];
        this.updateWorkDatesList();

        // Загружаем фото
        if (elements.avatarPreview && specialist.photo) {
            elements.avatarPreview.innerHTML = 
                `<img src="${escapeHtml(specialist.photo)}" alt="${escapeHtml(specialist.name)}" class="specialist-avatar">`;
        }

        // Загружаем услуги специалиста
        if (this.specialistsModule) {
            this.specialistsModule.loadServicesForSpecialist(specialist.services || []);
        }

        // Сохраняем ID для обновления
        if (this.form) {
            this.form.dataset.editId = specialistId;
        }

        if (this.modalElement) {
            const modal = new bootstrap.Modal(this.modalElement);
            modal.show();
        }
    }

    /**
     * Обновить отображение звезд рейтинга
     */
    updateRatingStars() {
        const stars = document.querySelectorAll('#ratingStars i');
        stars.forEach((star, index) => {
            if (index < this.currentRating) {
                star.className = 'bi bi-star-fill';
            } else {
                star.className = 'bi bi-star';
            }
            star.style.color = '#ffc107';
        });
    }

    /**
     * Установить рейтинг
     */
    setRating(rating) {
        this.currentRating = rating;
        const ratingInput = document.getElementById('specialistRating');
        if (ratingInput) {
            ratingInput.value = rating;
        }
        this.updateRatingStars();
    }

    /**
     * Предпросмотр аватара
     */
    previewAvatar(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const avatarPreview = document.getElementById('avatarPreview');
                if (avatarPreview) {
                    avatarPreview.innerHTML = 
                        `<img src="${escapeHtml(e.target.result)}" alt="Preview" class="specialist-avatar">`;
                }
            };
            reader.readAsDataURL(file);
        }
    }

    /**
     * Обработчик изменения типа графика
     */
    onScheduleTypeChange() {
        const scheduleType = document.getElementById('specialistScheduleType');
        const scheduleStartDateContainer = document.getElementById('scheduleStartDateContainer');
        const scheduleStartDate = document.getElementById('scheduleStartDate');
        const flexibleContainer = document.getElementById('flexibleScheduleContainer');
        
        if (!scheduleType) return;
        
        const selectedType = scheduleType.value;
        
        // Показываем/скрываем контейнер даты начала для графиков 5x2 и 2x2
        if (scheduleStartDateContainer && scheduleStartDate) {
            if (selectedType === '5x2' || selectedType === '2x2') {
                scheduleStartDateContainer.style.display = 'block';
                scheduleStartDate.required = true;
            } else {
                scheduleStartDateContainer.style.display = 'none';
                scheduleStartDate.required = false;
                scheduleStartDate.value = '';
            }
        }
        
        // Показываем/скрываем контейнер свободного графика
        if (flexibleContainer) {
            if (selectedType === 'flexible') {
                flexibleContainer.style.display = 'block';
            } else {
                flexibleContainer.style.display = 'none';
            }
        }
    }

    /**
     * Добавить дату работы для свободного графика
     */
    addWorkDate() {
        const dateInput = document.getElementById('workDateInput');
        if (!dateInput || !dateInput.value) {
            alert('Выберите дату');
            return;
        }

        const date = dateInput.value;
        
        // Проверяем, не добавлена ли уже эта дата
        if (this.workDates.includes(date)) {
            alert('Эта дата уже добавлена');
            return;
        }

        this.workDates.push(date);
        this.workDates.sort(); // Сортируем даты
        dateInput.value = ''; // Очищаем поле ввода
        
        this.updateWorkDatesList();
    }

    /**
     * Удалить дату работы
     */
    removeWorkDate(date) {
        this.workDates = this.workDates.filter(d => d !== date);
        this.updateWorkDatesList();
    }

    /**
     * Обновить список дат работы
     */
    updateWorkDatesList() {
        const container = document.getElementById('workDatesList');
        if (!container) return;

        if (this.workDates.length === 0) {
            container.innerHTML = '<p class="text-muted small">Выберите даты работы для свободного графика</p>';
            return;
        }

        let html = '<div class="d-flex flex-wrap gap-2">';
        this.workDates.forEach(date => {
            const dateObj = new Date(date + 'T00:00:00');
            const formattedDate = dateObj.toLocaleDateString('ru-RU', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            html += `
                <span class="badge bg-primary d-flex align-items-center gap-1">
                    ${escapeHtml(formattedDate)}
                    <button type="button" class="btn-close btn-close-white" style="font-size: 0.7rem;" onclick="window.specialistModal.removeWorkDate('${date}')" aria-label="Удалить"></button>
                </span>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Получить выбранные даты работы
     */
    getWorkDates() {
        return this.workDates;
    }

    /**
     * Закрыть модальное окно
     */
    hide() {
        if (this.modalElement) {
            const modal = bootstrap.Modal.getInstance(this.modalElement);
            if (modal) {
                modal.hide();
            }
        }
    }
}

