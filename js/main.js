/**
 * Главный файл приложения - точка входа
 */

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем модули (сначала модули, потом модальные окна, так как модальные окна зависят от модулей)
    window.specialistsModule = new SpecialistsModule(api, appState, notifications);
    window.servicesModule = new ServicesModule(api, appState, notifications);
    window.dashboardModule = new DashboardModule(api, appState, notifications);
    window.bookingModule = new BookingModule(api, appState, notifications);
    window.calendarModule = new CalendarModule(api, appState, notifications);
    window.clientsModule = new ClientsModule(api, appState, notifications);
    window.statisticsModule = new StatisticsModule(api, appState, notifications);
    window.bookingsListModule = new BookingsListModule(api, appState, notifications);
    window.communicationsModule = new CommunicationsModule(api, appState, notifications);
    window.settingsModule = new SettingsModule(api, appState, notifications);

    // Инициализируем модальные окна (после модулей, так как они зависят от них)
    window.specialistModal = new SpecialistModal(window.specialistsModule);
    window.serviceModal = new ServiceModal(window.servicesModule);
    window.categoryModal = new CategoryModal();
    window.clientModal = new ClientModal();
    window.bookingModal = new BookingModal(window.bookingsListModule);

    // Рендерим дашборд при загрузке (он активен по умолчанию)
    window.dashboardModule.render();
    
    // Загружаем начальные данные
    loadInitialData();

    // Устанавливаем сегодняшнюю дату по умолчанию
    const today = new Date().toISOString().split('T')[0];
    const dateSelect = document.getElementById('dateSelect');
    const filterDate = document.getElementById('filterDate');
    
    if (dateSelect) {
        dateSelect.value = today;
        dateSelect.min = today;
    }
    if (filterDate) {
        filterDate.value = today;
    }

    // Инициализируем табы
    initTabs();

    // Показываем уведомление о загрузке
    notifications.success('Расширенная панель управления готова к работе', 'Система загружена');
});

/**
 * Загрузка начальных данных
 */
async function loadInitialData() {
    try {
        await Promise.all([
            window.dashboardModule.load(),
            window.specialistsModule.load(),
            window.servicesModule.load(),
            window.clientsModule.load(),
            window.calendarModule.load()
        ]);
    } catch (error) {
        console.error('Ошибка загрузки начальных данных:', error);
    }
}

/**
 * Инициализация табов
 */
function initTabs() {
    const triggerTabList = [].slice.call(document.querySelectorAll('#mainTabs a'));
    triggerTabList.forEach(function (triggerEl) {
        const tabTrigger = new bootstrap.Tab(triggerEl);
        triggerEl.addEventListener('click', function (event) {
            event.preventDefault();
            tabTrigger.show();

            // При переключении табов обновляем данные
            const href = triggerEl.getAttribute('href');
            if (href === '#dashboard') {
                window.dashboardModule.render();
                window.dashboardModule.load();
            } else if (href === '#calendar') {
                window.calendarModule.render();
                window.calendarModule.load();
            } else if (href === '#statistics') {
                window.statisticsModule.render();
                window.statisticsModule.load();
            } else if (href === '#booking') {
                window.bookingModule.render();
            } else if (href === '#specialists') {
                window.specialistsModule.render();
            } else if (href === '#services') {
                window.servicesModule.render();
            } else if (href === '#clients') {
                window.clientsModule.render();
            } else if (href === '#booking') {
                window.bookingModule.render();
            } else if (href === '#bookingsList') {
                window.bookingsListModule.render();
                window.bookingsListModule.load();
            } else if (href === '#communications') {
                window.communicationsModule.render();
                window.communicationsModule.load();
            } else if (href === '#settings') {
                window.settingsModule.render();
                window.settingsModule.load();
            }
        });
    });
}

// Глобальные функции для обратной совместимости с HTML
window.showAddSpecialistModal = () => window.specialistsModule.showAddModal();
window.editSpecialist = (id, event) => window.specialistsModule.edit(id, event);
window.deleteSpecialist = (id, event) => window.specialistsModule.delete(id, event);
window.saveSpecialist = () => window.specialistsModule.save();
window.previewAvatar = (event) => window.specialistsModule.previewAvatar(event);
window.setRating = (rating) => window.specialistsModule.setRating(rating);

