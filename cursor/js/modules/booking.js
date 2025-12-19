/**
 * Модуль бронирования с пошаговым процессом
 */
class BookingModule {
    constructor(api, appState, notifications) {
        this.api = api;
        this.appState = appState;
        this.notifications = notifications;
        this.currentStep = 1;
        this.bookingData = {
            service_id: null,
            specialist_id: null,
            date: null,
            time: null,
            client_phone: null,
            client_name: null,
            client_id: null,
            comment: null
        };
    }

    /**
     * Рендерит HTML-разметку формы бронирования
     */
    render() {
        // Сохраняем важные данные перед render, чтобы они не потерялись
        const savedServiceId = this.bookingData.service_id;
        const savedSpecialistId = this.bookingData.specialist_id;
        const savedDate = this.bookingData.date;
        const savedTime = this.bookingData.time;
        const savedCategoryId = this.bookingData.category_id;
        
        const container = document.getElementById('booking');
        if (!container) return;

        container.innerHTML = `
            <div class="row">
                <div class="col-md-8 mx-auto">
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0"><i class="bi bi-calendar-plus"></i> Новая запись</h5>
                        </div>
                        <div class="card-body">
                            <!-- Индикатор шагов -->
                            <div class="mb-4">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div class="step-indicator ${this.currentStep >= 1 ? 'active' : ''} ${this.currentStep > 1 ? 'completed' : ''}">
                                        <div class="step-number">1</div>
                                        <div class="step-label">Услуга</div>
                                    </div>
                                    <div class="step-line ${this.currentStep > 1 ? 'active' : ''}"></div>
                                    <div class="step-indicator ${this.currentStep >= 2 ? 'active' : ''} ${this.currentStep > 2 ? 'completed' : ''}">
                                        <div class="step-number">2</div>
                                        <div class="step-label">Мастер</div>
                                    </div>
                                    <div class="step-line ${this.currentStep > 2 ? 'active' : ''}"></div>
                                    <div class="step-indicator ${this.currentStep >= 3 ? 'active' : ''} ${this.currentStep > 3 ? 'completed' : ''}">
                                        <div class="step-number">3</div>
                                        <div class="step-label">Дата</div>
                                    </div>
                                    <div class="step-line ${this.currentStep > 3 ? 'active' : ''}"></div>
                                    <div class="step-indicator ${this.currentStep >= 4 ? 'active' : ''} ${this.currentStep > 4 ? 'completed' : ''}">
                                        <div class="step-number">4</div>
                                        <div class="step-label">Время</div>
                                    </div>
                                    <div class="step-line ${this.currentStep > 4 ? 'active' : ''}"></div>
                                    <div class="step-indicator ${this.currentStep >= 5 ? 'active' : ''}">
                                        <div class="step-number">5</div>
                                        <div class="step-label">Клиент</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Шаг 1: Выбор категории и услуги -->
                            <div id="step1" class="booking-step" style="display: ${this.currentStep === 1 ? 'block' : 'none'};">
                                <h6 class="mb-3"><i class="bi bi-scissors"></i> Шаг 1: Выберите категорию и услугу</h6>
                                <div class="mb-3">
                                    <label class="form-label">Категория *</label>
                                    <select class="form-select" id="categorySelect" onchange="window.bookingModule.onCategoryChange()">
                                        <option value="">Выберите категорию</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Услуга *</label>
                                    <select class="form-select" id="serviceSelect" onchange="window.bookingModule.onServiceChange()" disabled>
                                        <option value="">Сначала выберите категорию</option>
                                    </select>
                                    <div class="form-text" id="serviceInfo"></div>
                                </div>
                                <div class="d-flex justify-content-end">
                                    <button class="btn btn-primary" onclick="window.bookingModule.nextStep()" id="step1Next" disabled>
                                        Далее <i class="bi bi-arrow-right"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Шаг 2: Выбор мастера -->
                            <div id="step2" class="booking-step" style="display: ${this.currentStep === 2 ? 'block' : 'none'};">
                                <h6 class="mb-3"><i class="bi bi-person"></i> Шаг 2: Выберите мастера</h6>
                                <div class="mb-3">
                                    <label class="form-label">Специалист *</label>
                                    <select class="form-select" id="specialistSelect" onchange="window.bookingModule.onSpecialistChange()">
                                        <option value="">Загрузка...</option>
                                        <option value="any">Любой специалист</option>
                                    </select>
                                    <div class="form-text" id="specialistInfo"></div>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <button class="btn btn-outline-secondary" onclick="window.bookingModule.prevStep()">
                                        <i class="bi bi-arrow-left"></i> Назад
                                    </button>
                                    <button class="btn btn-primary" onclick="window.bookingModule.nextStep()" id="step2Next" disabled>
                                        Далее <i class="bi bi-arrow-right"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Шаг 3: Выбор даты -->
                            <div id="step3" class="booking-step" style="display: ${this.currentStep === 3 ? 'block' : 'none'};">
                                <h6 class="mb-3"><i class="bi bi-calendar"></i> Шаг 3: Выберите дату</h6>
                                <div class="mb-3">
                                    <label class="form-label">Дата *</label>
                                    <div id="availableDatesContainer" class="d-flex flex-wrap gap-2">
                                        <div class="text-center text-muted">
                                            <i class="bi bi-hourglass-split" style="font-size: 2rem;"></i>
                                            <p>Загрузка доступных дат...</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <button class="btn btn-outline-secondary" onclick="window.bookingModule.prevStep()">
                                        <i class="bi bi-arrow-left"></i> Назад
                                    </button>
                                    <button class="btn btn-primary" onclick="window.bookingModule.nextStep()" id="step3Next" disabled>
                                        Далее <i class="bi bi-arrow-right"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Шаг 4: Выбор времени -->
                            <div id="step4" class="booking-step" style="display: ${this.currentStep === 4 ? 'block' : 'none'};">
                                <h6 class="mb-3"><i class="bi bi-clock"></i> Шаг 4: Выберите время</h6>
                                <div class="mb-3">
                                    <label class="form-label">Время *</label>
                                    <div id="availableTimesContainer" class="d-flex flex-wrap gap-2">
                                        <div class="text-center text-muted">
                                            <i class="bi bi-hourglass-split" style="font-size: 2rem;"></i>
                                            <p>Загрузка доступного времени...</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <button class="btn btn-outline-secondary" onclick="window.bookingModule.prevStep()">
                                        <i class="bi bi-arrow-left"></i> Назад
                                    </button>
                                    <button class="btn btn-primary" onclick="window.bookingModule.nextStep()" id="step4Next" disabled>
                                        Далее <i class="bi bi-arrow-right"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Шаг 5: Информация о клиенте -->
                            <div id="step5" class="booking-step" style="display: ${this.currentStep === 5 ? 'block' : 'none'};">
                                <h6 class="mb-3"><i class="bi bi-person"></i> Шаг 5: Информация о клиенте</h6>
                                <div class="mb-3">
                                    <label class="form-label">Номер телефона *</label>
                                    <input type="tel" class="form-control" id="clientPhone" placeholder="+7 (999) 123-45-67" oninput="window.bookingModule.onPhoneInput()">
                                    <div class="form-text" id="clientPhoneInfo"></div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Имя *</label>
                                    <input type="text" class="form-control" id="clientName" placeholder="Имя клиента">
                                </div>
                                <div class="mb-3" id="existingClientInfo" style="display: none;">
                                    <div class="alert alert-info">
                                        <i class="bi bi-info-circle"></i> Клиент найден в базе данных
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Комментарий</label>
                                    <textarea class="form-control" id="bookingComment" rows="2" placeholder="Дополнительные пожелания"></textarea>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <button class="btn btn-outline-secondary" onclick="window.bookingModule.prevStep()">
                                        <i class="bi bi-arrow-left"></i> Назад
                                    </button>
                                    <button class="btn btn-success" onclick="window.bookingModule.createBooking()" id="step5Create">
                                        <i class="bi bi-check-circle"></i> Создать запись
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Предварительный просмотр -->
                    <div class="card mt-3" id="bookingPreviewCard" style="display: none;">
                        <div class="card-header bg-info text-white">
                            <h5 class="mb-0"><i class="bi bi-eye"></i> Предварительный просмотр</h5>
                        </div>
                        <div class="card-body" id="bookingPreview">
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Восстанавливаем сохраненные данные (на случай если они потерялись)
        if (savedServiceId && !this.bookingData.service_id) {
            this.bookingData.service_id = savedServiceId;
        }
        if (savedSpecialistId !== undefined && this.bookingData.specialist_id === undefined) {
            this.bookingData.specialist_id = savedSpecialistId;
        }
        if (savedDate && !this.bookingData.date) {
            this.bookingData.date = savedDate;
        }
        if (savedTime && !this.bookingData.time) {
            this.bookingData.time = savedTime;
        }
        if (savedCategoryId && !this.bookingData.category_id) {
            this.bookingData.category_id = savedCategoryId;
        }
        
        // Обновляем селекты
        this.updateSelects();
        
        // Восстанавливаем выбранные значения после рендера
        // Используем Promise для синхронизации
        this.restoreSelectionsPromise = this.restoreSelections();
    }
    
    async restoreSelections() {
        // Восстанавливаем выбранную категорию
        if (this.bookingData.category_id) {
            const categorySelect = document.getElementById('categorySelect');
            if (categorySelect) {
                categorySelect.value = this.bookingData.category_id;
                // Если мы на шаге 1, обновляем список услуг через onCategoryChange
                // Если уже на шаге 2+, просто обновляем список услуг без сброса service_id
                if (this.currentStep === 1) {
                    this.onCategoryChange();
                } else {
                    // На шаге 2+ просто обновляем список услуг, не сбрасывая service_id
                    const serviceSelect = document.getElementById('serviceSelect');
                    if (serviceSelect) {
                        serviceSelect.disabled = false;
                        serviceSelect.innerHTML = '<option value="">Выберите услугу</option>';
                        
                        const services = this.appState.services || [];
                        const categoryServices = services.filter(s => s.category_id == this.bookingData.category_id && s.is_active);
                        
                        categoryServices.forEach(service => {
                            const option = document.createElement('option');
                            option.value = service.id;
                            option.textContent = `${escapeHtml(service.name)} (${service.duration} мин, ${service.price} ₽)`;
                            serviceSelect.appendChild(option);
                        });
                    }
                }
            }
        }
        
        // Восстанавливаем выбранную услугу
        if (this.bookingData.service_id) {
            const serviceSelect = document.getElementById('serviceSelect');
            if (serviceSelect) {
                serviceSelect.value = this.bookingData.service_id;
                // Обновляем информацию об услуге
                const service = this.appState.services.find(s => s.id == this.bookingData.service_id);
                if (service) {
                    const serviceInfo = document.getElementById('serviceInfo');
                    if (serviceInfo) {
                        serviceInfo.innerHTML = `<small>Длительность: ${service.duration} мин | Цена: ${service.price} ₽</small>`;
                    }
                    const step1Next = document.getElementById('step1Next');
                    if (step1Next) {
                        step1Next.disabled = false;
                    }
                }
                // Обновляем список специалистов
                await this.updateSpecialistsForService(this.bookingData.service_id);
            }
        }
        
        // Восстанавливаем выбранного специалиста
        if (this.bookingData.specialist_id !== null && this.currentStep >= 2) {
            const specialistSelect = document.getElementById('specialistSelect');
            if (specialistSelect) {
                specialistSelect.value = this.bookingData.specialist_id || 'any';
            }
        }
        
        // Восстанавливаем выбранную дату (загрузка дат будет выполнена в nextStep)
        if (this.currentStep >= 3 && this.bookingData.date) {
            // Ждем, пока даты загрузятся (если они еще не загружены)
            // Это нужно только при возврате назад, поэтому не вызываем loadAvailableDates здесь
            // чтобы избежать дублирования вызовов
        }
        
        // Восстанавливаем выбранное время (загрузка времени будет выполнена в nextStep)
        if (this.currentStep >= 4 && this.bookingData.time) {
            // Аналогично - не вызываем loadAvailableTimes здесь
        }
    }

    updateSelects() {
        // Обновляем список категорий
        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Выберите категорию</option>';
            const categories = this.appState.categories || [];
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = escapeHtml(category.name || 'Без названия');
                categorySelect.appendChild(option);
            });
        }

        // Обновляем список услуг (будет обновлен после выбора категории)
        const serviceSelect = document.getElementById('serviceSelect');
        if (serviceSelect) {
            serviceSelect.innerHTML = '<option value="">Сначала выберите категорию</option>';
            serviceSelect.disabled = true;
        }

        // Обновляем список специалистов (будет обновлен после выбора услуги)
        const specialistSelect = document.getElementById('specialistSelect');
        if (specialistSelect) {
            specialistSelect.innerHTML = '<option value="">Загрузка...</option><option value="any">Любой специалист</option>';
        }
    }

    onCategoryChange() {
        const categorySelect = document.getElementById('categorySelect');
        const categoryId = categorySelect?.value;
        const serviceSelect = document.getElementById('serviceSelect');
        const step1Next = document.getElementById('step1Next');

        if (categoryId) {
            this.bookingData.category_id = parseInt(categoryId);
            this.bookingData.service_id = null; // Сбрасываем выбранную услугу
            
            // Обновляем список услуг для выбранной категории
            if (serviceSelect) {
                serviceSelect.innerHTML = '<option value="">Выберите услугу</option>';
                serviceSelect.disabled = false;
                
                const services = this.appState.services || [];
                const categoryServices = services.filter(s => s.category_id == categoryId && s.is_active);
                
                categoryServices.forEach(service => {
                    const option = document.createElement('option');
                    option.value = service.id;
                    option.textContent = `${escapeHtml(service.name)} (${service.duration} мин, ${service.price} ₽)`;
                    serviceSelect.appendChild(option);
                });
            }
            
            if (step1Next) {
                step1Next.disabled = true; // Нужно выбрать услугу
            }
        } else {
            this.bookingData.category_id = null;
            this.bookingData.service_id = null;
            if (serviceSelect) {
                serviceSelect.innerHTML = '<option value="">Сначала выберите категорию</option>';
                serviceSelect.disabled = true;
            }
            if (step1Next) {
                step1Next.disabled = true;
            }
        }
    }

    onServiceChange() {
        const serviceSelect = document.getElementById('serviceSelect');
        const serviceId = serviceSelect?.value;
        const step1Next = document.getElementById('step1Next');
        const serviceInfo = document.getElementById('serviceInfo');

        if (serviceId) {
            this.bookingData.service_id = parseInt(serviceId);
            const service = this.appState.services.find(s => s.id == serviceId);
            
            if (service) {
                serviceInfo.innerHTML = `<small>Длительность: ${service.duration} мин | Цена: ${service.price} ₽</small>`;
                step1Next.disabled = false;
                
                // Обновляем список специалистов для этой услуги
                this.updateSpecialistsForService(parseInt(serviceId));
            }
        } else {
            this.bookingData.service_id = null;
            serviceInfo.innerHTML = '';
            step1Next.disabled = true;
        }
    }

    async updateSpecialistsForService(serviceId) {
        const specialistSelect = document.getElementById('specialistSelect');
        if (!specialistSelect) return;

        specialistSelect.innerHTML = '<option value="">Загрузка специалистов...</option>';
        
        try {
            // Загружаем специалистов, которые предоставляют эту услугу
            const specialists = this.appState.specialists || [];
            
            console.log('Все специалисты:', specialists);
            console.log('Ищем услугу с ID:', serviceId);
            
            // Фильтруем специалистов, у которых есть эта услуга в списке services
            const availableSpecialists = specialists.filter(specialist => {
                if (!specialist.is_active) {
                    console.log(`Специалист ${specialist.name} неактивен`);
                    return false;
                }
                
                // Проверяем, есть ли у специалиста эта услуга
                if (specialist.services && Array.isArray(specialist.services)) {
                    console.log(`Специалист ${specialist.name} имеет услуги:`, specialist.services);
                    const hasService = specialist.services.some(s => {
                        // s может быть объектом с полем id или просто числом
                        let serviceIdToCheck = null;
                        if (typeof s === 'object' && s !== null) {
                            serviceIdToCheck = s.id;
                        } else if (typeof s === 'number' || typeof s === 'string') {
                            serviceIdToCheck = parseInt(s);
                        }
                        
                        // Сравниваем только если serviceIdToCheck не null
                        if (serviceIdToCheck === null) {
                            return false;
                        }
                        
                        const matches = serviceIdToCheck == serviceId;
                        console.log(`Специалист ${specialist.name} имеет услугу ${serviceIdToCheck} (ищем ${serviceId}):`, matches);
                        return matches;
                    });
                    console.log(`Специалист ${specialist.name} имеет услугу ${serviceId}:`, hasService);
                    return hasService;
                }
                console.log(`Специалист ${specialist.name} не имеет услуг или services не массив`);
                return false;
            });
            
            console.log('Найдено специалистов с услугой:', availableSpecialists.length);
            
            specialistSelect.innerHTML = '<option value="">Выберите специалиста</option><option value="any">Любой специалист</option>';
            
            if (availableSpecialists.length > 0) {
                availableSpecialists.forEach(specialist => {
                    const option = document.createElement('option');
                    option.value = specialist.id;
                    option.textContent = escapeHtml(specialist.name || 'Без имени');
                    specialistSelect.appendChild(option);
                });
            } else {
                console.log('Не найдено специалистов с услугой, показываем всех активных');
                // Если не найдено специалистов с этой услугой, показываем всех активных
                // (возможно, связь не настроена, но специалист может выполнить услугу)
                specialists.forEach(specialist => {
                    if (specialist.is_active) {
                        const option = document.createElement('option');
                        option.value = specialist.id;
                        option.textContent = escapeHtml(specialist.name || 'Без имени');
                        specialistSelect.appendChild(option);
                    }
                });
            }
        } catch (error) {
            console.error('Ошибка загрузки специалистов:', error);
            specialistSelect.innerHTML = '<option value="">Ошибка загрузки</option><option value="any">Любой специалист</option>';
        }
    }

    onSpecialistChange() {
        const specialistSelect = document.getElementById('specialistSelect');
        const specialistId = specialistSelect?.value;
        const step2Next = document.getElementById('step2Next');
        const specialistInfo = document.getElementById('specialistInfo');

        if (specialistId) {
            this.bookingData.specialist_id = specialistId === 'any' ? null : parseInt(specialistId);
            step2Next.disabled = false;
            
            if (specialistId !== 'any') {
                const specialist = this.appState.specialists.find(s => s.id == specialistId);
                if (specialist) {
                    specialistInfo.innerHTML = `<small>${escapeHtml(specialist.position || '')}</small>`;
                }
            } else {
                specialistInfo.innerHTML = '<small>Будет выбран любой доступный специалист</small>';
            }
        } else {
            this.bookingData.specialist_id = null;
            step2Next.disabled = true;
        }
    }

    async nextStep() {
        if (this.currentStep === 1) {
            if (!this.bookingData.service_id) {
                this.notifications.error('Выберите услугу');
                return;
            }
            this.currentStep = 2;
            this.render();
            // Обновляем список специалистов после рендера
            await this.updateSpecialistsForService(this.bookingData.service_id);
        } else if (this.currentStep === 2) {
            // Проверяем, что специалист выбран (может быть null для "любого специалиста")
            if (this.bookingData.specialist_id === undefined) {
                this.notifications.error('Выберите специалиста');
                return;
            }
            // Сохраняем service_id перед переходом (на случай если он потеряется)
            const savedServiceId = this.bookingData.service_id;
            console.log('Переход на шаг 3, сохраняем service_id:', savedServiceId);
            
            this.currentStep = 3;
            this.render();
            
            // Восстанавливаем service_id если он потерялся
            if (!this.bookingData.service_id && savedServiceId) {
                this.bookingData.service_id = savedServiceId;
                console.log('Восстановлен service_id после render:', this.bookingData.service_id);
            }
            
            // Ждем восстановления данных перед загрузкой дат
            if (this.restoreSelectionsPromise) {
                await this.restoreSelectionsPromise;
            }
            
            // Еще раз проверяем service_id после восстановления
            if (!this.bookingData.service_id && savedServiceId) {
                this.bookingData.service_id = savedServiceId;
                console.log('Восстановлен service_id после restoreSelections:', this.bookingData.service_id);
            }
            
            // Загружаем даты после восстановления данных
            await this.loadAvailableDates();
        } else if (this.currentStep === 3) {
            if (!this.bookingData.date) {
                this.notifications.error('Выберите дату');
                return;
            }
            this.currentStep = 4;
            this.render();
            // Ждем восстановления данных перед загрузкой времени
            if (this.restoreSelectionsPromise) {
                await this.restoreSelectionsPromise;
            }
            // Загружаем время после восстановления данных
            await this.loadAvailableTimes();
        } else if (this.currentStep === 4) {
            if (!this.bookingData.time) {
                this.notifications.error('Выберите время');
                return;
            }
            this.currentStep = 5;
            this.render();
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.render();
        }
    }

    async loadAvailableDates() {
        const container = document.getElementById('availableDatesContainer');
        if (!container) return;

        container.innerHTML = '<div class="text-center text-muted"><i class="bi bi-hourglass-split"></i> Загрузка доступных дат...</div>';

        // Проверяем service_id с дополнительной попыткой получить из DOM
        let serviceId = this.bookingData.service_id;
        if (!serviceId) {
            const serviceSelect = document.getElementById('serviceSelect');
            if (serviceSelect && serviceSelect.value) {
                serviceId = parseInt(serviceSelect.value);
                this.bookingData.service_id = serviceId;
                console.log('Восстановлен service_id из DOM:', serviceId);
            }
        }

        console.log('loadAvailableDates: service_id =', serviceId, 'bookingData =', this.bookingData);

        if (!serviceId) {
            container.innerHTML = '<div class="alert alert-warning">Сначала выберите услугу</div>';
            console.error('service_id не найден! bookingData:', this.bookingData);
            return;
        }

        try {
            // Получаем specialist_id, если он не был установлен
            let specialistId = this.bookingData.specialist_id;
            if (specialistId === null || specialistId === undefined) {
                const specialistSelect = document.getElementById('specialistSelect');
                if (specialistSelect && specialistSelect.value && specialistSelect.value !== 'any') {
                    specialistId = parseInt(specialistSelect.value);
                    this.bookingData.specialist_id = specialistId;
                }
            }

            const params = new URLSearchParams({
                service_id: serviceId,
                specialist_id: specialistId || 'any',
                start_date: new Date().toISOString().split('T')[0],
                days_ahead: '30'
            });

            console.log('Запрос доступных дат с параметрами:', params.toString());
            const url = `${CONFIG.ENDPOINTS.BOOKINGS}/available-dates?${params}`;
            console.log('URL запроса:', url);
            
            const result = await this.api.get(url);
            console.log('Результат загрузки дат:', result);
            
            if (result.success && result.data && result.data.length > 0) {
                container.innerHTML = '';
                // Сортируем даты
                const sortedDates = result.data.sort();
                console.log('Доступные даты:', sortedDates);
                sortedDates.forEach(dateStr => {
                    const date = new Date(dateStr + 'T00:00:00');
                    const dateBtn = document.createElement('button');
                    dateBtn.type = 'button';
                    dateBtn.className = 'btn btn-outline-primary date-btn';
                    dateBtn.textContent = date.toLocaleDateString('ru-RU', { 
                        weekday: 'short', 
                        day: 'numeric', 
                        month: 'short' 
                    });
                    dateBtn.dataset.date = dateStr;
                    dateBtn.onclick = () => this.selectDate(dateStr);
                    container.appendChild(dateBtn);
                });
            } else {
                const errorMsg = result.error || 'Нет доступных дат для бронирования';
                console.warn('Нет доступных дат:', errorMsg, result);
                container.innerHTML = `<div class="alert alert-warning">${escapeHtml(errorMsg)}</div>`;
            }
        } catch (error) {
            console.error('Ошибка загрузки дат:', error);
            container.innerHTML = `<div class="alert alert-danger">Ошибка загрузки дат: ${escapeHtml(error.message || 'Неизвестная ошибка')}</div>`;
        }
    }

    selectDate(dateStr) {
        this.bookingData.date = dateStr;
        
        // Подсвечиваем выбранную дату
        const dateButtons = document.querySelectorAll('.date-btn');
        dateButtons.forEach(btn => {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-outline-primary');
        });
        const selectedBtn = document.querySelector(`[data-date="${dateStr}"]`);
        if (selectedBtn) {
            selectedBtn.classList.remove('btn-outline-primary');
            selectedBtn.classList.add('btn-primary');
        }
        
        const step3Next = document.getElementById('step3Next');
        if (step3Next) {
            step3Next.disabled = false;
        }
    }

    async loadAvailableTimes() {
        const container = document.getElementById('availableTimesContainer');
        if (!container) return;

        container.innerHTML = '<div class="text-center text-muted"><i class="bi bi-hourglass-split"></i> Загрузка...</div>';

        try {
            const params = new URLSearchParams({
                service_id: this.bookingData.service_id,
                specialist_id: this.bookingData.specialist_id || 'any',
                date: this.bookingData.date
            });

            const result = await this.api.get(`${CONFIG.ENDPOINTS.BOOKINGS}/available-times?${params}`);
            
            if (result.success && result.data && result.data.length > 0) {
                container.innerHTML = '';
                result.data.forEach(timeSlot => {
                    const timeBtn = document.createElement('button');
                    timeBtn.type = 'button';
                    timeBtn.className = 'btn btn-outline-success time-btn';
                    timeBtn.textContent = timeSlot.time;
                    timeBtn.dataset.time = timeSlot.time;
                    timeBtn.dataset.specialistId = timeSlot.specialists[0]?.id || '';
                    timeBtn.onclick = () => this.selectTime(timeSlot.time, timeSlot.specialists[0]?.id);
                    
                    // Показываем количество доступных специалистов
                    if (timeSlot.specialists.length > 1) {
                        const badge = document.createElement('span');
                        badge.className = 'badge bg-info ms-2';
                        badge.textContent = `${timeSlot.specialists.length} мастера`;
                        timeBtn.appendChild(badge);
                    }
                    
                    container.appendChild(timeBtn);
                });
            } else {
                container.innerHTML = '<div class="alert alert-warning">Нет доступного времени для выбранной даты</div>';
            }
        } catch (error) {
            container.innerHTML = `<div class="alert alert-danger">Ошибка загрузки времени: ${error.message}</div>`;
        }
    }

    selectTime(timeStr, specialistId) {
        this.bookingData.time = timeStr;
        
        // Если был выбран "любой специалист", но теперь выбран конкретный слот с мастером
        if (this.bookingData.specialist_id === null && specialistId) {
            this.bookingData.specialist_id = parseInt(specialistId);
        }
        
        // Подсвечиваем выбранное время
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.classList.remove('btn-success');
            btn.classList.add('btn-outline-success');
        });
        const selectedBtn = document.querySelector(`[data-time="${timeStr}"]`);
        if (selectedBtn) {
            selectedBtn.classList.remove('btn-outline-success');
            selectedBtn.classList.add('btn-success');
        }
        
        document.getElementById('step4Next').disabled = false;
    }

    async onPhoneInput() {
        const phoneInput = document.getElementById('clientPhone');
        const phone = phoneInput?.value.trim();
        const phoneInfo = document.getElementById('clientPhoneInfo');
        const existingClientInfo = document.getElementById('existingClientInfo');
        const clientNameInput = document.getElementById('clientName');

        if (!phone || phone.length < 7) {
            phoneInfo.innerHTML = '';
            existingClientInfo.style.display = 'none';
            return;
        }

        try {
            const result = await this.api.get(`${CONFIG.ENDPOINTS.CLIENTS}/find-by-phone?phone=${encodeURIComponent(phone)}`);
            
            if (result.success && result.data) {
                // Клиент найден
                this.bookingData.client_id = result.data.id;
                this.bookingData.client_name = result.data.name;
                clientNameInput.value = result.data.name;
                clientNameInput.disabled = true;
                phoneInfo.innerHTML = '<small class="text-success"><i class="bi bi-check-circle"></i> Клиент найден в базе</small>';
                existingClientInfo.style.display = 'block';
            } else {
                // Клиент не найден
                this.bookingData.client_id = null;
                clientNameInput.disabled = false;
                phoneInfo.innerHTML = '<small class="text-info"><i class="bi bi-info-circle"></i> Новый клиент будет создан</small>';
                existingClientInfo.style.display = 'none';
            }
        } catch (error) {
            phoneInfo.innerHTML = '';
            existingClientInfo.style.display = 'none';
        }
    }

    async createBooking() {
        const phoneInput = document.getElementById('clientPhone');
        const nameInput = document.getElementById('clientName');
        const commentInput = document.getElementById('bookingComment');

        const phone = phoneInput?.value.trim();
        const name = nameInput?.value.trim();
        const comment = commentInput?.value.trim();

        if (!phone || !name) {
            this.notifications.error('Заполните номер телефона и имя клиента');
            return;
        }

        if (!this.bookingData.service_id || !this.bookingData.date || !this.bookingData.time) {
            this.notifications.error('Не все данные заполнены');
            return;
        }

        // Если специалист не выбран, нужно выбрать первого доступного из слота
        if (!this.bookingData.specialist_id) {
            this.notifications.error('Выберите специалиста');
            return;
        }

        try {
            // Если клиент не найден, создаем нового
            if (!this.bookingData.client_id) {
                const newClient = await this.api.post(CONFIG.ENDPOINTS.CLIENTS, {
                    name: name,
                    phone: phone,
                    source: 'phone' // или другой источник
                });

                if (newClient.success) {
                    this.bookingData.client_id = newClient.data.id;
                } else {
                    this.notifications.error(newClient.error || 'Ошибка создания клиента');
                    return;
                }
            }

            // Получаем информацию об услуге для цены
            const service = this.appState.services.find(s => s.id == this.bookingData.service_id);

            // Создаем запись
            const booking = await this.api.post(CONFIG.ENDPOINTS.BOOKINGS, {
                client_id: this.bookingData.client_id,
                specialist_id: this.bookingData.specialist_id,
                service_id: this.bookingData.service_id,
                date: this.bookingData.date,
                time: this.bookingData.time,
                duration: service.duration,
                price: service.price,
                status: 'PENDING',
                comment: comment || null
            });

            if (booking.success) {
                this.notifications.success('Запись успешно создана!');
                this.resetForm();
            } else {
                this.notifications.error(booking.error || 'Ошибка создания записи');
            }
        } catch (error) {
            this.notifications.error(error.message || 'Ошибка создания записи');
        }
    }

    resetForm() {
        this.currentStep = 1;
        this.bookingData = {
            category_id: null,
            service_id: null,
            specialist_id: null,
            date: null,
            time: null,
            client_phone: null,
            client_name: null,
            client_id: null,
            comment: null
        };
        this.render();
    }
}
