/**
 * Модуль календаря
 */
class CalendarModule {
    constructor(api, appState, notifications) {
        this.api = api;
        this.appState = appState;
        this.notifications = notifications;
        this.currentView = 'month'; // month, week, day
        this.currentDate = new Date();
        this.bookings = [];
    }

    /**
     * Рендерит HTML-разметку календаря
     */
    render() {
        const container = document.getElementById('calendar');
        if (!container) return;

        // Инициализируем текущую дату из appState, если она есть
        if (this.appState.currentCalendarDate) {
            this.currentDate = new Date(this.appState.currentCalendarDate);
        } else {
            this.currentDate = new Date();
            this.appState.currentCalendarDate = this.currentDate;
        }

        // Инициализируем вид из appState
        if (this.appState.calendarView) {
            this.currentView = this.appState.calendarView;
        }

        container.innerHTML = `
            <div class="card">
                <div class="card-header bg-info text-white">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="mb-0"><i class="bi bi-calendar-week"></i> Календарь записей</h5>
                        <div>
                            <button class="btn btn-sm btn-light me-2" onclick="window.calendarModule.prevMonth()">
                                <i class="bi bi-chevron-left"></i>
                            </button>
                            <span id="currentMonth" class="fw-bold"></span>
                            <button class="btn btn-sm btn-light ms-2" onclick="window.calendarModule.nextMonth()">
                                <i class="bi bi-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-8">
                            <div class="d-flex align-items-center">
                                <select class="form-select me-2" style="width: auto;" id="calendarSpecialistFilter" onchange="window.calendarModule.onFilterChange()">
                                    <option value="">Все специалисты</option>
                                </select>
                                <select class="form-select me-2" style="width: auto;" id="calendarServiceFilter" onchange="window.calendarModule.onFilterChange()">
                                    <option value="">Все услуги</option>
                                </select>
                                <button class="btn btn-outline-secondary" onclick="window.calendarModule.load()">
                                    <i class="bi bi-arrow-clockwise"></i> Обновить
                                </button>
                            </div>
                        </div>
                        <div class="col-md-4 text-end">
                            <div class="btn-group" id="calendarViewButtons">
                                <button class="btn btn-outline-primary ${this.currentView === 'month' ? 'active' : ''}" onclick="window.calendarModule.changeView('month')">
                                    Месяц
                                </button>
                                <button class="btn btn-outline-primary ${this.currentView === 'week' ? 'active' : ''}" onclick="window.calendarModule.changeView('week')">
                                    Неделя
                                </button>
                                <button class="btn btn-outline-primary ${this.currentView === 'day' ? 'active' : ''}" onclick="window.calendarModule.changeView('day')">
                                    День
                                </button>
                            </div>
                        </div>
                    </div>

                    <div id="calendarView">
                        <div class="text-center text-muted py-5">
                            <i class="bi bi-calendar" style="font-size: 3rem;"></i>
                            <p>Загрузка календаря...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Обновляем отображение даты
        this.updateMonthDisplay();
        
        // Загружаем данные
        this.load();
    }

    updateMonthDisplay() {
        const monthElement = document.getElementById('currentMonth');
        if (monthElement) {
            const date = this.currentDate || new Date();
            let text = '';
            if (this.currentView === 'month') {
                text = date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
            } else if (this.currentView === 'week') {
                const weekStart = this.getStartDate();
                const weekEnd = this.getEndDate();
                text = `${weekStart.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}`;
            } else {
                text = date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            }
            monthElement.textContent = text;
        }
    }

    async load() {
        // Если контейнер пустой, сначала рендерим разметку
        const container = document.getElementById('calendar');
        if (container && !container.querySelector('.card')) {
            this.render();
        }

        // Обновляем фильтры
        this.updateFilters();

        // Загружаем записи
        await this.loadBookings();

        // Рендерим календарь в зависимости от текущего вида
        this.renderCalendar();
    }

    /**
     * Обновляет фильтры специалистов и услуг
     */
    updateFilters() {
        const specialistFilter = document.getElementById('calendarSpecialistFilter');
        const serviceFilter = document.getElementById('calendarServiceFilter');

        // Сохраняем текущие выбранные значения
        const selectedSpecialistId = specialistFilter?.value || '';
        const selectedServiceId = serviceFilter?.value || '';

        // Обновляем список специалистов
        if (specialistFilter) {
            specialistFilter.innerHTML = '<option value="">Все специалисты</option>';
            const specialists = this.appState.specialists || [];
            specialists.forEach(specialist => {
                if (specialist.is_active) {
                    const option = document.createElement('option');
                    option.value = specialist.id;
                    option.textContent = escapeHtml(specialist.name || 'Без имени');
                    if (selectedSpecialistId && specialist.id == selectedSpecialistId) {
                        option.selected = true;
                    }
                    specialistFilter.appendChild(option);
                }
            });
        }

        // Обновляем список услуг
        if (serviceFilter) {
            serviceFilter.innerHTML = '<option value="">Все услуги</option>';
            const services = this.appState.services || [];
            services.forEach(service => {
                if (service.is_active) {
                    const option = document.createElement('option');
                    option.value = service.id;
                    option.textContent = escapeHtml(service.name || 'Без названия');
                    if (selectedServiceId && service.id == selectedServiceId) {
                        option.selected = true;
                    }
                    serviceFilter.appendChild(option);
                }
            });
        }
    }

    /**
     * Загружает записи с учетом фильтров
     */
    async loadBookings() {
        try {
            const specialistFilter = document.getElementById('calendarSpecialistFilter');
            const serviceFilter = document.getElementById('calendarServiceFilter');
            
            let url = CONFIG.ENDPOINTS.BOOKINGS || '/api/bookings';
            
            // Определяем диапазон дат в зависимости от вида
            const startDate = this.getStartDate();
            const endDate = this.getEndDate();
            
            // Для дневного вида расширяем диапазон на несколько дней в обе стороны для надежности
            if (this.currentView === 'day') {
                const dayStart = new Date(startDate);
                dayStart.setDate(dayStart.getDate() - 1);
                const dayEnd = new Date(endDate);
                dayEnd.setDate(dayEnd.getDate() + 1);
                // Но используем только выбранный день для фильтрации
            }
            
            // Загружаем все записи (фильтрация на клиенте)
            const result = await this.api.get(url);
            
            if (result.success && result.data) {
                let bookings = result.data;
                
                console.log('Загружено записей:', bookings.length);
                
                // Фильтруем по специалисту
                const specialistId = specialistFilter?.value;
                if (specialistId) {
                    bookings = bookings.filter(b => b.specialist_id == specialistId);
                    console.log('После фильтрации по специалисту:', bookings.length);
                }
                
                // Фильтруем по услуге
                const serviceId = serviceFilter?.value;
                if (serviceId) {
                    bookings = bookings.filter(b => b.service_id == serviceId);
                    console.log('После фильтрации по услуге:', bookings.length);
                }
                
                // Фильтруем по дате (только не отмененные)
                bookings = bookings.filter(b => {
                    if (b.status === 'CANCELLED') return false;
                    
                    // Преобразуем дату записи в Date объект для сравнения
                    const bookingDateParts = b.date.split('-');
                    const bookingDate = new Date(
                        parseInt(bookingDateParts[0]),
                        parseInt(bookingDateParts[1]) - 1,
                        parseInt(bookingDateParts[2])
                    );
                    bookingDate.setHours(0, 0, 0, 0);
                    
                    return bookingDate >= startDate && bookingDate <= endDate;
                });
                
                console.log('После фильтрации по дате:', bookings.length, 'Диапазон:', startDate.toISOString(), '-', endDate.toISOString());
                this.bookings = bookings;
            } else {
                this.bookings = [];
            }
        } catch (error) {
            console.error('Ошибка загрузки записей:', error);
            this.bookings = [];
            this.notifications.error(error.message || 'Ошибка загрузки записей');
        }
    }

    /**
     * Получает начальную дату для отображения
     */
    getStartDate() {
        const date = new Date(this.currentDate);
        
        if (this.currentView === 'month') {
            // Первый день месяца
            date.setDate(1);
            // Первый день недели (понедельник)
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Понедельник
            date.setDate(diff);
        } else if (this.currentView === 'week') {
            // Понедельник текущей недели
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);
            date.setDate(diff);
        }
        // Для day просто текущая дата
        
        date.setHours(0, 0, 0, 0);
        return date;
    }

    /**
     * Получает конечную дату для отображения
     */
    getEndDate() {
        const date = new Date(this.currentDate);
        
        if (this.currentView === 'month') {
            // Последний день месяца
            date.setMonth(date.getMonth() + 1);
            date.setDate(0);
            // Последний день недели (воскресенье)
            const day = date.getDay();
            const diff = date.getDate() + (7 - day);
            date.setDate(diff);
        } else if (this.currentView === 'week') {
            // Воскресенье текущей недели
            const day = date.getDay();
            const diff = date.getDate() + (7 - day);
            date.setDate(diff);
        }
        // Для day просто текущая дата
        
        date.setHours(23, 59, 59, 999);
        return date;
    }

    changeView(view) {
        this.currentView = view;
        this.appState.calendarView = view;
        
        // Обновляем активную кнопку
        const buttons = document.querySelectorAll('#calendarViewButtons button');
        buttons.forEach((btn, index) => {
            btn.classList.remove('active');
            const views = ['month', 'week', 'day'];
            if (views[index] === view) {
                btn.classList.add('active');
            }
        });
        
        this.load();
    }

    prevMonth() {
        if (this.currentView === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        } else if (this.currentView === 'week') {
            this.currentDate.setDate(this.currentDate.getDate() - 7);
        } else {
            this.currentDate.setDate(this.currentDate.getDate() - 1);
        }
        this.appState.currentCalendarDate = new Date(this.currentDate);
        this.updateMonthDisplay();
        this.load();
    }

    nextMonth() {
        if (this.currentView === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        } else if (this.currentView === 'week') {
            this.currentDate.setDate(this.currentDate.getDate() + 7);
        } else {
            this.currentDate.setDate(this.currentDate.getDate() + 1);
        }
        this.appState.currentCalendarDate = new Date(this.currentDate);
        this.updateMonthDisplay();
        this.load();
    }

    /**
     * Рендерит календарь в зависимости от текущего вида
     */
    renderCalendar() {
        const calendarView = document.getElementById('calendarView');
        if (!calendarView) return;

        if (this.currentView === 'month') {
            this.renderMonthView();
        } else if (this.currentView === 'week') {
            this.renderWeekView();
        } else {
            this.renderDayView();
        }
    }

    /**
     * Рендерит календарь по месяцам
     */
    renderMonthView() {
        const calendarView = document.getElementById('calendarView');
        if (!calendarView) return;

        const startDate = this.getStartDate();
        const month = this.currentDate.getMonth();
        const year = this.currentDate.getFullYear();

        // Создаем таблицу календаря
        let html = '<div class="table-responsive"><table class="table table-bordered calendar-table">';
        
        // Заголовки дней недели
        html += '<thead><tr>';
        const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        weekDays.forEach(day => {
            html += `<th class="text-center">${day}</th>`;
        });
        html += '</tr></thead><tbody>';

        // Генерируем дни месяца
        const currentDate = new Date(startDate);
        let weekHtml = '<tr>';
        
        for (let i = 0; i < 42; i++) { // 6 недель * 7 дней
            const dayDate = new Date(currentDate);
            const dayBookings = this.getBookingsForDate(dayDate);
            const isCurrentMonth = dayDate.getMonth() === month;
            const isToday = this.isToday(dayDate);
            const dateStr = dayDate.toISOString().split('T')[0];
            
            weekHtml += `<td class="calendar-day ${!isCurrentMonth ? 'text-muted' : ''} ${isToday ? 'table-info' : ''} ${dayBookings.length > 0 ? 'has-bookings' : ''}" 
                            onclick="window.calendarModule.selectDate('${dateStr}')"
                            style="cursor: pointer;">`;
            weekHtml += `<div class="calendar-day-number">${dayDate.getDate()}</div>`;
            
            if (dayBookings.length > 0) {
                weekHtml += `<div class="calendar-bookings-count">
                                <span class="badge bg-primary">${dayBookings.length} ${this.getBookingsWord(dayBookings.length)}</span>
                             </div>`;
            }
            
            weekHtml += '</td>';
            
            // Переходим к следующему дню
            currentDate.setDate(currentDate.getDate() + 1);
            
            // Новая строка каждые 7 дней
            if ((i + 1) % 7 === 0) {
                weekHtml += '</tr>';
                html += weekHtml;
                if (i < 41) {
                    weekHtml = '<tr>';
                }
            }
        }
        
        html += '</tbody></table></div>';
        calendarView.innerHTML = html;
    }

    /**
     * Получает правильное склонение слова "запись"
     */
    getBookingsWord(count) {
        const lastDigit = count % 10;
        const lastTwoDigits = count % 100;
        
        if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
            return 'записей';
        }
        if (lastDigit === 1) {
            return 'запись';
        }
        if (lastDigit >= 2 && lastDigit <= 4) {
            return 'записи';
        }
        return 'записей';
    }

    /**
     * Выбирает дату и переключается на дневной вид
     */
    selectDate(dateStr) {
        // Создаем дату из строки YYYY-MM-DD в локальном времени
        const [year, month, day] = dateStr.split('-').map(Number);
        this.currentDate = new Date(year, month - 1, day);
        this.appState.currentCalendarDate = new Date(this.currentDate);
        console.log('Выбрана дата:', dateStr, 'currentDate:', this.currentDate);
        this.changeView('day');
    }

    /**
     * Рендерит календарь по неделям
     */
    renderWeekView() {
        const calendarView = document.getElementById('calendarView');
        if (!calendarView) return;

        const startDate = this.getStartDate();
        const hours = [];
        
        // Генерируем часы с 8:00 до 20:00
        for (let h = 8; h < 21; h++) {
            hours.push(h);
        }

        let html = '<div class="table-responsive"><table class="table table-bordered calendar-week-table">';
        
        // Заголовки дней недели
        html += '<thead><tr><th class="calendar-time-col">Время</th>';
        const weekDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
        const currentDate = new Date(startDate);
        
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(currentDate);
            const isToday = this.isToday(dayDate);
            html += `<th class="${isToday ? 'table-info' : ''}">
                        ${weekDays[i]}<br>
                        <small>${dayDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</small>
                     </th>`;
            currentDate.setDate(currentDate.getDate() + 1);
        }
        html += '</tr></thead><tbody>';

        // Генерируем строки для каждого часа
        hours.forEach(hour => {
            html += '<tr>';
            html += `<td class="calendar-time-col"><strong>${hour}:00</strong></td>`;
            
            const weekStart = new Date(startDate);
            for (let i = 0; i < 7; i++) {
                const dayDate = new Date(weekStart);
                dayDate.setHours(hour, 0, 0, 0);
                
                const hourBookings = this.getBookingsForHour(dayDate, hour);
                const isToday = this.isToday(dayDate);
                
                html += `<td class="calendar-hour-cell ${isToday ? 'table-info' : ''}">`;
                
            if (hourBookings.length > 0) {
                hourBookings.forEach(booking => {
                    const statusClass = this.getStatusClass(booking.status);
                    const startTime = new Date(`${booking.date}T${booking.time}`);
                    const startMinutes = startTime.getMinutes();
                    const duration = booking.duration || 30;
                    const height = (duration / 60) * 100; // Высота в процентах
                    const top = (startMinutes / 60) * 100; // Позиция сверху
                    
                    const tooltip = `${escapeHtml(booking.client_name || '')}\n${escapeHtml(booking.client_phone || '')}\nМастер: ${escapeHtml(booking.specialist_name || '')}\nУслуга: ${escapeHtml(booking.service_name || '')}`;
                    
                    html += `<div class="calendar-week-booking ${statusClass}" 
                                     style="height: ${height}%; top: ${top}%;"
                                     onclick="window.calendarModule.showBookingDetails(${booking.id})"
                                     title="${tooltip}">
                                    <small><strong>${formatTime(booking.time)}</strong></small><br>
                                    <small>${escapeHtml(booking.client_name || '')}</small><br>
                                    <small class="text-muted">${escapeHtml(booking.service_name || '')}</small>
                                 </div>`;
                });
            }
                
                html += '</td>';
                weekStart.setDate(weekStart.getDate() + 1);
            }
            
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        calendarView.innerHTML = html;
    }

    /**
     * Рендерит календарь по дням
     */
    renderDayView() {
        const calendarView = document.getElementById('calendarView');
        if (!calendarView) return;

        const dayDate = new Date(this.currentDate);
        dayDate.setHours(0, 0, 0, 0); // Устанавливаем время на начало дня
        const isToday = this.isToday(dayDate);
        const dayBookings = this.getBookingsForDate(dayDate);
        
        console.log('renderDayView - dayDate:', dayDate, 'dayBookings:', dayBookings.length);
        
        const hours = [];
        for (let h = 8; h < 21; h++) {
            hours.push(h);
        }

        let html = '<div class="calendar-day-view">';
        html += `<h6 class="mb-3">${dayDate.toLocaleDateString('ru-RU', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        })} ${isToday ? '<span class="badge bg-info">Сегодня</span>' : ''}</h6>`;
        
        html += '<div class="table-responsive"><table class="table table-bordered calendar-day-table">';
        html += '<thead><tr><th style="width: 100px;">Время</th><th>Записи</th></tr></thead><tbody>';

        hours.forEach(hour => {
            const hourBookings = dayBookings.filter(b => {
                const time = b.time.split(':');
                return parseInt(time[0]) === hour;
            });

            html += '<tr>';
            html += `<td class="calendar-time-col"><strong>${hour}:00</strong></td>`;
            html += '<td class="calendar-day-bookings">';
            
            if (hourBookings.length > 0) {
                hourBookings.forEach(booking => {
                    const statusClass = this.getStatusClass(booking.status);
                    html += `<div class="calendar-day-booking ${statusClass} mb-2 p-2 border rounded"
                                 onclick="window.calendarModule.showBookingDetails(${booking.id})">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <strong>${formatTime(booking.time)}</strong><br>
                                        <strong>${escapeHtml(booking.client_name || 'Не указано')}</strong><br>
                                        <small class="text-muted">${escapeHtml(booking.client_phone || 'Телефон не указан')}</small><br>
                                        <small class="text-muted"><strong>Мастер:</strong> ${escapeHtml(booking.specialist_name || 'Не указан')}</small><br>
                                        <small class="text-muted"><strong>Услуга:</strong> ${escapeHtml(booking.service_name || 'Не указана')}</small>
                                    </div>
                                    <span class="badge ${this.getStatusBadgeClass(booking.status)}">
                                        ${this.getStatusLabel(booking.status)}
                                    </span>
                                </div>
                                ${booking.comment ? `<div class="mt-1"><small><strong>Комментарий:</strong> ${escapeHtml(booking.comment)}</small></div>` : ''}
                             </div>`;
                });
            } else {
                html += '<div class="text-muted text-center py-2"><small>Нет записей</small></div>';
            }
            
            html += '</td></tr>';
        });
        
        html += '</tbody></table></div></div>';
        calendarView.innerHTML = html;
    }

    /**
     * Получает записи для конкретной даты
     */
    getBookingsForDate(date) {
        // Форматируем дату в формате YYYY-MM-DD с учетом локального времени
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        console.log('Ищем записи для даты:', dateStr, 'Всего записей:', this.bookings.length);
        const filtered = this.bookings.filter(b => {
            const bookingDate = b.date; // Уже в формате YYYY-MM-DD из API
            const match = bookingDate === dateStr;
            if (match) {
                console.log('Найдена запись:', b);
            }
            return match;
        });
        console.log('Найдено записей для даты', dateStr, ':', filtered.length);
        return filtered;
    }

    /**
     * Получает записи для конкретного часа
     */
    getBookingsForHour(date, hour) {
        // Форматируем дату в формате YYYY-MM-DD с учетом локального времени
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        return this.bookings.filter(b => {
            if (b.date !== dateStr) return false;
            const time = b.time.split(':');
            return parseInt(time[0]) === hour;
        });
    }

    /**
     * Проверяет, является ли дата сегодняшней
     */
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    /**
     * Получает CSS класс для статуса
     */
    getStatusClass(status) {
        const classes = {
            'CONFIRMED': 'booking-confirmed',
            'HOLD': 'booking-hold',
            'CANCELLED': 'booking-cancelled',
            'COMPLETED': 'booking-completed',
            'PENDING': 'booking-pending'
        };
        return classes[status] || 'booking-pending';
    }

    /**
     * Получает класс бейджа для статуса
     */
    getStatusBadgeClass(status) {
        const classes = {
            'CONFIRMED': 'bg-success',
            'HOLD': 'bg-warning',
            'CANCELLED': 'bg-danger',
            'COMPLETED': 'bg-info',
            'PENDING': 'bg-secondary'
        };
        return classes[status] || 'bg-secondary';
    }

    /**
     * Получает текстовую метку статуса
     */
    getStatusLabel(status) {
        const labels = {
            'CONFIRMED': 'Подтверждена',
            'HOLD': 'Ожидание',
            'CANCELLED': 'Отменена',
            'COMPLETED': 'Завершена',
            'PENDING': 'Ожидает'
        };
        return labels[status] || status;
    }

    /**
     * Обработчик изменения фильтров
     */
    onFilterChange() {
        this.load();
    }

    /**
     * Показывает детали записи
     */
    showBookingDetails(bookingId) {
        if (window.bookingModal) {
            window.bookingModal.showEdit(bookingId);
        } else {
            this.notifications.info(`Запись ID: ${bookingId}`);
        }
    }
}