window.showAddCategoryModal = () => window.servicesModule.showAddCategoryModal();
window.showAddServiceModal = () => window.servicesModule.showAddServiceModal();
window.saveCategory = () => window.servicesModule.saveCategory();
window.saveService = () => window.servicesModule.saveService();
window.editCategory = (id) => window.servicesModule.editCategory(id);
window.editService = (id) => window.servicesModule.editService(id);
window.deleteService = (id) => window.servicesModule.deleteService(id);
window.showServicesView = (view) => window.servicesModule.render(view);

window.loadCalendar = () => window.calendarModule.load();
window.changeCalendarView = (view) => window.calendarModule.changeView(view);
window.prevMonth = () => window.calendarModule.prevMonth();
window.nextMonth = () => window.calendarModule.nextMonth();

// Обертки для функций клиентов
window.showAddClientModal = () => window.clientsModule.showAddModal();
window.searchClients = () => {
    const query = document.getElementById('clientSearch')?.value || '';
    window.clientsModule.search(query);
};
window.exportClients = () => window.clientsModule.export();
window.showEditClientModal = () => {
    if (window.clientsModule.selectedClient) {
        window.clientsModule.edit(window.clientsModule.selectedClient.id);
    } else {
        notifications.info('Выберите клиента для редактирования');
    }
};
window.showClientHistory = () => {
    if (window.clientsModule.selectedClient) {
        window.clientsModule.showHistory(window.clientsModule.selectedClient.id);
    } else {
        notifications.info('Выберите клиента для просмотра истории');
    }
};
window.createBookingForClient = () => {
    if (window.clientsModule.selectedClient) {
        window.clientsModule.createBookingForClient(window.clientsModule.selectedClient.id);
    } else {
        notifications.info('Выберите клиента для создания записи');
    }
};
window.deleteClient = () => {
    if (window.clientsModule.selectedClient) {
        window.clientsModule.delete(window.clientsModule.selectedClient.id);
    } else {
        notifications.info('Выберите клиента для удаления');
    }
};

// Обертки для функций бронирования (заглушки, требуют реализации)
window.createBooking = () => {
    window.bookingModule.create();
};
window.clearBookingForm = () => {
    notifications.info('Функция очистки формы бронирования в разработке');
};
window.showTimeSlotsModal = () => {
    notifications.info('Функция выбора временных слотов в разработке');
};
window.loadTodaySlots = () => {
    notifications.info('Функция загрузки слотов на сегодня в разработке');
};
window.loadTomorrowSlots = () => {
    notifications.info('Функция загрузки слотов на завтра в разработке');
};
window.checkBusySpecialists = () => {
    notifications.info('Функция проверки загруженности специалистов в разработке');
};
window.confirmSelectedSlot = () => {
    notifications.info('Функция подтверждения выбранного слота в разработке');
};

// Обертки для функций специалистов
window.searchSpecialists = () => {
    const query = document.getElementById('specialistSearch')?.value || '';
    // TODO: Реализовать поиск в specialistsModule
    notifications.info('Поиск специалистов в разработке');
};
window.exportSpecialists = () => {
    notifications.info('Функция экспорта специалистов в разработке');
};

// Обертки для функций дашборда
window.loadDashboardData = () => window.dashboardModule.load();

// Обертки для функций статистики
window.loadStatistics = () => window.statisticsModule.load();
window.generateDailyReport = () => {
    if (window.statisticsModule) {
        window.statisticsModule.generateDailyReport();
    }
};
window.generateMonthlyReport = () => {
    if (window.statisticsModule) {
        window.statisticsModule.generateMonthlyReport();
    }
};
window.generateSpecialistReport = () => {
    if (window.statisticsModule) {
        window.statisticsModule.generateSpecialistReport();
    }
};

// Обертки для функций списка записей
window.filterByDate = () => window.bookingsListModule.filterByDate();
window.filterBookings = () => window.bookingsListModule.filterBookings();
window.showBulkActionsModal = () => window.bookingsListModule.showBulkActionsModal();

// Обертки для функций уведомлений
window.sendNotification = () => window.communicationsModule.send();
window.previewNotification = () => window.communicationsModule.preview();

// Обертки для функций настроек
window.saveSettings = () => window.settingsModule.save();
window.createBackup = () => window.settingsModule.createBackup();
window.toggleAutoBackup = () => window.settingsModule.toggleAutoBackup();

// Обновляем дашборд каждые 5 минут
setInterval(() => window.dashboardModule.load(), CONFIG.SETTINGS.AUTO_REFRESH_INTERVAL);

