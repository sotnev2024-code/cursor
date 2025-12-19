/**
 * Модуль модального окна услуги
 */
class ServiceModal {
    constructor(servicesModule) {
        this.modalElement = document.getElementById('addServiceModal');
        this.servicesModule = servicesModule;
        this.render();
    }

    /**
     * Рендерит HTML-разметку модального окна
     */
    render() {
        if (!this.modalElement) return;

        this.modalElement.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Добавление услуги</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="serviceForm">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Название услуги *</label>
                                        <input type="text" class="form-control" id="serviceName" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Категория *</label>
                                        <select class="form-select" id="serviceCategory" required>
                                            <option value="">Выберите категорию</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label">Длительность (мин) *</label>
                                        <input type="number" class="form-control" id="serviceDuration" required min="5" value="30">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label">Цена (₽) *</label>
                                        <input type="number" class="form-control" id="servicePrice" required min="0" value="1000">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label">Порядок отображения</label>
                                        <input type="number" class="form-control" id="serviceOrder" value="0">
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Описание услуги</label>
                                <textarea class="form-control" id="serviceDescription" rows="3"></textarea>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Специалисты, оказывающие услугу</label>
                                <div id="serviceSpecialists" class="border rounded p-3" style="max-height: 200px; overflow-y: auto;">
                                    <p class="text-muted">Загрузка специалистов...</p>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Дополнительные опции</label>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="serviceActive" checked>
                                    <label class="form-check-label" for="serviceActive">
                                        Услуга активна
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="servicePopular">
                                    <label class="form-check-label" for="servicePopular">
                                        Популярная услуга
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="serviceOnlineBooking">
                                    <label class="form-check-label" for="serviceOnlineBooking">
                                        Доступна для онлайн-записи
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                        <button type="button" class="btn btn-primary" onclick="window.servicesModule.saveService()">Сохранить услугу</button>
                    </div>
                </div>
            </div>
        `;

        // Обновляем ссылку на форму
        this.form = document.getElementById('serviceForm');
    }

    /**
     * Показать модальное окно для добавления новой услуги
     */
    showAdd() {
        if (this.form) {
            this.form.reset();
            this.form.removeAttribute('data-edit-id');
        }

        // Заполняем список категорий
        const categorySelect = document.getElementById('serviceCategory');
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Выберите категорию</option>';
            
            const categories = window.servicesModule?.appState?.categories || [];
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = escapeHtml(category.name);
                categorySelect.appendChild(option);
            });
        }

        // Загружаем список специалистов
        if (this.servicesModule) {
            this.servicesModule.loadSpecialistsForService();
        }

        if (this.modalElement) {
            const modal = new bootstrap.Modal(this.modalElement);
            modal.show();
        }
    }

    /**
     * Показать модальное окно для редактирования услуги
     */
    showEdit(serviceId) {
        if (!window.servicesModule) return;
        
        const services = window.servicesModule.appState?.services || [];
        const service = services.find(s => s.id == serviceId);
        if (!service) return;

        const elements = {
            name: document.getElementById('serviceName'),
            category: document.getElementById('serviceCategory'),
            duration: document.getElementById('serviceDuration'),
            price: document.getElementById('servicePrice'),
            order: document.getElementById('serviceOrder'),
            description: document.getElementById('serviceDescription'),
            active: document.getElementById('serviceActive'),
            popular: document.getElementById('servicePopular'),
            onlineBooking: document.getElementById('serviceOnlineBooking')
        };

        if (elements.name) elements.name.value = service.name || '';
        if (elements.category) elements.category.value = service.category_id || '';
        if (elements.duration) elements.duration.value = service.duration || 30;
        if (elements.price) elements.price.value = service.price || 0;
        if (elements.order) elements.order.value = service.order || 0;
        if (elements.description) elements.description.value = service.description || '';
        if (elements.active) elements.active.checked = service.is_active !== false;
        if (elements.popular) elements.popular.checked = service.is_popular === true;
        if (elements.onlineBooking) elements.onlineBooking.checked = service.online_booking === true;

        // Заполняем категории
        const categorySelect = elements.category;
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Выберите категорию</option>';
            const categories = window.servicesModule.appState?.categories || [];
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = escapeHtml(category.name);
                if (category.id == service.category_id) {
                    option.selected = true;
                }
                categorySelect.appendChild(option);
            });
        }

        // Загружаем специалистов
        if (this.servicesModule) {
            this.servicesModule.loadSpecialistsForService(service.specialists || []);
        }

        // Сохраняем ID для обновления
        if (this.form) {
            this.form.dataset.editId = serviceId;
        }

        if (this.modalElement) {
            const modal = new bootstrap.Modal(this.modalElement);
            modal.show();
        }
    }

    /**
     * Загрузить список специалистов для выбора
     */
    loadSpecialistsForService(selectedSpecialists = []) {
        const container = document.getElementById('serviceSpecialists');
        if (!container) return;

        const specialists = window.specialistsModule?.appState?.specialists || [];
        
        let html = '<div class="row">';
        specialists.forEach(specialist => {
            const isSelected = selectedSpecialists.some(s => 
                (typeof s === 'object' ? s.id : s) == specialist.id
            );
            html += `
                <div class="col-md-6 mb-2">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox"
                               id="specialist_${specialist.id}"
                               value="${specialist.id}"
                               ${isSelected ? 'checked' : ''}>
                        <label class="form-check-label" for="specialist_${specialist.id}">
                            ${escapeHtml(specialist.name)}
                        </label>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
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

