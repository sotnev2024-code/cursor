// Раздел "Мои записи" для мини-приложения
// Возможности: просмотр, изменение даты/времени, отмена записи

const BOOKINGS_FLOW_API_BASE = '/api';

const bookingsFlowState = {
    telegramUser: null,
    client: null,
    bookings: [],
};

function bfApiGet(path, params) {
    const url = new URL(BOOKINGS_FLOW_API_BASE + path, window.location.origin);
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
                url.searchParams.set(k, v);
            }
        });
    }
    return fetch(url.toString()).then(r => r.json());
}

function bfApiPost(path, body, method = 'POST') {
    return fetch(BOOKINGS_FLOW_API_BASE + path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {})
    }).then(r => r.json());
}

async function bfInitTelegramClientIfNeeded() {
    if (bookingsFlowState.client) return;

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

    bookingsFlowState.telegramUser = user;

    try {
        const res = await bfApiPost('/telegram/me', {
            telegram_id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            photo_url: user.photo_url
        });
        if (res.success) {
            bookingsFlowState.client = res.data;
        }
    } catch (e) {
        console.error('Ошибка инициализации Telegram клиента для модуля записей', e);
    }
}

async function bfLoadBookings() {
    if (!bookingsFlowState.telegramUser) return;
    const res = await bfApiGet('/telegram/my-bookings', {
        telegram_id: bookingsFlowState.telegramUser.id
    });
    if (res.success) {
        bookingsFlowState.bookings = res.data || [];
    } else {
        throw new Error(res.error || 'Ошибка загрузки записей');
    }
}

function bfRender(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div id="bookings-flow-section" style="
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
                <span><i class="fas fa-clipboard-list"></i> Мои записи</span>
                <button id="bf-close" style="
                    border: none;
                    background: transparent;
                    color: #7f8c8d;
                    font-size: 14px;
                    cursor: pointer;
                ">Закрыть</button>
            </div>

            <div id="bf-content">
                Загрузка записей...
            </div>
        </div>
    `;

    bfRenderBookingsList();
    bfBindEvents();
}

function bfRenderBookingsList() {
    const content = document.getElementById('bf-content');
    if (!content) return;

    const bookings = bookingsFlowState.bookings || [];
    if (!bookings.length) {
        content.textContent = 'У вас пока нет записей';
        return;
    }

    const now = new Date();
    const upcoming = [];
    const past = [];

    bookings.forEach(b => {
        if (!b.date || !b.time) return;
        const dt = new Date(`${b.date}T${b.time}:00`);
        if (dt >= now) {
            upcoming.push(b);
        } else {
            past.push(b);
        }
    });

    const renderStatusBadge = (status) => {
        const map = {
            'PENDING': { text: 'Ожидает подтверждения', bg: '#fff3cd', color: '#856404' },
            'CONFIRMED': { text: 'Подтверждена', bg: '#d4edda', color: '#155724' },
            'CANCELLED': { text: 'Отменена', bg: '#e2e3e5', color: '#6c757d' },
            'COMPLETED': { text: 'Завершена', bg: '#d1ecf1', color: '#0c5460' }
        };
        const info = map[status] || { text: status, bg: '#f8f9fa', color: '#555' };
        return `<span style="
            display:inline-block;
            padding:2px 8px;
            border-radius:999px;
            font-size:12px;
            background:${info.bg};
            color:${info.color};
        ">${info.text}</span>`;
    };

    const renderList = (list, title, isUpcoming) => {
        if (!list.length) return '';
        let html = `<h3 style="font-size:16px;margin:10px 0 8px 0;">${title}</h3>`;
        list.forEach(b => {
            const serviceName = b.service_name || 'Услуга';
            const specName = b.specialist_name || 'Специалист';
            const date = b.date;
            const time = b.time;
            const price = b.price || b.service_price || 0;
            const status = b.status || 'PENDING';
            const bookingId = b.id;

            const actionsHtml = isUpcoming ? `
                <div style="margin-top:6px;">
                    <button class="bf-edit-btn" data-id="${bookingId}" style="
                        padding:4px 8px;
                        font-size:12px;
                        border-radius:6px;
                        border:1px solid #3498db;
                        background:#fff;
                        color:#3498db;
                        cursor:pointer;
                        margin-right:6px;
                    ">Изменить</button>
                    <button class="bf-delete-btn" data-id="${bookingId}" style="
                        padding:4px 8px;
                        font-size:12px;
                        border-radius:6px;
                        border:1px solid #e74c3c;
                        background:#fff;
                        color:#e74c3c;
                        cursor:pointer;
                    ">Отменить</button>
                </div>
                <div id="bf-edit-${bookingId}" style="margin-top:8px; display:none;">
                    <div class="bf-edit-content" data-id="${bookingId}" style="font-size:13px;color:#666;">
                        Загрузка доступных дат...
                    </div>
                </div>
            ` : '';

            html += `
                <div class="info-item" style="margin-bottom:10px;">
                    <div class="info-icon"><i class="fas fa-calendar-check"></i></div>
                    <div class="info-content">
                        <h3 style="margin-bottom:4px;">${serviceName}</h3>
                        <p style="margin-bottom:2px;">${date}, ${time}</p>
                        <p style="margin-bottom:2px;">${specName}</p>
                        <p style="margin-bottom:2px;">Стоимость: ${price} ₽</p>
                        <p style="margin-bottom:4px;">Статус: ${renderStatusBadge(status)}</p>
                        ${actionsHtml}
                    </div>
                </div>
            `;
        });
        return html;
    };

    let html = '';
    html += renderList(upcoming, 'Ближайшие записи', true);
    html += renderList(past, 'Прошедшие записи', false);
    content.innerHTML = html || 'У вас пока нет записей';
}

