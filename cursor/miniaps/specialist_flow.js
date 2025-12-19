// Раздел "Выбрать специалиста" для мини-приложения
// Структура: специалист -> категория -> услуга -> дата -> время -> подтверждение

const SPECIALIST_FLOW_API_BASE = '/api';

const specialistFlowState = {
    telegramUser: null,
    client: null,
    specialists: [],
    categories: [],
    services: [],
    selectedSpecialistId: null,
    selectedCategoryId: null,
    selectedServiceId: null,
    selectedDate: null,
    selectedTime: null,
    currentStep: 1
};

function spfApiGet(path, params) {
    const url = new URL(SPECIALIST_FLOW_API_BASE + path, window.location.origin);
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
                url.searchParams.set(k, v);
            }
        });
    }
    return fetch(url.toString()).then(r => r.json());
}

function spfApiPost(path, body) {
    return fetch(SPECIALIST_FLOW_API_BASE + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {})
    }).then(r => r.json());
}

async function spfInitTelegramClientIfNeeded() {
    if (specialistFlowState.client) return;

    const tg = window.Telegram && window.Telegram.WebApp;
    let user = null;

    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        user = tg.initDataUnsafe.user;
    } else {
        // Локальный тест без Telegram
        user = {
            id: 'local-test-user',
            first_name: 'Тест',
            last_name: 'Клиент',
            username: 'local_user'
        };
    }

    specialistFlowState.telegramUser = user;

    try {
        const res = await spfApiPost('/telegram/me', {
            telegram_id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            photo_url: user.photo_url
        });
        if (res.success) {
            specialistFlowState.client = res.data;
        }
    } catch (e) {
        console.error('Ошибка инициализации Telegram клиента для раздела специалистов', e);
    }
}

async function spfLoadBaseData() {
    const [specRes, catRes, servRes] = await Promise.all([
        spfApiGet('/specialists'),
        spfApiGet('/categories'),
        spfApiGet('/services')
    ]);

    specialistFlowState.specialists = specRes.success ? (specRes.data || []) : [];
    specialistFlowState.categories = catRes.success ? (catRes.data || []) : [];
    specialistFlowState.services = servRes.success ? (servRes.data || []) : [];
}

