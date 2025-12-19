// Мини-приложение записи в салон красоты для Telegram

const API_BASE = '/api';

const state = {
    telegramUser: null,
    client: null,
    services: [],
    categories: [],
    selectedServiceId: null,
    selectedDate: null,
    selectedTime: null,
    selectedSpecialistId: null,
};

function logError(e) {
    console.error(e);
}

async function apiGet(path, params) {
    const url = new URL(API_BASE + path, window.location.origin);
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
                url.searchParams.set(k, v);
            }
        });
    }
    const res = await fetch(url.toString());
    return res.json();
}

async function apiPost(path, body) {
    const res = await fetch(API_BASE + path, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body || {})
    });
    return res.json();
}

function setConfirmEnabled() {
    const btn = document.getElementById('confirmButton');
    const enabled = !!(state.client && state.selectedServiceId && state.selectedDate && state.selectedTime && state.selectedSpecialistId);
    btn.disabled = !enabled;
}

async function initTelegramUser() {
    try {
        const tg = window.Telegram && window.Telegram.WebApp;
        let user = null;
        if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
            user = tg.initDataUnsafe.user;
        } else {
            // Для локального теста без Telegram
            user = {
                id: 'local-test-user',
                first_name: 'Тест',
                last_name: 'Пользователь',
                username: 'test_user'
            };
        }
        state.telegramUser = user;

        const meRes = await apiPost('/telegram/me', {
            telegram_id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            photo_url: user.photo_url,
        });
        if (meRes.success) {
            state.client = meRes.data;
        }
    } catch (e) {
        logError(e);
    }
}

async function loadSalonInfo() {
    try {
        const res = await apiGet('/telegram/salon-info');
        if (!res.success) return;
        const info = res.data;

        document.getElementById('salonName').textContent = info.name;
        document.getElementById('salonRating').textContent = `★ ${info.rating}`;
        document.getElementById('salonAddress').textContent = info.address;
        document.getElementById('salonDescription').textContent = info.description;
        document.getElementById('salonHowToGet').textContent = info.location?.how_to_get || '';

        const logo = document.getElementById('salonLogo');
        if (info.name && logo) {
            logo.textContent = info.name.trim().charAt(0) || 'С';
        }

        // Вкладка "Инфо"
        document.getElementById('infoDescription').textContent = info.description;
        document.getElementById('infoAddress').textContent = `Адрес: ${info.address}`;
        document.getElementById('infoPhone').textContent = `Телефон: ${info.phone}`;

        const reviewsContainer = document.getElementById('infoReviews');
        reviewsContainer.innerHTML = '';
        (info.reviews || []).forEach(r => {
            const div = document.createElement('div');
            div.className = 'mb-2';
            div.innerHTML = `<strong>${r.author}</strong> · ★ ${r.rating}<br /><span>${r.text}</span>`;
            reviewsContainer.appendChild(div);
        });
    } catch (e) {
        logError(e);
    }
}

async function loadServices() {
    try {
        const [servicesRes, categoriesRes] = await Promise.all([
            apiGet('/services'),
            apiGet('/categories')
        ]);
        if (servicesRes.success) {
            state.services = (servicesRes.data || []).filter(s => s.online_booking);
        }
        if (categoriesRes.success) {
            state.categories = categoriesRes.data || [];
        }

        const select = document.getElementById('serviceSelect');
        select.innerHTML = '<option value="">Выберите услугу</option>';
        state.services.forEach(s => {
            const category = state.categories.find(c => c.id === s.category_id);
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = `${s.name} (${category ? category.name + ', ' : ''}${s.duration} мин, ${s.price} ₽)`;
            select.appendChild(opt);
        });
    } catch (e) {
        logError(e);
    }
}

function renderServiceDetails() {
    const container = document.getElementById('serviceDetails');
    const service = state.services.find(s => s.id === Number(state.selectedServiceId));
    if (!service) {
        container.textContent = '';
        return;
    }
    const category = state.categories.find(c => c.id === service.category_id);
    container.textContent = `${service.description || 'Без описания'} · ${category ? category.name + ' · ' : ''}${service.duration} мин · ${service.price} ₽`;
}

async function loadDates() {
    const dateSelect = document.getElementById('dateSelect');
    dateSelect.innerHTML = '<option value="">Загрузка доступных дат...</option>';
    state.selectedDate = null;
    state.selectedTime = null;
    state.selectedSpecialistId = null;
    document.getElementById('timeSlots').innerHTML = '<div class="small-muted">Сначала выберите дату</div>';
    setConfirmEnabled();

    if (!state.selectedServiceId) {
        dateSelect.innerHTML = '<option value="">Сначала выберите услугу</option>';
        return;
    }

    try {
        const res = await apiGet('/bookings/available-dates', {
            service_id: state.selectedServiceId,
            specialist_id: 'any',
            days_ahead: 14
        });
        if (!res.success) {
            dateSelect.innerHTML = `<option value="">${res.error || 'Ошибка загрузки дат'}</option>`;
            return;
        }
        const dates = res.data || [];
        if (dates.length === 0) {
            dateSelect.innerHTML = '<option value="">Нет доступных дат</option>';
            return;
        }
        dateSelect.innerHTML = '<option value="">Выберите дату</option>';
        dates.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d;
            const dateObj = new Date(d + 'T00:00:00');
            const formatter = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
            opt.textContent = formatter.format(dateObj);
            dateSelect.appendChild(opt);
        });
    } catch (e) {
        logError(e);
        dateSelect.innerHTML = '<option value="">Ошибка загрузки дат</option>';
    }
}