async function bfUpdateBooking(bookingId, newDate, newTime) {
    try {
        const res = await bfApiPost(`/bookings/${bookingId}`, {
            date: newDate,
            time: newTime
        }, 'PUT');

        if (!res.success) {
            alert(res.error || 'Не удалось изменить запись');
        } else {
            alert('Запись успешно изменена');
            await bfLoadBookings();
            bfRenderBookingsList();
        }
    } catch (e) {
        console.error('Ошибка изменения записи', e);
        alert('Ошибка изменения записи');
    }
}

async function bfLoadEditOptions(bookingId) {
    const booking = (bookingsFlowState.bookings || []).find(b => b.id === Number(bookingId));
    if (!booking) return;

    const editContainer = document.querySelector(`#bf-edit-${bookingId} .bf-edit-content`);
    if (!editContainer) return;

    editContainer.textContent = 'Загрузка доступных дат...';

    try {
        const res = await bfApiGet('/bookings/available-dates', {
            service_id: booking.service_id,
            specialist_id: booking.specialist_id,
            days_ahead: 30
        });

        if (!res.success) {
            editContainer.textContent = res.error || 'Ошибка загрузки доступных дат';
            return;
        }

        const dates = res.data || [];
        if (!dates.length) {
            editContainer.textContent = 'Нет доступных дат для переноса';
            return;
        }

        // Базовая разметка календаря и времени
        editContainer.innerHTML = `
            <div style="margin-bottom:6px;">Выберите новую дату и время:</div>
            <div id="bf-edit-calendar-${bookingId}" style="margin-bottom:8px;font-size:13px;color:#666;"></div>
            <div id="bf-edit-times-${bookingId}" style="font-size:13px;color:#666;">Сначала выберите дату</div>
        `;

        bfRenderEditCalendar(bookingId, dates, booking.date);
    } catch (e) {
        console.error('Ошибка загрузки доступных дат для изменения', e);
        editContainer.textContent = 'Ошибка загрузки доступных дат';
    }
}