function spfRender(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div id="specialist-flow-section" style="
            position: fixed;
            inset: 0;
            max-width: 500px;
            margin: 0 auto;
            background-color: #f9f9f9;
            padding: 20px;
            overflow-y: auto;
            z-index: 1000;
        ">
            <div class="section-title" style="justify-content: space-between; margin-bottom: 10px;">
                <span><i class="fas fa-user-tie"></i> Выбор специалиста</span>
                <button id="spf-close" style="
                    border: none;
                    background: transparent;
                    color: #7f8c8d;
                    font-size: 14px;
                    cursor: pointer;
                ">Закрыть</button>
            </div>

            <div class="info-section spf-step" id="spf-step-1">
                <div class="info-item">
                    <div class="info-icon"><i class="fas fa-user-tie"></i></div>
                    <div class="info-content">
                        <h3>1. Специалист</h3>
                        <p>Выберите мастера</p>
                        <select id="spf-specialist" class="sf-select" style="display: none;">
                            <option value="">Выберите специалиста</option>
                        </select>
                        <div id="spf-specialist-list"></div>
                    </div>
                </div>
            </div>

            <div class="info-section spf-step" id="spf-step-2" style="display: none;">
                <button type="button" id="spf-back-2" style="
                    border: none;
                    background: transparent;
                    color: #3498db;
                    font-size: 13px;
                    margin-bottom: 10px;
                    cursor: pointer;
                ">&larr; Назад к выбору специалиста</button>
                <div class="info-item">
                    <div class="info-icon"><i class="fas fa-tags"></i></div>
                    <div class="info-content">
                        <h3>2. Категория</h3>
                        <p>Выберите категорию услуг, которую выполняет выбранный специалист</p>
                        <select id="spf-category" class="sf-select" disabled style="display: none;">
                            <option value="">Сначала выберите специалиста</option>
                        </select>
                        <div id="spf-category-list"></div>
                    </div>
                </div>
            </div>

            <div class="info-section spf-step" id="spf-step-3" style="display: none;">
                <button type="button" id="spf-back-3" style="
                    border: none;
                    background: transparent;
                    color: #3498db;
                    font-size: 13px;
                    margin-bottom: 10px;
                    cursor: pointer;
                ">&larr; Назад к выбору категории</button>
                <div class="info-item">
                    <div class="info-icon"><i class="fas fa-list-ul"></i></div>
                    <div class="info-content">
                        <h3>3. Услуга</h3>
                        <p>Выберите услугу из выбранной категории</p>
                        <select id="spf-service" class="sf-select" disabled style="display: none;">
                            <option value="">Сначала выберите категорию</option>
                        </select>
                        <div id="spf-service-list"></div>
                        <p id="spf-service-details" style="font-size: 13px; color: #666; margin-top: 5px;"></p>
                    </div>
                </div>
            </div>

            <div class="info-section spf-step" id="spf-step-4" style="display: none;">
                <button type="button" id="spf-back-4" style="
                    border: none;
                    background: transparent;
                    color: #3498db;
                    font-size: 13px;
                    margin-bottom: 10px;
                    cursor: pointer;
                ">&larr; Назад к выбору услуги</button>
                <div class="info-item">
                    <div class="info-icon"><i class="fas fa-calendar-alt"></i></div>
                    <div class="info-content">
                        <h3>4. Дата</h3>
                        <p>Выберите удобную дату для записи</p>
                        <select id="spf-date" class="sf-select" disabled style="display: none;">
                            <option value="">Сначала выберите услугу</option>
                        </select>
                        <div id="spf-calendar" style="margin-top: 5px; font-size: 14px; color: #666;">
                            Сначала выберите услугу
                        </div>
                    </div>
                </div>
            </div>

            <div class="info-section spf-step" id="spf-step-5" style="display: none;">
                <button type="button" id="spf-back-5" style="
                    border: none;
                    background: transparent;
                    color: #3498db;
                    font-size: 13px;
                    margin-bottom: 10px;
                    cursor: pointer;
                ">&larr; Назад к выбору даты</button>
                <div class="info-item">
                <div class="info-icon"><i class="fas fa-clock"></i></div>
                <div class="info-content">
                    <h3>5. Время</h3>
                    <p>Выберите удобное время для записи</p>
                    <div id="spf-time-container" style="margin-top: 5px; font-size: 14px; color: #666;">
                        Сначала выберите дату
                    </div>
                </div>
            </div>

            <div class="highlight">
                <p id="spf-summary-text" style="margin-bottom: 10px;">
                    Пожалуйста, заполните все шаги выше.
                </p>
                <button id="spf-confirm" style="
                    width: 100%;
                    padding: 10px 15px;
                    border: none;
                    border-radius: 8px;
                    background-color: #e74c3c;
                    color: white;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    opacity: 0.7;
                " disabled>
                    Подтвердить запись
                </button>
            </div>
        </div>
    `;

    spfFillSpecialists();
    spfBindEvents();
    spfGoToStep(1);
}

function spfGoToStep(step) {
    specialistFlowState.currentStep = step;
    const steps = document.querySelectorAll('.spf-step');
    steps.forEach(el => {
        el.style.display = 'none';
    });
    const current = document.getElementById(`spf-step-${step}`);
    if (current) {
        current.style.display = 'block';
    }
}

function spfFillSpecialists() {
    const select = document.getElementById('spf-specialist');
    const list = document.getElementById('spf-specialist-list');
    if (!select || !list) return;

    select.innerHTML = '<option value="">Выберите специалиста</option>';
    list.innerHTML = '';

    // Показываем только активных специалистов
    const activeSpecialists = specialistFlowState.specialists.filter(sp => sp.is_active);

    activeSpecialists.forEach(sp => {
        const opt = document.createElement('option');
        opt.value = sp.id;
        opt.textContent = sp.name;
        select.appendChild(opt);

        const item = document.createElement('div');
        item.style.padding = '10px 12px';
        item.style.borderRadius = '8px';
        item.style.border = '1px solid #eee';
        item.style.marginBottom = '8px';
        item.style.cursor = 'pointer';
        item.style.backgroundColor = '#f8f9fa';
        item.style.display = 'flex';
        item.style.alignItems = 'center';

        const photoHtml = sp.photo
            ? `<div style="width:40px;height:40px;border-radius:50%;overflow:hidden;margin-right:10px;flex-shrink:0;">
                    <img src="${sp.photo}" alt="${sp.name}" style="width:100%;height:100%;object-fit:cover;">
               </div>`
            : `<div style="width:40px;height:40px;border-radius:50%;overflow:hidden;margin-right:10px;flex-shrink:0;background:#eef5ff;display:flex;align-items:center;justify-content:center;color:#e74c3c;font-weight:600;">
                    ${(sp.name || '?').charAt(0)}
               </div>`;

        item.innerHTML = `
            ${photoHtml}
            <div>
                <strong>${sp.name}</strong><br>
                <span style="font-size:13px;color:#666;">${sp.position || ''}</span>
            </div>
        `;

        item.addEventListener('click', () => {
            specialistFlowState.selectedSpecialistId = sp.id;
            // визуальное выделение
            Array.from(list.children).forEach(ch => {
                ch.style.backgroundColor = '#f8f9fa';
                ch.style.borderColor = '#eee';
            });
            item.style.backgroundColor = '#eef5ff';
            item.style.borderColor = '#e74c3c';

            // триггерим ту же логику, что и при change селекта
            const specSelect = document.getElementById('spf-specialist');
            if (specSelect) {
                specSelect.value = sp.id;
                specSelect.dispatchEvent(new Event('change'));
            }
        });

        list.appendChild(item);
    });
}

function spfFillCategories() {
    const select = document.getElementById('spf-category');
    const list = document.getElementById('spf-category-list');
    const specialistId = specialistFlowState.selectedSpecialistId;
    if (!select || !list) return;

    specialistFlowState.selectedCategoryId = null;
    specialistFlowState.selectedServiceId = null;
    document.getElementById('spf-service-details').textContent = '';

    if (!specialistId) {
        select.innerHTML = '<option value="">Сначала выберите специалиста</option>';
        select.disabled = true;
        list.innerHTML = '<p style="font-size:13px;color:#666;">Сначала выберите специалиста</p>';
        return;
    }

    const specialist = specialistFlowState.specialists.find(sp => sp.id === Number(specialistId));
    if (!specialist || !specialist.services || specialist.services.length === 0) {
        select.innerHTML = '<option value="">У этого специалиста нет услуг</option>';
        select.disabled = true;
        list.innerHTML = '<p style="font-size:13px;color:#666;">У этого специалиста нет услуг</p>';
        return;
    }

    // Получаем категории услуг, которые выполняет специалист
    const specialistServiceIds = specialist.services.map(s => s.id);
    const specialistServices = specialistFlowState.services.filter(s => 
        specialistServiceIds.includes(s.id) && s.online_booking
    );
    
    const categoryIds = new Set(specialistServices.map(s => s.category_id));
    const availableCategories = specialistFlowState.categories.filter(c => categoryIds.has(c.id));

    if (availableCategories.length === 0) {
        select.innerHTML = '<option value="">Нет доступных категорий</option>';
        select.disabled = true;
        list.innerHTML = '<p style="font-size:13px;color:#666;">Нет доступных категорий</p>';
        return;
    }

    select.disabled = false;
    select.innerHTML = '<option value="">Выберите категорию</option>';
    list.innerHTML = '';

    availableCategories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        select.appendChild(opt);

        const item = document.createElement('div');
        item.style.padding = '10px 12px';
        item.style.borderRadius = '8px';
        item.style.border = '1px solid #eee';
        item.style.marginBottom = '8px';
        item.style.cursor = 'pointer';
        item.style.backgroundColor = '#f8f9fa';
        item.textContent = c.name;

        item.addEventListener('click', () => {
            specialistFlowState.selectedCategoryId = c.id;
            // визуальное выделение
            Array.from(list.children).forEach(ch => {
                ch.style.backgroundColor = '#f8f9fa';
                ch.style.borderColor = '#eee';
            });
            item.style.backgroundColor = '#eef5ff';
            item.style.borderColor = '#e74c3c';

            // триггерим ту же логику, что и при change селекта
            const catSelect = document.getElementById('spf-category');
            if (catSelect) {
                catSelect.value = c.id;
                catSelect.dispatchEvent(new Event('change'));
            }
        });

        list.appendChild(item);
    });
}

function spfFillServices() {
    const select = document.getElementById('spf-service');
    const list = document.getElementById('spf-service-list');
    const specialistId = specialistFlowState.selectedSpecialistId;
    const categoryId = specialistFlowState.selectedCategoryId;
    if (!select || !list) return;

    specialistFlowState.selectedServiceId = null;
    document.getElementById('spf-service-details').textContent = '';

    if (!specialistId || !categoryId) {
        select.innerHTML = '<option value="">Сначала выберите специалиста и категорию</option>';
        select.disabled = true;
        list.innerHTML = '<p style="font-size:13px;color:#666;">Сначала выберите специалиста и категорию</p>';
        return;
    }

    const specialist = specialistFlowState.specialists.find(sp => sp.id === Number(specialistId));
    if (!specialist || !specialist.services || specialist.services.length === 0) {
        select.innerHTML = '<option value="">У этого специалиста нет услуг</option>';
        select.disabled = true;
        list.innerHTML = '<p style="font-size:13px;color:#666;">У этого специалиста нет услуг</p>';
        return;
    }

    // Получаем услуги специалиста из выбранной категории
    const specialistServiceIds = specialist.services.map(s => s.id);
    const services = specialistFlowState.services.filter(s => 
        specialistServiceIds.includes(s.id) && 
        s.category_id === Number(categoryId) && 
        s.online_booking
    );

    if (services.length === 0) {
        select.innerHTML = '<option value="">В этой категории нет доступных услуг</option>';
        select.disabled = true;
        list.innerHTML = '<p style="font-size:13px;color:#666;">В этой категории нет доступных услуг</p>';
        return;
    }

    select.disabled = false;
    select.innerHTML = '<option value="">Выберите услугу</option>';
    list.innerHTML = '';

    services.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.name} (${s.duration} мин, ${s.price} ₽)`;
        select.appendChild(opt);

        const item = document.createElement('div');
        item.style.padding = '10px 12px';
        item.style.borderRadius = '8px';
        item.style.border = '1px solid #eee';
        item.style.marginBottom = '8px';
        item.style.cursor = 'pointer';
        item.style.backgroundColor = '#f8f9fa';
        const desc = s.description || 'Описание отсутствует';
        item.innerHTML = `
            <strong>${s.name}</strong><br>
            <span style="font-size:13px;color:#666;">${s.duration} мин · ${s.price} ₽</span><br>
            <span style="font-size:12px;color:#888;display:block;margin-top:3px;">${desc}</span>
        `;

        item.addEventListener('click', () => {
            specialistFlowState.selectedServiceId = s.id;
            Array.from(list.children).forEach(ch => {
                ch.style.backgroundColor = '#f8f9fa';
                ch.style.borderColor = '#eee';
            });
            item.style.backgroundColor = '#eef5ff';
            item.style.borderColor = '#e74c3c';

            const servSelect = document.getElementById('spf-service');
            if (servSelect) {
                servSelect.value = s.id;
                servSelect.dispatchEvent(new Event('change'));
            }
        });

        list.appendChild(item);
    });
}

