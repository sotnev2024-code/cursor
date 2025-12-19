/**
 * Модуль модального окна клиента
 */
class ClientModal {
    constructor() {
        this.render();
        this.modalElement = document.getElementById('addClientModal');
        this.form = document.getElementById('clientForm');
    }

    /**
     * Рендерит HTML-разметку модального окна
     */
    render() {
        const modalElement = document.getElementById('addClientModal');
        if (!modalElement) return;

        modalElement.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Добавление клиента</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="clientForm">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3 text-center">
                                        <div class="client-avatar mx-auto mb-3" id="clientAvatarPreview">
                                            <i class="bi bi-person" style="font-size: 2rem;"></i>
                                        </div>
                                        <button type="button" class="btn btn-sm btn-outline-secondary" onclick="document.getElementById('clientAvatarInput').click()">
                                            <i class="bi bi-upload"></i> Загрузить фото
                                        </button>
                                        <input type="file" id="clientAvatarInput" accept="image/*" style="display: none;" onchange="window.clientModal.previewAvatar(event)">
                                    </div>
                                </div>
                                <div class="col-md-8">
                                    <div class="mb-3">
                                        <label class="form-label">ФИО *</label>
                                        <input type="text" class="form-control" id="clientName" required>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label class="form-label">Телефон</label>
                                                <input type="tel" class="form-control" id="clientPhone" placeholder="+7 (999) 123-45-67">
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label class="form-label">Email</label>
                                                <input type="email" class="form-control" id="clientEmail" placeholder="example@mail.com">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Telegram ID</label>
                                        <input type="text" class="form-control" id="clientTelegramId" placeholder="123456789">
                                        <small class="form-text text-muted">ID пользователя в Telegram (для входа через мини-приложение)</small>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Дата рождения</label>
                                        <input type="date" class="form-control" id="clientBirthday">
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Источник *</label>
                                <select class="form-select" id="clientSource" required>
                                    <option value="">Выберите источник</option>
                                    <option value="telegram">Telegram (мини-приложение)</option>
                                    <option value="website">Сайт</option>
                                    <option value="phone">Телефонный звонок</option>
                                    <option value="walk_in">Пришел сам</option>
                                    <option value="referral">Рекомендация</option>
                                    <option value="social_media">Социальные сети</option>
                                    <option value="other">Другое</option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Комментарий / Заметки</label>
                                <textarea class="form-control" id="clientNotes" rows="4" placeholder="Дополнительная информация о клиенте..."></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                        <button type="button" class="btn btn-primary" onclick="window.clientsModule.saveClient()">Сохранить клиента</button>
                    </div>
                </div>
            </div>
        `;

        this.form = document.getElementById('clientForm');
    }

    /**
     * Показать модальное окно для добавления нового клиента
     */
    showAdd() {
        if (this.form) {
            this.form.reset();
            this.form.removeAttribute('data-edit-id');
            
            // Обновляем заголовок
            const modalTitle = this.modalElement?.querySelector('.modal-title');
            if (modalTitle) {
                modalTitle.textContent = 'Добавление клиента';
            }
            
            // Сбрасываем фото
            const avatarPreview = document.getElementById('clientAvatarPreview');
            if (avatarPreview) {
                avatarPreview.innerHTML = '<i class="bi bi-person" style="font-size: 2rem;"></i>';
            }
        }
        
        if (this.modalElement) {
            const modal = new bootstrap.Modal(this.modalElement);
            modal.show();
        }
    }

    /**
     * Показать модальное окно для редактирования клиента
     */
    showEdit(clientId) {
        if (!window.clientsModule) return;
        
        const clients = window.clientsModule.appState?.clients || [];
        const client = clients.find(c => c.id == clientId);
        if (!client) {
            // Загружаем клиента с сервера
            this.loadClientForEdit(clientId);
            return;
        }

        this.fillForm(client);
        
        if (this.modalElement) {
            const modal = new bootstrap.Modal(this.modalElement);
            modal.show();
        }
    }

    /**
     * Загрузить клиента с сервера для редактирования
     */
    async loadClientForEdit(clientId) {
        try {
            const result = await window.api.get(`${CONFIG.ENDPOINTS.CLIENTS}/${clientId}`);
            if (result.success) {
                this.fillForm(result.data);
                
                if (this.modalElement) {
                    const modal = new bootstrap.Modal(this.modalElement);
                    modal.show();
                }
            } else {
                window.notifications.error(result.error || 'Ошибка загрузки клиента');
            }
        } catch (error) {
            window.notifications.error(error.message);
        }
    }

    /**
     * Заполнить форму данными клиента
     */
    fillForm(client) {
        if (!this.form) return;

        // Обновляем заголовок
        const modalTitle = this.modalElement?.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Редактирование клиента';
        }

        // Заполняем поля
        const elements = {
            name: document.getElementById('clientName'),
            phone: document.getElementById('clientPhone'),
            email: document.getElementById('clientEmail'),
            telegramId: document.getElementById('clientTelegramId'),
            birthday: document.getElementById('clientBirthday'),
            source: document.getElementById('clientSource'),
            notes: document.getElementById('clientNotes'),
            avatarPreview: document.getElementById('clientAvatarPreview')
        };

        if (elements.name) elements.name.value = client.name || '';
        if (elements.phone) elements.phone.value = client.phone || '';
        if (elements.email) elements.email.value = client.email || '';
        if (elements.telegramId) elements.telegramId.value = client.telegram_id || '';
        if (elements.birthday) elements.birthday.value = client.birthday || '';
        if (elements.source) elements.source.value = client.source || '';
        if (elements.notes) elements.notes.value = client.notes || '';

        // Загружаем фото
        if (elements.avatarPreview && client.photo) {
            elements.avatarPreview.innerHTML = 
                `<img src="${escapeHtml(client.photo)}" alt="${escapeHtml(client.name)}" class="client-avatar">`;
        } else if (elements.avatarPreview) {
            elements.avatarPreview.innerHTML = '<i class="bi bi-person" style="font-size: 2rem;"></i>';
        }

        // Сохраняем ID для обновления
        this.form.dataset.editId = client.id;
    }

    /**
     * Предпросмотр аватара
     */
    previewAvatar(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const avatarPreview = document.getElementById('clientAvatarPreview');
                if (avatarPreview) {
                    avatarPreview.innerHTML = 
                        `<img src="${escapeHtml(e.target.result)}" alt="Preview" class="client-avatar">`;
                }
            };
            reader.readAsDataURL(file);
        }
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
