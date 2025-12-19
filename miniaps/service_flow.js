// Раздел "Выбрать услуги" для мини-приложения
// Структура: категория -> услуга -> специалист -> дата -> время -> подтверждение

const SERVICE_FLOW_API_BASE = '/api';

const serviceFlowState = {
    telegramUser: null,
    client: null,
    categories: [],
    services: [],
    specialists: [],
    selectedCategoryId: null,
    selectedServiceId: null,
    selectedSpecialistId: null,
    selectedDate: null,
    selectedTime: null,
    currentStep: 1
};

function sfApiGet(path, params) {
    const url = new URL(SERVICE_FLOW_API_BASE + path, window.location.origin);
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
                url.searchParams.set(k, v);
            }
        });
    }
    return fetch(url.toString()).then(r => r.json());
}

function sfApiPost(path, body) {
    return fetch(SERVICE_FLOW_API_BASE + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {})
    }).then(r => r.json());
}

async function sfInitTelegramClientIfNeeded() {
    if (serviceFlowState.client) return;

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

    serviceFlowState.telegramUser = user;

    try {
        const res = await sfApiPost('/telegram/me', {
            telegram_id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            photo_url: user.photo_url
        });
        if (res.success) {
            serviceFlowState.client = res.data;
        }
    } catch (e) {
        console.error('Ошибка инициализации Telegram клиента для раздела услуг', e);
    }
}

async function sfLoadBaseData() {
    const [catRes, servRes, specRes] = await Promise.all([
        sfApiGet('/categories'),
        sfApiGet('/services'),
        sfApiGet('/specialists')
    ]);

    serviceFlowState.categories = catRes.success ? (catRes.data || []) : [];
    serviceFlowState.services = servRes.success ? (servRes.data || []) : [];
    serviceFlowState.specialists = specRes.success ? (specRes.data || []) : [];
}

function sfRender(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div id="service-flow-section" style="
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
                <span><i class="fas fa-spa"></i> Выбор услуги</span>
                <button id="sf-close" style="
                    border: none;
                    background: transparent;
                    color: #7f8c8d;
                    font-size: 14px;
                    cursor: pointer;
                ">Закрыть</button>
            </div>

            <div class="info-section sf-step" id="sf-step-1">
                <div class="info-item">
                    <div class="info-icon"><i class="fas fa-tags"></i></div>
                    <div class="info-content">
                        <h3>1. Категория</h3>
                        <p>Выберите категорию услуг</p>
                        <select id="sf-category" class="sf-select" style="display: none;">
                            <option value="">Выберите категорию</option>
                        </select>
                        <div id="sf-category-list"></div>
                    </div>
                </div>
            </div>

            <div class="info-section sf-step" id="sf-step-2" style="display: none;">
                <button type="button" id="sf-back-2" style="
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
                        <h3>2. Услуга</h3>
                        <p>Выберите услугу из выбранной категории</p>
                        <select id="sf-service" class="sf-select" disabled style="display: none;">
                            <option value="">Сначала выберите категорию</option>
                        </select>
                        <div id="sf-service-list"></div>
                        <p id="sf-service-details" style="font-size: 13px; color: #666; margin-top: 5px;"></p>
                    </div>
                </div>
            </div>

            <div class="info-section sf-step" id="sf-step-3" style="display: none;">
                <button type="button" id="sf-back-3" style="
                    border: none;
                    background: transparent;
                    color: #3498db;
                    font-size: 13px;
                    margin-bottom: 10px;
                    cursor: pointer;
                ">&larr; Назад к выбору услуги</button>
                <div class="info-item">
                    <div class="info-icon"><i class="fas fa-user-tie"></i></div>
                    <div class="info-content">
                        <h3>3. Специалист</h3>
                        <p>Выберите мастера, который выполняет выбранную услугу</p>
                        <select id="sf-specialist" class="sf-select" disabled style="display: none;">
                            <option value="">Сначала выберите услугу</option>
                        </select>
                        <div id="sf-specialist-list"></div>
                    </div>
                </div>
            </div>

            <div class="info-section sf-step" id="sf-step-4" style="display: none;">
                <button type="button" id="sf-back-4" style="
                    border: none;
                    background: transparent;
                    color: #3498db;
                    font-size: 13px;
                    margin-bottom: 10px;
                    cursor: pointer;
                ">&larr; Назад к выбору специалиста</button>
                <div class="info-item">
                    <div class="info-icon"><i class="fas fa-calendar-alt"></i></div>
                    <div class="info-content">
                        <h3>4. Дата</h3>
                        <p>Выберите удобную дату для записи</p>
                        <select id="sf-date" class="sf-select" disabled style="display: none;">
                            <option value="">Сначала выберите специалиста</option>
                        </select>
                        <div id="sf-calendar" style="margin-top: 5px; font-size: 14px; color: #666;">
                            Сначала выберите специалиста
                        </div>
                    </div>
                </div>
            </div>

            <div class="info-section sf-step" id="sf-step-5" style="display: none;">
                <button type="button" id="sf-back-5" style="
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
                    <div id="sf-time-container" style="margin-top: 5px; font-size: 14px; color: #666;">
                        Сначала выберите дату
                    </div>
                </div>
            </div>

            <div class="highlight">
                <p id="sf-summary-text" style="margin-bottom: 10px;">
                    Пожалуйста, заполните все шаги выше.
                </p>
                <button id="sf-confirm" style="
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

    sfFillCategories();
    sfBindEvents();
    sfGoToStep(1);
}