async function spfLoadDates() {
    const select = document.getElementById('spf-date');
    const serviceId = specialistFlowState.selectedServiceId;
    const specialistId = specialistFlowState.selectedSpecialistId;

    specialistFlowState.selectedDate = null;
    specialistFlowState.selectedTime = null;
    spfRenderTimesPlaceholder('Сначала выберите дату');
    spfUpdateSummaryAndButton();

    if (!select) return;

    if (!serviceId || !specialistId) {
        select.innerHTML = '<option value="">Сначала выберите услугу и специалиста</option>';
        select.disabled = true;
        return;
    }

    select.disabled = false;
    select.innerHTML = '<option value="">Загрузка доступных дат...</option>';

    try {
        const res = await spfApiGet('/bookings/available-dates', {
            service_id: serviceId,
            specialist_id: specialistId,
            days_ahead: 14
        });

        if (!res.success) {
            select.innerHTML = `<option value="">${res.error || 'Ошибка загрузки дат'}</option>`;
            return;
        }

        const dates = res.data || [];
        if (dates.length === 0) {
            select.innerHTML = '<option value="">Нет доступных дат</option>';
            return;
        }

        select.innerHTML = '<option value="">Выберите дату</option>';
        dates.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d;
            const dateObj = new Date(d + 'T00:00:00');
            const formatter = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
            opt.textContent = formatter.format(dateObj);
            select.appendChild(opt);
        });

        spfRenderCalendar(dates);
    } catch (e) {
        console.error('Ошибка загрузки дат', e);
        select.innerHTML = '<option value="">Ошибка загрузки дат</option>';
    }
}