async function loadTimes() {
    const timeContainer = document.getElementById('timeSlots');
    timeContainer.innerHTML = '<div class="small-muted">Загрузка времени...</div>';
    state.selectedTime = null;
    state.selectedSpecialistId = null;
    setConfirmEnabled();

    if (!state.selectedServiceId || !state.selectedDate) {
        timeContainer.innerHTML = '<div class="small-muted">Сначала выберите услугу и дату</div>';
        return;
    }

    try {
        const res = await apiGet('/bookings/available-times', {
            service_id: state.selectedServiceId,
            specialist_id: 'any',
            date: state.selectedDate
        });
        if (!res.success) {
            timeContainer.innerHTML = `<div class="small-muted">${res.error || 'Ошибка загрузки времени'}</div>`;
            return;
        }
        const items = res.data || [];
        if (items.length === 0) {
            timeContainer.innerHTML = '<div class="small-muted">Нет доступного времени на выбранную дату</div>';
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'd-flex flex-wrap gap-2';

        items.forEach(slot => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'time-chip';
            btn.textContent = slot.time;
            btn.addEventListener('click', () => {
                state.selectedTime = slot.time;
                // Берём первого доступного специалиста
                const spec = (slot.specialists && slot.specialists[0]) || null;
                state.selectedSpecialistId = spec ? spec.id : null;

                Array.from(wrapper.children).forEach(ch => ch.classList.remove('active'));
                btn.classList.add('active');
                setConfirmEnabled();
            });
            wrapper.appendChild(btn);
        });

        timeContainer.innerHTML = '';
        timeContainer.appendChild(wrapper);
    } catch (e) {
        logError(e);
        timeContainer.innerHTML = '<div class="small-muted">Ошибка загрузки времени</div>';
    }
}

async function createBooking() {
    if (!state.client || !state.selectedServiceId || !state.selectedDate || !state.selectedTime || !state.selectedSpecialistId) {
        return;
    }
    const btn = document.getElementById('confirmButton');
    btn.disabled = true;
    btn.textContent = 'Создаём запись...';

    try {
        const service = state.services.find(s => s.id === Number(state.selectedServiceId));
        const body = {
            client_id: state.client.id,
            specialist_id: state.selectedSpecialistId,
            service_id: service.id,
            date: state.selectedDate,
            time: state.selectedTime,
            duration: service.duration,
            price: service.price,
            status: 'PENDING',
            payment_method: null,
            comment: 'Запись из Telegram Mini App'
        };

        const res = await apiPost('/bookings', body);
        if (!res.success) {
            alert(res.error || 'Не удалось создать запись');
        } else {
            alert('Запись успешно создана!');
            await loadMyBookings();
        }
    } catch (e) {
        logError(e);
        alert('Ошибка создания записи');
    } finally {
        btn.textContent = 'Подтвердить запись';
        setConfirmEnabled();
    }
}

async function loadMyBookings() {
    const container = document.getElementById('myBookings');
    if (!state.telegramUser) {
        container.textContent = 'Нет данных о пользователе';
        return;
    }
    container.textContent = 'Загрузка записей...';
    try {
        const res = await apiGet('/telegram/my-bookings', {
            telegram_id: state.telegramUser.id
        });
        if (!res.success) {
            container.textContent = res.error || 'Ошибка загрузки записей';
            return;
        }
        const bookings = res.data || [];
        if (bookings.length === 0) {
            container.textContent = 'У вас пока нет записей';
            return;
        }

        container.innerHTML = '';
        bookings.forEach(b => {
            const div = document.createElement('div');
            div.className = 'booking-card';
            const d = b.date;
            const t = b.time;
            const serviceName = b.service_name || 'Услуга';
            const specName = b.specialist_name || 'Специалист';
            const price = b.price || b.service_price || 0;
            const status = b.status || 'PENDING';

            div.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <strong>${serviceName}</strong>
                    <span class="badge bg-light text-dark">${status}</span>
                </div>
                <div class="small-muted mb-1">${d}, ${t}</div>
                <div class="small-muted mb-1">${specName}</div>
                <div class="small-muted">Стоимость: ${price} ₽</div>
            `;
            container.appendChild(div);
        });
    } catch (e) {
        logError(e);
        container.textContent = 'Ошибка загрузки записей';
    }
}

function setupEventHandlers() {
    const serviceSelect = document.getElementById('serviceSelect');
    const dateSelect = document.getElementById('dateSelect');
    const confirmButton = document.getElementById('confirmButton');

    serviceSelect.addEventListener('change', () => {
        state.selectedServiceId = serviceSelect.value || null;
        renderServiceDetails();
        loadDates();
    });

    dateSelect.addEventListener('change', () => {
        state.selectedDate = dateSelect.value || null;
        loadTimes();
    });

    confirmButton.addEventListener('click', () => {
        createBooking();
    });

    const myTab = document.getElementById('my-tab');
    myTab.addEventListener('shown.bs.tab', () => {
        loadMyBookings();
    });
}

async function boot() {
    setupEventHandlers();
    await initTelegramUser();
    await Promise.all([
        loadSalonInfo(),
        loadServices()
    ]);
    await loadMyBookings();
    setConfirmEnabled();
}

document.addEventListener('DOMContentLoaded', boot);