function sfGoToStep(step) {
    serviceFlowState.currentStep = step;
    const steps = document.querySelectorAll('.sf-step');
    steps.forEach(el => {
        el.style.display = 'none';
    });
    const current = document.getElementById(`sf-step-${step}`);
    if (current) {
        current.style.display = 'block';
    }
}

function sfFillCategories() {
    const select = document.getElementById('sf-category');
    const list = document.getElementById('sf-category-list');
    if (!select || !list) return;

    select.innerHTML = '<option value="">Выберите категорию</option>';
    list.innerHTML = '';

    serviceFlowState.categories.forEach(c => {
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
            serviceFlowState.selectedCategoryId = c.id;
            // визуальное выделение
            Array.from(list.children).forEach(ch => {
                ch.style.backgroundColor = '#f8f9fa';
                ch.style.borderColor = '#eee';
            });
            item.style.backgroundColor = '#eef5ff';
            item.style.borderColor = '#e74c3c';

            // триггерим ту же логику, что и при change селекта
            const catSelect = document.getElementById('sf-category');
            if (catSelect) {
                catSelect.value = c.id;
                catSelect.dispatchEvent(new Event('change'));
            }
        });

        list.appendChild(item);
    });
}

function sfFillServices() {
    const select = document.getElementById('sf-service');
    const list = document.getElementById('sf-service-list');
    const categoryId = serviceFlowState.selectedCategoryId;
    if (!select || !list) return;

    serviceFlowState.selectedServiceId = null;
    document.getElementById('sf-service-details').textContent = '';

    if (!categoryId) {
        select.innerHTML = '<option value="">Сначала выберите категорию</option>';
        select.disabled = true;
        list.innerHTML = '<p style="font-size:13px;color:#666;">Сначала выберите категорию</p>';
        return;
    }

    const services = serviceFlowState.services.filter(
        s => s.category_id === Number(categoryId) && s.online_booking
    );

    if (services.length === 0) {
        select.innerHTML = '<option value="">В этой категории нет онлайн-услуг</option>';
        select.disabled = true;
        list.innerHTML = '<p style="font-size:13px;color:#666;">В этой категории нет онлайн-услуг</p>';
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
            serviceFlowState.selectedServiceId = s.id;
            Array.from(list.children).forEach(ch => {
                ch.style.backgroundColor = '#f8f9fa';
                ch.style.borderColor = '#eee';
            });
            item.style.backgroundColor = '#eef5ff';
            item.style.borderColor = '#e74c3c';

            const servSelect = document.getElementById('sf-service');
            if (servSelect) {
                servSelect.value = s.id;
                servSelect.dispatchEvent(new Event('change'));
            }
        });

        list.appendChild(item);
    });
}