function spfRenderCalendar(dates) {
    const calendar = document.getElementById('spf-calendar');
    if (!calendar) return;

    if (!dates || dates.length === 0) {
        calendar.textContent = 'Нет доступных дат';
        return;
    }

    const set = new Set(dates);
    calendar.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.style.display = 'grid';
    wrapper.style.gridTemplateColumns = 'repeat(4, 1fr)';
    wrapper.style.gap = '8px';

    dates.forEach(d => {
        const dateObj = new Date(d + 'T00:00:00');
        const day = dateObj.getDate();
        const month = dateObj.getMonth() + 1;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.style.padding = '8px 6px';
        btn.style.borderRadius = '8px';
        btn.style.border = '1px solid #ddd';
        btn.style.backgroundColor = '#fff';
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '13px';
        btn.innerHTML = `<strong>${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}</strong>`;

        if (!set.has(d)) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        }

        if (specialistFlowState.selectedDate === d) {
            btn.style.backgroundColor = '#eef5ff';
            btn.style.borderColor = '#e74c3c';
            btn.style.color = '#c0392b';
        }

        btn.addEventListener('click', () => {
            specialistFlowState.selectedDate = d;
            specialistFlowState.selectedTime = null;
            Array.from(wrapper.children).forEach(ch => {
                ch.style.backgroundColor = '#fff';
                ch.style.borderColor = '#ddd';
                ch.style.color = '#333';
            });
            btn.style.backgroundColor = '#eef5ff';
            btn.style.borderColor = '#e74c3c';
            btn.style.color = '#c0392b';
            spfLoadTimes();
            spfUpdateSummaryAndButton();
            spfGoToStep(5);
        });

        wrapper.appendChild(btn);
    });

    calendar.appendChild(wrapper);
}