function bfRenderEditCalendar(bookingId, dates, currentDate) {
    const calendar = document.getElementById(`bf-edit-calendar-${bookingId}`);
    if (!calendar) return;

    if (!dates || !dates.length) {
        calendar.textContent = 'Нет доступных дат';
        return;
    }

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

        if (currentDate === d) {
            btn.style.backgroundColor = '#eef5ff';
            btn.style.borderColor = '#e74c3c';
            btn.style.color = '#c0392b';
        }

        btn.addEventListener('click', () => {
            const all = wrapper.children;
            Array.from(all).forEach(ch => {
                ch.style.backgroundColor = '#fff';
                ch.style.borderColor = '#ddd';
                ch.style.color = '#333';
            });
            btn.style.backgroundColor = '#eef5ff';
            btn.style.borderColor = '#e74c3c';
            btn.style.color = '#c0392b';

            bfLoadEditTimes(bookingId, d);
        });

        wrapper.appendChild(btn);
    });

    calendar.appendChild(wrapper);
}

async function bfLoadEditTimes(bookingId, date) {
    const booking = (bookingsFlowState.bookings || []).find(b => b.id === Number(bookingId));
    if (!booking) return;

    const container = document.getElementById(`bf-edit-times-${bookingId}`);
    if (!container) return;

    container.textContent = 'Загрузка времени...';

    try {
        const res = await bfApiGet('/bookings/available-times', {
            service_id: booking.service_id,
            specialist_id: booking.specialist_id,
            date: date
        });

        if (!res.success) {
            container.textContent = res.error || 'Ошибка загрузки времени';
            return;
        }

        const items = res.data || [];
        if (!items.length) {
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
                const confirmText = `Перенести запись на ${date} в ${slot.time}?`;
                if (confirm(confirmText)) {
                    bfUpdateBooking(bookingId, date, slot.time);
                }
            });

            wrapper.appendChild(btn);
        });

        container.innerHTML = '';
        container.appendChild(wrapper);
    } catch (e) {
        console.error('Ошибка загрузки времени для изменения записи', e);
        container.textContent = 'Ошибка загрузки времени';
    }
}

async function bfDeleteBooking(bookingId) {
    if (!confirm('Отменить эту запись?')) return;

    try {
        const res = await fetch(BOOKINGS_FLOW_API_BASE + `/bookings/${bookingId}`, {
            method: 'DELETE'
        }).then(r => r.json());

        if (!res.success) {
            alert(res.error || 'Не удалось отменить запись');
        } else {
            alert('Запись отменена');
            await bfLoadBookings();
            bfRenderBookingsList();
        }
    } catch (e) {
        console.error('Ошибка отмены записи', e);
        alert('Ошибка отмены записи');
    }
}

function bfBindEvents() {
    const closeBtn = document.getElementById('bf-close');
    const section = document.getElementById('bookings-flow-section');
    const content = document.getElementById('bf-content');

    if (closeBtn && section) {
        closeBtn.addEventListener('click', () => {
            section.remove();
        });
    }

    if (content) {
        content.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.bf-edit-btn');
            const deleteBtn = e.target.closest('.bf-delete-btn');

            if (editBtn) {
                const id = editBtn.getAttribute('data-id');
                const editBlock = document.getElementById(`bf-edit-${id}`);
                if (editBlock) {
                    const isHidden = editBlock.style.display === 'none' || !editBlock.style.display;
                    editBlock.style.display = isHidden ? 'block' : 'none';
                    if (isHidden) {
                        bfLoadEditOptions(id);
                    }
                }
            } else if (deleteBtn) {
                const id = deleteBtn.getAttribute('data-id');
                bfDeleteBooking(id);
            }
        });
    }
}

// Публичная функция для инициализации раздела
async function initBookingsFlowSection(containerId) {
    await bfInitTelegramClientIfNeeded();
    try {
        await bfLoadBookings();
    } catch (e) {
        console.error(e);
    }
    bfRender(containerId);
}


