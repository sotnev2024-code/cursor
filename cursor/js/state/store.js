/**
 * Управление состоянием приложения
 */
class AppState {
    constructor() {
        this._bookings = [];
        this._clients = [];
        this._specialists = [];
        this._services = [];
        this._categories = [];
        this._listeners = new Map();
        
        // Текущие выбранные элементы
        this.currentSpecialistId = null;
        this.currentServiceId = null;
        this.currentDate = null;
        this.selectedSlot = null;
        this.selectedClient = null;
        this.selectedSpecialist = null;
        
        // Календарь
        this.currentCalendarDate = new Date();
        this.calendarView = 'month';
        
        // Графики
        this.revenueChart = null;
        this.servicesChart = null;
        
        // Рейтинг
        this.currentRating = 0;
    }

    // Геттеры с защитой от мутаций
    get bookings() { return [...this._bookings]; }
    get clients() { return [...this._clients]; }
    get specialists() { return [...this._specialists]; }
    get services() { return [...this._services]; }
    get categories() { return [...this._categories]; }

    // Сеттеры с уведомлением подписчиков
    setBookings(bookings) {
        this._bookings = bookings;
        this._notify('bookings', bookings);
    }

    setClients(clients) {
        this._clients = clients;
        this._notify('clients', clients);
    }

    setSpecialists(specialists) {
        this._specialists = specialists;
        this._notify('specialists', specialists);
    }

    setServices(services) {
        this._services = services;
        this._notify('services', services);
    }

    setCategories(categories) {
        this._categories = categories;
        this._notify('categories', categories);
    }

    // Подписка на изменения
    subscribe(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event).push(callback);
    }

    _notify(event, data) {
        const listeners = this._listeners.get(event) || [];
        listeners.forEach(callback => callback(data));
    }
}

// Создаем глобальный экземпляр состояния
const appState = new AppState();