async function spfLoadTimes() {
    const container = document.getElementById('spf-time-container');
    const serviceId = specialistFlowState.selectedServiceId;
    const specialistId = specialistFlowState.selectedSpecialistId;
    const date = specialistFlowState.selectedDate;

    specialistFlowState.selectedTime = null;
    spfUpdateSummaryAndButton();

    if (!container) return;

    if (!serviceId || !specialistId || !date) {
        spfRenderTimesPlaceholder('Сначала выберите услугу, специалиста и дату');
        return;
    }

    container.textContent = 'Загрузка времени...';

    try {
        const res = await spfApiGet('/bookings/available-times', {
            service_id: serviceId,
            specialist_id: specialistId,
            date: date
        });

        if (!res.success) {
            container.textContent = res.error || 'Ошибка загрузки времени';
            return;
        }

        const items = res.data || [];
        if (items.length === 0) {
            container.textContent = 'Нет доступного времени на выбранную дату';
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexWrap = 'wrap';
        wrapper.style.gap = '8px';

        items.forEach(slot => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = slot.time;
            btn.style.padding = '6px 10px';
            btn.style.borderRadius = '999px';
            btn.style.border = '1px solid #ddd';
            btn.style.backgroundColor = '#fff';
            btn.style.cursor = 'pointer';
            btn.style.fontSize = '13px';

            btn.addEventListener('click', () => {
                specialistFlowState.selectedTime = slot.time;
                Array.from(wrapper.children).forEach(ch => {
                    ch.style.backgroundColor = '#fff';
                    ch.style.borderColor = '#ddd';
                    ch.style.color = '#333';
                });
                btn.style.backgroundColor = '#eef5ff';
                btn.style.borderColor = '#e74c3c';
                btn.style.color = '#c0392b';
                spfUpdateSummaryAndButton();
            });

            wrapper.appendChild(btn);
        });

        container.innerHTML = '';
        container.appendChild(wrapper);
    } catch (e) {
        console.error('Ошибка загрузки времени', e);
        container.textContent = 'Ошибка загрузки времени';
    }
}

