/**
 * Модуль управления настройками
 */
class SettingsModule {
    constructor(api, appState, notifications) {
        this.api = api;
        this.appState = appState;
        this.notifications = notifications;
    }

    /**
     * Рендерит HTML-разметку модуля настроек
     */
    render() {
        const container = document.getElementById('settings');
        if (!container) return;

        container.innerHTML = `
            <div class="row">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header bg-dark text-white">
                            <h5 class="mb-0"><i class="bi bi-gear"></i> Основные настройки</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label class="form-label">Название салона:</label>
                                <input type="text" class="form-control" id="salonName" value="Салон красоты">
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Интервал между записями (мин):</label>
                                <input type="number" class="form-control" id="bookingInterval" value="15" min="5" step="5">
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Автоматический логаут (мин):</label>
                                <input type="number" class="form-control" id="autoLogout" value="30" min="5">
                            </div>

                            <button class="btn btn-primary w-100" onclick="window.saveSettings()">
                                <i class="bi bi-check-circle"></i> Сохранить настройки
                            </button>
                        </div>
                    </div>
                </div>

                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header bg-dark text-white">
                            <h5 class="mb-0"><i class="bi bi-clock"></i> Время работы</h5>
                        </div>
                        <div class="card-body">
                            <!-- Режим работы в обычные дни -->
                            <div class="mb-4">
                                <h6><i class="bi bi-calendar-day"></i> Режим работы в обычные дни</h6>
                                <div class="row">
                                    <div class="col-md-6">
                                        <label class="form-label">Время начала:</label>
                                        <input type="time" class="form-control" id="defaultWorkStart" value="09:00">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Время окончания:</label>
                                        <input type="time" class="form-control" id="defaultWorkEnd" value="21:00">
                                    </div>
                                </div>
                                <button class="btn btn-sm btn-outline-primary mt-2" onclick="window.settingsModule.saveDefaultWorkHours()">
                                    <i class="bi bi-check"></i> Сохранить
                                </button>
                            </div>

                            <hr>

                            <!-- Нерабочие дни -->
                            <div class="mb-4">
                                <h6><i class="bi bi-calendar-x"></i> Нерабочие дни</h6>
                                <div class="mb-3">
                                    <div class="input-group">
                                        <input type="date" class="form-control" id="nonWorkingDayInput" min="">
                                        <button class="btn btn-outline-danger" onclick="window.settingsModule.addNonWorkingDay()">
                                            <i class="bi bi-plus"></i> Добавить
                                        </button>
                                    </div>
                                </div>
                                <div id="nonWorkingDaysList" class="border rounded p-3" style="min-height: 100px; max-height: 200px; overflow-y: auto;">
                                    <p class="text-muted mb-0">Нет нерабочих дней</p>
                                </div>
                            </div>

                            <hr>

                            <!-- Особые рабочие часы для конкретных дней -->
                            <div class="mb-4">
                                <h6><i class="bi bi-calendar-event"></i> Особые рабочие часы</h6>
                                <div class="mb-3">
                                    <div class="row">
                                        <div class="col-md-4">
                                            <label class="form-label">Дата:</label>
                                            <input type="date" class="form-control" id="specificDayDate" min="">
                                        </div>
                                        <div class="col-md-3">
                                            <label class="form-label">Начало:</label>
                                            <input type="time" class="form-control" id="specificDayStart" value="09:00">
                                        </div>
                                        <div class="col-md-3">
                                            <label class="form-label">Окончание:</label>
                                            <input type="time" class="form-control" id="specificDayEnd" value="21:00">
                                        </div>
                                        <div class="col-md-2 d-flex align-items-end">
                                            <button class="btn btn-outline-primary w-100" onclick="window.settingsModule.addSpecificDayHours()">
                                                <i class="bi bi-plus"></i> Добавить
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div id="specificDaysList" class="border rounded p-3" style="min-height: 100px; max-height: 200px; overflow-y: auto;">
                                    <p class="text-muted mb-0">Нет особых рабочих часов</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header bg-dark text-white">
                            <h5 class="mb-0"><i class="bi bi-shield-check"></i> Безопасность и доступ</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Роли пользователей:</label>
                                        <div class="list-group">
                                            <div class="list-group-item d-flex justify-content-between">
                                                <span>Администратор</span>
                                                <span class="badge bg-primary">Полный доступ</span>
                                            </div>
                                            <div class="list-group-item d-flex justify-content-between">
                                                <span>Специалист</span>
                                                <span class="badge bg-success">Ограниченный доступ</span>
                                            </div>
                                            <div class="list-group-item d-flex justify-content-between">
                                                <span>Менеджер</span>
                                                <span class="badge bg-warning">Чтение + запись</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Резервное копирование:</label>
                                        <div class="d-grid gap-2">
                                            <button class="btn btn-outline-primary" onclick="window.createBackup()">
                                                <i class="bi bi-download"></i> Создать бэкап
                                            </button>
                                            <button class="btn btn-outline-secondary" onclick="window.toggleAutoBackup()">
                                                <i class="bi bi-arrow-clockwise"></i> Автоматическое копирование
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Устанавливаем минимальную дату для input date
        const today = new Date().toISOString().split('T')[0];
        const nonWorkingDayInput = document.getElementById('nonWorkingDayInput');
        const specificDayDateInput = document.getElementById('specificDayDate');
        if (nonWorkingDayInput) nonWorkingDayInput.min = today;
        if (specificDayDateInput) specificDayDateInput.min = today;

        // Загружаем настройки времени работы
        this.loadWorkHoursSettings();
    }

    /**
     * Загружает настройки времени работы
     */
    async loadWorkHoursSettings() {
        try {
            const data = await this.api.get(CONFIG.ENDPOINTS.SETTINGS);
            if (data.success && data.data) {
                const settings = data.data;
                
                // Загружаем режим работы по умолчанию
                if (settings.default_work_hours) {
                    const defaultHours = typeof settings.default_work_hours === 'string' 
                        ? JSON.parse(settings.default_work_hours) 
                        : settings.default_work_hours;
                    const workStart = document.getElementById('defaultWorkStart');
                    const workEnd = document.getElementById('defaultWorkEnd');
                    if (workStart && defaultHours.start) workStart.value = defaultHours.start;
                    if (workEnd && defaultHours.end) workEnd.value = defaultHours.end;
                }
                
                // Загружаем нерабочие дни
                if (settings.non_working_days) {
                    const nonWorkingDays = typeof settings.non_working_days === 'string'
                        ? JSON.parse(settings.non_working_days)
                        : settings.non_working_days;
                    this.renderNonWorkingDays(nonWorkingDays || []);
                } else {
                    this.renderNonWorkingDays([]);
                }
                
                // Загружаем особые рабочие часы
                if (settings.specific_day_hours) {
                    const specificHours = typeof settings.specific_day_hours === 'string'
                        ? JSON.parse(settings.specific_day_hours)
                        : settings.specific_day_hours;
                    this.renderSpecificDays(specificHours || {});
                } else {
                    this.renderSpecificDays({});
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки настроек времени работы:', error);
        }
    }

    /**
     * Сохраняет режим работы по умолчанию
     */
    async saveDefaultWorkHours() {
        const workStart = document.getElementById('defaultWorkStart');
        const workEnd = document.getElementById('defaultWorkEnd');
        
        if (!workStart || !workEnd) return;
        
        const defaultWorkHours = {
            start: workStart.value,
            end: workEnd.value
        };
        
        try {
            const result = await this.api.put(CONFIG.ENDPOINTS.SETTINGS, {
                default_work_hours: defaultWorkHours
            });
            
            if (result.success) {
                this.notifications.success('Режим работы сохранен');
            } else {
                this.notifications.error(result.error || 'Ошибка сохранения');
            }
        } catch (error) {
            this.notifications.error(error.message);
        }
    }

    /**
     * Добавляет нерабочий день
     */
    async addNonWorkingDay() {
        const input = document.getElementById('nonWorkingDayInput');
        if (!input || !input.value) {
            this.notifications.warning('Выберите дату');
            return;
        }
        
        const date = input.value;
        
        try {
            // Загружаем текущие нерабочие дни
            const data = await this.api.get(CONFIG.ENDPOINTS.SETTINGS);
            let nonWorkingDays = [];
            
            if (data.success && data.data && data.data.non_working_days) {
                nonWorkingDays = typeof data.data.non_working_days === 'string'
                    ? JSON.parse(data.data.non_working_days)
                    : data.data.non_working_days;
            }
            
            // Проверяем, не добавлена ли уже эта дата
            if (nonWorkingDays.includes(date)) {
                this.notifications.warning('Эта дата уже добавлена');
                return;
            }
            
            // Добавляем дату
            nonWorkingDays.push(date);
            nonWorkingDays.sort(); // Сортируем по дате
            
            // Сохраняем
            const result = await this.api.put(CONFIG.ENDPOINTS.SETTINGS, {
                non_working_days: nonWorkingDays
            });
            
            if (result.success) {
                this.notifications.success('Нерабочий день добавлен');
                input.value = '';
                this.renderNonWorkingDays(nonWorkingDays);
            } else {
                this.notifications.error(result.error || 'Ошибка сохранения');
            }
        } catch (error) {
            this.notifications.error(error.message);
        }
    }

    /**
     * Удаляет нерабочий день
     */
    async removeNonWorkingDay(date) {
        try {
            const data = await this.api.get(CONFIG.ENDPOINTS.SETTINGS);
            let nonWorkingDays = [];
            
            if (data.success && data.data && data.data.non_working_days) {
                nonWorkingDays = typeof data.data.non_working_days === 'string'
                    ? JSON.parse(data.data.non_working_days)
                    : data.data.non_working_days;
            }
            
            // Удаляем дату
            nonWorkingDays = nonWorkingDays.filter(d => d !== date);
            
            // Сохраняем
            const result = await this.api.put(CONFIG.ENDPOINTS.SETTINGS, {
                non_working_days: nonWorkingDays
            });
            
            if (result.success) {
                this.notifications.success('Нерабочий день удален');
                this.renderNonWorkingDays(nonWorkingDays);
            } else {
                this.notifications.error(result.error || 'Ошибка сохранения');
            }
        } catch (error) {
            this.notifications.error(error.message);
        }
    }

    /**
     * Рендерит список нерабочих дней
     */
    renderNonWorkingDays(days) {
        const container = document.getElementById('nonWorkingDaysList');
        if (!container) return;
        
        if (days.length === 0) {
            container.innerHTML = '<p class="text-muted mb-0">Нет нерабочих дней</p>';
            return;
        }
        
        let html = '<div class="list-group list-group-flush">';
        days.forEach(date => {
            const dateObj = new Date(date + 'T00:00:00');
            html += `<div class="list-group-item d-flex justify-content-between align-items-center">
                <span>${dateObj.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <button class="btn btn-sm btn-outline-danger" onclick="window.settingsModule.removeNonWorkingDay('${date}')">
                    <i class="bi bi-trash"></i>
                </button>
            </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Добавляет особые рабочие часы для конкретного дня
     */
    async addSpecificDayHours() {
        const dateInput = document.getElementById('specificDayDate');
        const startInput = document.getElementById('specificDayStart');
        const endInput = document.getElementById('specificDayEnd');
        
        if (!dateInput || !dateInput.value || !startInput || !endInput) {
            this.notifications.warning('Заполните все поля');
            return;
        }
        
        const date = dateInput.value;
        const start = startInput.value;
        const end = endInput.value;
        
        if (start >= end) {
            this.notifications.warning('Время начала должно быть меньше времени окончания');
            return;
        }
        
        try {
            // Загружаем текущие особые часы
            const data = await this.api.get(CONFIG.ENDPOINTS.SETTINGS);
            let specificHours = {};
            
            if (data.success && data.data && data.data.specific_day_hours) {
                specificHours = typeof data.data.specific_day_hours === 'string'
                    ? JSON.parse(data.data.specific_day_hours)
                    : data.data.specific_day_hours;
            }
            
            // Добавляем или обновляем часы для даты
            specificHours[date] = { start, end };
            
            // Сохраняем
            const result = await this.api.put(CONFIG.ENDPOINTS.SETTINGS, {
                specific_day_hours: specificHours
            });
            
            if (result.success) {
                this.notifications.success('Особые рабочие часы сохранены');
                dateInput.value = '';
                this.renderSpecificDays(specificHours);
            } else {
                this.notifications.error(result.error || 'Ошибка сохранения');
            }
        } catch (error) {
            this.notifications.error(error.message);
        }
    }

    /**
     * Удаляет особые рабочие часы для конкретного дня
     */
    async removeSpecificDayHours(date) {
        try {
            const data = await this.api.get(CONFIG.ENDPOINTS.SETTINGS);
            let specificHours = {};
            
            if (data.success && data.data && data.data.specific_day_hours) {
                specificHours = typeof data.data.specific_day_hours === 'string'
                    ? JSON.parse(data.data.specific_day_hours)
                    : data.data.specific_day_hours;
            }
            
            // Удаляем дату
            delete specificHours[date];
            
            // Сохраняем
            const result = await this.api.put(CONFIG.ENDPOINTS.SETTINGS, {
                specific_day_hours: specificHours
            });
            
            if (result.success) {
                this.notifications.success('Особые рабочие часы удалены');
                this.renderSpecificDays(specificHours);
            } else {
                this.notifications.error(result.error || 'Ошибка сохранения');
            }
        } catch (error) {
            this.notifications.error(error.message);
        }
    }

    /**
     * Рендерит список особых рабочих часов
     */
    renderSpecificDays(specificHours) {
        const container = document.getElementById('specificDaysList');
        if (!container) return;
        
        const dates = Object.keys(specificHours).sort();
        
        if (dates.length === 0) {
            container.innerHTML = '<p class="text-muted mb-0">Нет особых рабочих часов</p>';
            return;
        }
        
        let html = '<div class="list-group list-group-flush">';
        dates.forEach(date => {
            const hours = specificHours[date];
            const dateObj = new Date(date + 'T00:00:00');
            html += `<div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${dateObj.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong><br>
                        <small class="text-muted">${formatTime(hours.start)} - ${formatTime(hours.end)}</small>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" onclick="window.settingsModule.removeSpecificDayHours('${date}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    async load() {
        try {
            // Если контейнер пустой, сначала рендерим разметку
            const container = document.getElementById('settings');
            if (container && !container.querySelector('.row')) {
                this.render();
            }

            const data = await this.api.get(CONFIG.ENDPOINTS.SETTINGS || '/api/settings');
            if (data.success && data.data) {
                this.updateSettings(data.data);
            }
        } catch (error) {
            console.error('Ошибка загрузки настроек:', error);
            // Используем настройки по умолчанию
            this.updateSettings({});
        }
    }

    updateSettings(settings) {
        // Основные настройки
        const salonName = document.getElementById('salonName');
        if (salonName && settings.salon_name) {
            salonName.value = settings.salon_name;
        }

        // Интервал между записями
        const intervalInput = document.getElementById('bookingInterval');
        if (intervalInput && settings.booking_interval) {
            intervalInput.value = settings.booking_interval;
        }

        // Автоматический логаут
        const autoLogout = document.getElementById('autoLogout');
        if (autoLogout && settings.auto_logout_minutes !== undefined) {
            autoLogout.value = settings.auto_logout_minutes;
        }
    }

    async save() {
        const salonName = document.getElementById('salonName');
        const intervalInput = document.getElementById('bookingInterval');
        const autoLogout = document.getElementById('autoLogout');

        const settingsData = {
            salon_name: salonName?.value || 'Салон красоты',
            booking_interval: parseInt(intervalInput?.value) || 15,
            auto_logout_minutes: parseInt(autoLogout?.value) || 30
        };

        try {
            const result = await this.api.put(CONFIG.ENDPOINTS.SETTINGS, settingsData);
            if (result.success) {
                this.notifications.success('Настройки сохранены');
                await this.load();
            } else {
                this.notifications.error(result.error || 'Ошибка сохранения');
            }
        } catch (error) {
            this.notifications.error(error.message);
        }
    }

    async createBackup() {
        try {
            const result = await this.api.post(CONFIG.ENDPOINTS.BACKUP || '/api/backup/create');
            if (result.success) {
                this.notifications.success('Резервная копия создана');
            } else {
                this.notifications.error(result.error || 'Ошибка создания резервной копии');
            }
        } catch (error) {
            this.notifications.error(error.message);
        }
    }

    async toggleAutoBackup() {
        try {
            const result = await this.api.post(CONFIG.ENDPOINTS.BACKUP || '/api/backup/auto');
            if (result.success) {
                this.notifications.success('Автоматическое резервное копирование ' + 
                    (result.data.enabled ? 'включено' : 'выключено'));
            } else {
                this.notifications.error(result.error || 'Ошибка настройки');
            }
        } catch (error) {
            this.notifications.error(error.message);
        }
    }
}