function sfFillSpecialists() {
    const select = document.getElementById('sf-specialist');
    const list = document.getElementById('sf-specialist-list');
    if (!select || !list) return;

    serviceFlowState.selectedSpecialistId = null;

    const serviceId = serviceFlowState.selectedServiceId;
    if (!serviceId) {
        select.innerHTML = '<option value="">Сначала выберите услугу</option>';
        select.disabled = true;
        list.innerHTML = '<p style="font-size:13px;color:#666;">Сначала выберите услугу</p>';
        return;
    }

    const specialists = serviceFlowState.specialists.filter(sp => {
        const services = sp.services || [];
        return services.some(s => s.id === Number(serviceId));
    });

    if (specialists.length === 0) {
        select.innerHTML = '<option value="">Нет специалистов для этой услуги</option>';
        select.disabled = true;
        list.innerHTML = '<p style="font-size:13px;color:#666;">Нет специалистов для этой услуги</p>';
        return;
    }

    select.disabled = false;
    select.innerHTML = '<option value="">Выберите специалиста</option>';
    list.innerHTML = '';

    specialists.forEach(sp => {
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
            serviceFlowState.selectedSpecialistId = sp.id;
            Array.from(list.children).forEach(ch => {
                ch.style.backgroundColor = '#f8f9fa';
                ch.style.borderColor = '#eee';
            });
            item.style.backgroundColor = '#eef5ff';
            item.style.borderColor = '#e74c3c';

            const specSelect = document.getElementById('sf-specialist');
            if (specSelect) {
                specSelect.value = sp.id;
                specSelect.dispatchEvent(new Event('change'));
            }
        });

        list.appendChild(item);
    });
}

async function sfLoadDates() {
    const select = document.getElementById('sf-date');
    const serviceId = serviceFlowState.selectedServiceId;
    const specialistId = serviceFlowState.selectedSpecialistId;

    serviceFlowState.selectedDate = null;
    serviceFlowState.selectedTime = null;
    sfRenderTimesPlaceholder('Сначала выберите дату');
    sfUpdateSummaryAndButton();

    if (!select) return;

    if (!serviceId || !specialistId) {
        select.innerHTML = '<option value="">Сначала выберите услугу и специалиста</option>';
        select.disabled = true;
        return;
    }

    select.disabled = false;
    select.innerHTML = '<option value="">Загрузка доступных дат...</option>';

    try {
        const res = await sfApiGet('/bookings/available-dates', {
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

        sfRenderCalendar(dates);
    } catch (e) {
        console.error('Ошибка загрузки дат', e);
        select.innerHTML = '<option value="">Ошибка загрузки дат</option>';
    }
}

function sfRenderCalendar(dates) {
    const calendar = document.getElementById('sf-calendar');
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

        if (serviceFlowState.selectedDate === d) {
            btn.style.backgroundColor = '#eef5ff';
            btn.style.borderColor = '#e74c3c';
            btn.style.color = '#c0392b';
        }

        btn.addEventListener('click', () => {
            serviceFlowState.selectedDate = d;
            serviceFlowState.selectedTime = null;
            Array.from(wrapper.children).forEach(ch => {
                ch.style.backgroundColor = '#fff';
                ch.style.borderColor = '#ddd';
                ch.style.color = '#333';
            });
            btn.style.backgroundColor = '#eef5ff';
            btn.style.borderColor = '#e74c3c';
            btn.style.color = '#c0392b';
            sfLoadTimes();
            sfUpdateSummaryAndButton();
            sfGoToStep(5);
        });

        wrapper.appendChild(btn);
    });

    calendar.appendChild(wrapper);
}