function spfRenderTimesPlaceholder(text) {
    const container = document.getElementById('spf-time-container');
    if (!container) return;
    container.textContent = text;
}

function spfUpdateSummaryAndButton() {
    const summary = document.getElementById('spf-summary-text');
    const btn = document.getElementById('spf-confirm');

    if (!summary || !btn) return;

    const specialist = specialistFlowState.specialists.find(sp => sp.id === Number(specialistFlowState.selectedSpecialistId));
    const category = specialistFlowState.categories.find(c => c.id === Number(specialistFlowState.selectedCategoryId));
    const service = specialistFlowState.services.find(s => s.id === Number(specialistFlowState.selectedServiceId));
    const date = specialistFlowState.selectedDate;
    const time = specialistFlowState.selectedTime;

    if (!specialist || !category || !service || !date || !time) {
        summary.textContent = 'Пожалуйста, заполните все шаги выше.';
        btn.disabled = true;
        btn.style.opacity = '0.7';
        return;
    }

    summary.textContent = `Вы записываетесь к мастеру ${specialist.name} на услугу «${service.name}» (${category.name}) на ${date} в ${time}.`;
    btn.disabled = false;
    btn.style.opacity = '1';
}

async function spfCreateBooking() {
    await spfInitTelegramClientIfNeeded();

    if (!specialistFlowState.client) {
        alert('Не удалось определить клиента. Попробуйте позже.');
        return;
    }

    const specialist = specialistFlowState.specialists.find(sp => sp.id === Number(specialistFlowState.selectedSpecialistId));
    const category = specialistFlowState.categories.find(c => c.id === Number(specialistFlowState.selectedCategoryId));
    const service = specialistFlowState.services.find(s => s.id === Number(specialistFlowState.selectedServiceId));
    const date = specialistFlowState.selectedDate;
    const time = specialistFlowState.selectedTime;

    if (!specialist || !category || !service || !date || !time) {
        alert('Пожалуйста, заполните все шаги перед подтверждением.');
        return;
    }

    const btn = document.getElementById('spf-confirm');
    btn.disabled = true;
    btn.textContent = 'Создаём запись...';

    try {
        const body = {
            client_id: specialistFlowState.client.id,
            specialist_id: specialist.id,
            service_id: service.id,
            date: date,
            time: time,
            duration: service.duration,
            price: service.price,
            status: 'PENDING',
            payment_method: null,
            comment: 'Запись из Telegram Mini App (выбор специалиста)'
        };

        const res = await spfApiPost('/bookings', body);
        if (!res.success) {
            alert(res.error || 'Не удалось создать запись');
        } else {
            // Уведомление об успешной записи + закрытие приложения/экрана
            if (window.Telegram && window.Telegram.WebApp) {
                const tg = window.Telegram.WebApp;
                try {
                    tg.showAlert('Запись успешно создана!');
                } catch (e) {
                    console.error(e);
                }
                setTimeout(() => {
                    try {
                        tg.close();
                    } catch (e) {
                        console.error(e);
                    }
                }, 2000);
            } else {
                alert('Запись успешно создана!');
                const section = document.getElementById('specialist-flow-section');
                if (section) {
                    section.remove();
                }
            }
        }
    } catch (e) {
        console.error('Ошибка создания записи', e);
        alert('Ошибка создания записи');
    } finally {
        btn.textContent = 'Подтвердить запись';
        spfUpdateSummaryAndButton();
    }
}