async function sfLoadTimes() {
    const container = document.getElementById('sf-time-container');
    const serviceId = serviceFlowState.selectedServiceId;
    const specialistId = serviceFlowState.selectedSpecialistId;
    const date = serviceFlowState.selectedDate;

    serviceFlowState.selectedTime = null;
    sfUpdateSummaryAndButton();

    if (!container) return;

    if (!serviceId || !specialistId || !date) {
        sfRenderTimesPlaceholder('Сначала выберите услугу, специалиста и дату');
        return;
    }

    container.textContent = 'Загрузка времени...';

    try {
        const res = await sfApiGet('/bookings/available-times', {
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
                serviceFlowState.selectedTime = slot.time;
                Array.from(wrapper.children).forEach(ch => {
                    ch.style.backgroundColor = '#fff';
                    ch.style.borderColor = '#ddd';
                    ch.style.color = '#333';
                });
                btn.style.backgroundColor = '#eef5ff';
                btn.style.borderColor = '#e74c3c';
                btn.style.color = '#c0392b';
                sfUpdateSummaryAndButton();
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

function sfRenderTimesPlaceholder(text) {
    const container = document.getElementById('sf-time-container');
    if (!container) return;
    container.textContent = text;
}

function sfUpdateSummaryAndButton() {
    const summary = document.getElementById('sf-summary-text');
    const btn = document.getElementById('sf-confirm');

    if (!summary || !btn) return;

    const category = serviceFlowState.categories.find(c => c.id === Number(serviceFlowState.selectedCategoryId));
    const service = serviceFlowState.services.find(s => s.id === Number(serviceFlowState.selectedServiceId));
    const specialist = serviceFlowState.specialists.find(sp => sp.id === Number(serviceFlowState.selectedSpecialistId));
    const date = serviceFlowState.selectedDate;
    const time = serviceFlowState.selectedTime;

    if (!category || !service || !specialist || !date || !time) {
        summary.textContent = 'Пожалуйста, заполните все шаги выше.';
        btn.disabled = true;
        btn.style.opacity = '0.7';
        return;
    }

    summary.textContent = `Вы записываетесь на услугу «${service.name}» (${category.name}) к мастеру ${specialist.name} на ${date} в ${time}.`;
    btn.disabled = false;
    btn.style.opacity = '1';
}

async function sfCreateBooking() {
    await sfInitTelegramClientIfNeeded();

    if (!serviceFlowState.client) {
        alert('Не удалось определить клиента. Попробуйте позже.');
        return;
    }

    const category = serviceFlowState.categories.find(c => c.id === Number(serviceFlowState.selectedCategoryId));
    const service = serviceFlowState.services.find(s => s.id === Number(serviceFlowState.selectedServiceId));
    const specialist = serviceFlowState.specialists.find(sp => sp.id === Number(serviceFlowState.selectedSpecialistId));
    const date = serviceFlowState.selectedDate;
    const time = serviceFlowState.selectedTime;

    if (!category || !service || !specialist || !date || !time) {
        alert('Пожалуйста, заполните все шаги перед подтверждением.');
        return;
    }

    const btn = document.getElementById('sf-confirm');
    btn.disabled = true;
    btn.textContent = 'Создаём запись...';

    try {
        const body = {
            client_id: serviceFlowState.client.id,
            specialist_id: specialist.id,
            service_id: service.id,
            date: date,
            time: time,
            duration: service.duration,
            price: service.price,
            status: 'PENDING',
            payment_method: null,
            comment: 'Запись из Telegram Mini App (выбор услуги)'
        };

        const res = await sfApiPost('/bookings', body);
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
                const section = document.getElementById('service-flow-section');
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
        sfUpdateSummaryAndButton();
    }
}

function sfBindEvents() {
    const catSelect = document.getElementById('sf-category');
    const servSelect = document.getElementById('sf-service');
    const specSelect = document.getElementById('sf-specialist');
    const dateSelect = document.getElementById('sf-date');
    const confirmBtn = document.getElementById('sf-confirm');
    const closeBtn = document.getElementById('sf-close');
    const back2 = document.getElementById('sf-back-2');
    const back3 = document.getElementById('sf-back-3');
    const back4 = document.getElementById('sf-back-4');
    const back5 = document.getElementById('sf-back-5');

    if (!catSelect || !servSelect || !specSelect || !dateSelect || !confirmBtn) return;

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const section = document.getElementById('service-flow-section');
            if (section) {
                section.remove();
            }
        });
    }
    if (back2) back2.addEventListener('click', () => sfGoToStep(1));
    if (back3) back3.addEventListener('click', () => sfGoToStep(2));
    if (back4) back4.addEventListener('click', () => sfGoToStep(3));
    if (back5) back5.addEventListener('click', () => sfGoToStep(4));

    catSelect.addEventListener('change', () => {
        serviceFlowState.selectedCategoryId = catSelect.value || null;
        serviceFlowState.selectedServiceId = null;
        serviceFlowState.selectedSpecialistId = null;
        serviceFlowState.selectedDate = null;
        serviceFlowState.selectedTime = null;
        sfFillServices();
        sfFillSpecialists();
        const dateSel = document.getElementById('sf-date');
        if (dateSel) {
            dateSel.innerHTML = '<option value="">Сначала выберите специалиста</option>';
            dateSel.disabled = true;
        }
        sfRenderTimesPlaceholder('Сначала выберите дату');
        sfUpdateSummaryAndButton();
        if (serviceFlowState.selectedCategoryId) {
            sfGoToStep(2);
        }
    });

    servSelect.addEventListener('change', () => {
        serviceFlowState.selectedServiceId = servSelect.value || null;
        serviceFlowState.selectedSpecialistId = null;
        serviceFlowState.selectedDate = null;
        serviceFlowState.selectedTime = null;

        const service = serviceFlowState.services.find(s => s.id === Number(serviceFlowState.selectedServiceId));
        const details = document.getElementById('sf-service-details');
        if (service && details) {
            details.textContent = `${service.description || 'Описание отсутствует'} · ${service.duration} мин · ${service.price} ₽`;
        } else if (details) {
            details.textContent = '';
        }

        sfFillSpecialists();
        const dateSel = document.getElementById('sf-date');
        if (dateSel) {
            dateSel.innerHTML = '<option value="">Сначала выберите специалиста</option>';
            dateSel.disabled = true;
        }
        sfRenderTimesPlaceholder('Сначала выберите дату');
        sfUpdateSummaryAndButton();
        if (serviceFlowState.selectedServiceId) {
            sfGoToStep(3);
        }
    });

    specSelect.addEventListener('change', () => {
        serviceFlowState.selectedSpecialistId = specSelect.value || null;
        serviceFlowState.selectedDate = null;
        serviceFlowState.selectedTime = null;
        sfLoadDates();
        sfRenderTimesPlaceholder('Сначала выберите дату');
        sfUpdateSummaryAndButton();
        if (serviceFlowState.selectedSpecialistId) {
            sfGoToStep(4);
        }
    });

    dateSelect.addEventListener('change', () => {
        serviceFlowState.selectedDate = dateSelect.value || null;
        serviceFlowState.selectedTime = null;
        sfLoadTimes();
        sfUpdateSummaryAndButton();
        if (serviceFlowState.selectedDate) {
            sfGoToStep(5);
        }
    });

    confirmBtn.addEventListener('click', () => {
        sfCreateBooking();
    });
}

// Публичная функция для инициализации раздела
async function initServiceFlowSection(containerId) {
    await sfInitTelegramClientIfNeeded();
    await sfLoadBaseData();
    sfRender(containerId);
}