function spfBindEvents() {
    const specSelect = document.getElementById('spf-specialist');
    const catSelect = document.getElementById('spf-category');
    const servSelect = document.getElementById('spf-service');
    const dateSelect = document.getElementById('spf-date');
    const confirmBtn = document.getElementById('spf-confirm');
    const closeBtn = document.getElementById('spf-close');
    const back2 = document.getElementById('spf-back-2');
    const back3 = document.getElementById('spf-back-3');
    const back4 = document.getElementById('spf-back-4');
    const back5 = document.getElementById('spf-back-5');

    if (!specSelect || !catSelect || !servSelect || !dateSelect || !confirmBtn) return;

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const section = document.getElementById('specialist-flow-section');
            if (section) {
                section.remove();
            }
        });
    }
    if (back2) back2.addEventListener('click', () => spfGoToStep(1));
    if (back3) back3.addEventListener('click', () => spfGoToStep(2));
    if (back4) back4.addEventListener('click', () => spfGoToStep(3));
    if (back5) back5.addEventListener('click', () => spfGoToStep(4));

    specSelect.addEventListener('change', () => {
        specialistFlowState.selectedSpecialistId = specSelect.value || null;
        specialistFlowState.selectedCategoryId = null;
        specialistFlowState.selectedServiceId = null;
        specialistFlowState.selectedDate = null;
        specialistFlowState.selectedTime = null;
        spfFillCategories();
        spfFillServices();
        const dateSel = document.getElementById('spf-date');
        if (dateSel) {
            dateSel.innerHTML = '<option value="">Сначала выберите услугу</option>';
            dateSel.disabled = true;
        }
        spfRenderTimesPlaceholder('Сначала выберите дату');
        spfUpdateSummaryAndButton();
        if (specialistFlowState.selectedSpecialistId) {
            spfGoToStep(2);
        }
    });

    catSelect.addEventListener('change', () => {
        specialistFlowState.selectedCategoryId = catSelect.value || null;
        specialistFlowState.selectedServiceId = null;
        specialistFlowState.selectedDate = null;
        specialistFlowState.selectedTime = null;
        spfFillServices();
        const dateSel = document.getElementById('spf-date');
        if (dateSel) {
            dateSel.innerHTML = '<option value="">Сначала выберите услугу</option>';
            dateSel.disabled = true;
        }
        spfRenderTimesPlaceholder('Сначала выберите дату');
        spfUpdateSummaryAndButton();
        if (specialistFlowState.selectedCategoryId) {
            spfGoToStep(3);
        }
    });

    servSelect.addEventListener('change', () => {
        specialistFlowState.selectedServiceId = servSelect.value || null;
        specialistFlowState.selectedDate = null;
        specialistFlowState.selectedTime = null;

        const service = specialistFlowState.services.find(s => s.id === Number(specialistFlowState.selectedServiceId));
        const details = document.getElementById('spf-service-details');
        if (service && details) {
            details.textContent = `${service.description || 'Описание отсутствует'} · ${service.duration} мин · ${service.price} ₽`;
        } else if (details) {
            details.textContent = '';
        }

        spfLoadDates();
        spfRenderTimesPlaceholder('Сначала выберите дату');
        spfUpdateSummaryAndButton();
        if (specialistFlowState.selectedServiceId) {
            spfGoToStep(4);
        }
    });

    dateSelect.addEventListener('change', () => {
        specialistFlowState.selectedDate = dateSelect.value || null;
        specialistFlowState.selectedTime = null;
        spfLoadTimes();
        spfUpdateSummaryAndButton();
        if (specialistFlowState.selectedDate) {
            spfGoToStep(5);
        }
    });

    confirmBtn.addEventListener('click', () => {
        spfCreateBooking();
    });
}

// Публичная функция для инициализации раздела
async function initSpecialistFlowSection(containerId) {
    await spfInitTelegramClientIfNeeded();
    await spfLoadBaseData();
    spfRender(containerId);
}

