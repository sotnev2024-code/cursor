/**
 * Модуль управления услугами и категориями
 */
class ServicesModule {
    constructor(api, appState, notifications) {
        this.api = api;
        this.appState = appState;
        this.notifications = notifications;
    }

    async load() {
        try {
            const [categoriesRes, servicesRes] = await Promise.all([
                this.api.get(CONFIG.ENDPOINTS.CATEGORIES),
                this.api.get(CONFIG.ENDPOINTS.SERVICES)
            ]);

            if (categoriesRes.success) {
                this.appState.setCategories(categoriesRes.data || []);
            }
            if (servicesRes.success) {
                this.appState.setServices(servicesRes.data || []);
            }

            this.renderView();
            this.updateSelects();
        } catch (error) {
            this.notifications.error(error.message, 'Ошибка загрузки услуг и категорий');
        }
    }

    /**
     * Рендерит HTML-разметку модуля услуг
     */
    render(view = 'categories') {
        const tabContainer = document.getElementById('services');
        if (!tabContainer) return;

        // Если базовая структура уже есть, просто обновляем содержимое
        if (tabContainer.querySelector('#servicesView')) {
            this.renderView(view);
            return;
        }

        // Создаем базовую структуру
        tabContainer.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-outline-primary active" onclick="window.showServicesView('categories')">
                            Категории
                        </button>
                        <button type="button" class="btn btn-outline-primary" onclick="window.showServicesView('services')">
                            Услуги
                        </button>
                        <button type="button" class="btn btn-outline-primary" onclick="window.showServicesView('pricing')">
                            Прайс-лист
                        </button>
                    </div>
                </div>
                <div class="col-md-6 text-end">
                    <button class="btn btn-success" onclick="window.showAddCategoryModal()">
                        <i class="bi bi-plus-circle"></i> Добавить категорию
                    </button>
                    <button class="btn btn-success" onclick="window.showAddServiceModal()">
                        <i class="bi bi-plus-circle"></i> Добавить услугу
                    </button>
                </div>
            </div>

            <div id="servicesView">
                <!-- Контент будет меняться в зависимости от выбранного представления -->
            </div>
        `;

        // После создания структуры загружаем данные
        this.loadData();
    }

    async loadData() {
        try {
            const [categoriesRes, servicesRes] = await Promise.all([
                this.api.get(CONFIG.ENDPOINTS.CATEGORIES),
                this.api.get(CONFIG.ENDPOINTS.SERVICES)
            ]);

            if (categoriesRes.success) {
                this.appState.setCategories(categoriesRes.data || []);
            }
            if (servicesRes.success) {
                this.appState.setServices(servicesRes.data || []);
            }

            this.renderView();
            this.updateSelects();
        } catch (error) {
            this.notifications.error(error.message, 'Ошибка загрузки услуг и категорий');
        }
    }

    async loadData() {
        try {
            const [categoriesRes, servicesRes] = await Promise.all([
                this.api.get(CONFIG.ENDPOINTS.CATEGORIES),
                this.api.get(CONFIG.ENDPOINTS.SERVICES)
            ]);

            if (categoriesRes.success) {
                this.appState.setCategories(categoriesRes.data || []);
            }
            if (servicesRes.success) {
                this.appState.setServices(servicesRes.data || []);
            }

            this.renderView();
            this.updateSelects();
        } catch (error) {
            this.notifications.error(error.message, 'Ошибка загрузки услуг и категорий');
        }
    }

    renderView(view = 'categories') {
        const container = document.getElementById('servicesView');
        if (!container) return;

        if (view === 'categories') {
            container.innerHTML = `
                <div class="row">
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header bg-secondary text-white">
                                <h5 class="mb-0"><i class="bi bi-tags"></i> Категории услуг</h5>
                            </div>
                            <div class="card-body">
                                <div id="categoriesList">
                                    ${this.renderCategoriesList()}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header bg-info text-white">
                                <h5 class="mb-0"><i class="bi bi-scissors"></i> Услуги по категориям</h5>
                            </div>
                            <div class="card-body">
                                <div id="servicesByCategory">
                                    ${this.renderServicesByCategory()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (view === 'services') {
            container.innerHTML = `
                <div class="card">
                    <div class="card-header bg-info text-white">
                        <h5 class="mb-0"><i class="bi bi-scissors"></i> Все услуги</h5>
                    </div>
                    <div class="card-body">
                        <div id="servicesTable">
                            ${this.renderServicesTable()}
                        </div>
                    </div>
                </div>
            `;
        } else if (view === 'pricing') {
            container.innerHTML = `
                <div class="card">
                    <div class="card-header bg-warning text-dark">
                        <h5 class="mb-0"><i class="bi bi-cash-stack"></i> Прайс-лист</h5>
                    </div>
                    <div class="card-body">
                        <div id="pricingTable">
                            ${this.renderPricingTable()}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    renderCategoriesList() {
        const categories = this.appState.categories;
        const services = this.appState.services;

        if (categories.length === 0) {
            return '<p class="text-center text-muted">Нет категорий</p>';
        }

        let html = '<div class="list-group">';
        categories.forEach(category => {
            const servicesCount = services.filter(s => s.category_id == category.id).length;
            html += `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${escapeHtml(category.name)}</strong>
                        <div class="text-muted small">${escapeHtml(category.description || 'Нет описания')}</div>
                    </div>
                    <div>
                        <span class="badge bg-primary rounded-pill">${servicesCount} услуг</span>
                        <button class="btn btn-sm btn-outline-primary ms-2" onclick="window.servicesModule.editCategory(${category.id})" title="Редактировать">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger ms-1" onclick="window.servicesModule.deleteCategory(${category.id})" title="Удалить">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    renderServicesByCategory() {
        const categories = this.appState.categories;
        const services = this.appState.services;

        if (categories.length === 0) {
            return '<p class="text-center text-muted">Нет категорий</p>';
        }

        let html = '';
        categories.forEach(category => {
            const categoryServices = services.filter(s => s.category_id == category.id);
            html += `
                <div class="service-category mb-4">
                    <h6 class="mb-3">
                        <span class="badge badge-category me-2">${escapeHtml(category.name)}</span>
                        <small class="text-muted">(${categoryServices.length} услуг)</small>
                    </h6>
            `;

            if (categoryServices.length === 0) {
                html += '<p class="text-muted">Нет услуг в этой категории</p>';
            } else {
                html += '<div class="row">';
                categoryServices.forEach(service => {
                    html += `
                        <div class="col-md-6 mb-2">
                            <div class="card">
                                <div class="card-body">
                                    <h6 class="card-title">${escapeHtml(service.name)}</h6>
                                    <p class="card-text small text-muted">${escapeHtml(service.description || 'Нет описания')}</p>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <span class="badge bg-info">${service.duration} мин</span>
                                            <span class="badge bg-success ms-1">${service.price} ₽</span>
                                        </div>
                                        <div class="btn-group btn-group-sm">
                                            <button class="btn btn-outline-primary" onclick="window.servicesModule.editService(${service.id})">
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                            <button class="btn btn-outline-danger" onclick="window.servicesModule.deleteService(${service.id})">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
            }
            html += '</div>';
        });
        return html;
    }

    renderServicesTable() {
        const services = this.appState.services;
        const categories = this.appState.categories;

        if (services.length === 0) {
            return '<p class="text-center text-muted">Нет услуг</p>';
        }

        let html = '<table class="table table-hover">';
        html += `
            <thead>
                <tr>
                    <th>Название</th>
                    <th>Категория</th>
                    <th>Длит.</th>
                    <th>Цена</th>
                    <th>Специалисты</th>
                    <th>Статус</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
        `;

        services.forEach(service => {
            const category = categories.find(c => c.id == service.category_id);
            const specialistsCount = service.specialists ? service.specialists.length : 0;
            html += `
                <tr>
                    <td>
                        <strong>${escapeHtml(service.name)}</strong>
                        <div class="small text-muted">${escapeHtml(service.description || '')}</div>
                    </td>
                    <td>${category ? escapeHtml(category.name) : '—'}</td>
                    <td><span class="badge bg-info">${service.duration} мин</span></td>
                    <td><strong>${service.price} ₽</strong></td>
                    <td><span class="badge bg-secondary">${specialistsCount}</span></td>
                    <td>
                        <span class="badge ${service.is_active ? 'bg-success' : 'bg-secondary'}">
                            ${service.is_active ? 'Активна' : 'Неактивна'}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="window.servicesModule.editService(${service.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="window.servicesModule.deleteService(${service.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        return html;
    }

    renderPricingTable() {
        const services = this.appState.services;
        const categories = this.appState.categories;

        if (services.length === 0) {
            return '<p class="text-center text-muted">Нет услуг</p>';
        }

        const servicesByCategory = {};
        services.forEach(service => {
            const categoryId = service.category_id;
            if (!servicesByCategory[categoryId]) {
                servicesByCategory[categoryId] = [];
            }
            servicesByCategory[categoryId].push(service);
        });

        let html = '';
        categories.forEach(category => {
            const categoryServices = servicesByCategory[category.id] || [];
            if (categoryServices.length === 0) return;

            html += `
                <div class="mb-4">
                    <h5 class="mb-3">${escapeHtml(category.name)}</h5>
                    <div class="table-responsive">
                        <table class="table table-bordered">
                            <thead class="table-light">
                                <tr>
                                    <th>Услуга</th>
                                    <th>Описание</th>
                                    <th>Длительность</th>
                                    <th>Цена</th>
                                    <th>Специалисты</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            categoryServices.forEach(service => {
                const specialistsNames = service.specialists ?
                    service.specialists.map(s => escapeHtml(s.name)).join(', ') : '—';
                html += `
                    <tr>
                        <td><strong>${escapeHtml(service.name)}</strong></td>
                        <td>${escapeHtml(service.description || '—')}</td>
                        <td>${service.duration} мин</td>
                        <td><strong class="text-success">${service.price} ₽</strong></td>
                        <td><small>${specialistsNames}</small></td>
                    </tr>
                `;
            });

            html += '</tbody></table></div></div>';
        });

        return html || '<p class="text-center text-muted">Нет услуг для отображения</p>';
    }

    showAddCategoryModal() {
        if (window.categoryModal) {
            window.categoryModal.showAdd();
        }
    }

    showAddServiceModal() {
        if (window.serviceModal) {
            window.serviceModal.showAdd();
        }
    }

    loadSpecialistsForService(selectedSpecialists = []) {
        const container = document.getElementById('serviceSpecialists');
        if (!container) return;

        let html = '<div class="row">';
        this.appState.specialists.forEach(specialist => {
            const isSelected = selectedSpecialists.some(s => s.id == specialist.id);
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

    async saveCategory() {
        const form = document.getElementById('categoryForm');
        if (!form || !form.checkValidity()) {
            if (form) form.reportValidity();
            return;
        }

        const categoryData = {
            name: document.getElementById('categoryName').value,
            description: document.getElementById('categoryDescription').value,
            display_order: parseInt(document.getElementById('categoryOrder').value) || 0,
            color: document.getElementById('categoryColor').value
        };

        try {
            const form = document.getElementById('categoryForm');
            const editId = form ? form.dataset.editId : null;
            const method = editId ? 'PUT' : 'POST';
            const url = editId ? `${CONFIG.ENDPOINTS.CATEGORIES}/${editId}` : CONFIG.ENDPOINTS.CATEGORIES;

            const result = editId 
                ? await this.api.put(url, categoryData)
                : await this.api.post(url, categoryData);

            if (result.success) {
                this.notifications.success(editId ? 'Категория обновлена' : 'Категория добавлена');
                await this.loadData();
                const modal = bootstrap.Modal.getInstance(document.getElementById('addCategoryModal'));
                if (modal) modal.hide();
            } else {
                this.notifications.error(result.error || 'Ошибка сохранения');
            }
        } catch (error) {
            this.notifications.error(error.message);
        }
    }

    async deleteCategory(categoryId) {
        if (!confirm('Удалить эту категорию? Все услуги в этой категории также будут удалены.')) {
            return;
        }

        try {
            const result = await this.api.delete(`${CONFIG.ENDPOINTS.CATEGORIES}/${categoryId}`);
            if (result.success) {
                this.notifications.success('Категория удалена');
                await this.loadData();
            } else {
                this.notifications.error(result.error || 'Ошибка удаления');
            }
        } catch (error) {
            this.notifications.error(error.message);
        }
    }

    async saveService() {
        const form = document.getElementById('serviceForm');
        if (!form || !form.checkValidity()) {
            if (form) form.reportValidity();
            return;
        }

        const serviceData = {
            name: document.getElementById('serviceName').value,
            category_id: parseInt(document.getElementById('serviceCategory').value),
            duration: parseInt(document.getElementById('serviceDuration').value) || 30,
            price: parseFloat(document.getElementById('servicePrice').value) || 0,
            display_order: parseInt(document.getElementById('serviceOrder').value) || 0,
            description: document.getElementById('serviceDescription').value,
            is_active: document.getElementById('serviceActive').checked,
            is_popular: document.getElementById('servicePopular').checked,
            online_booking: document.getElementById('serviceOnlineBooking').checked
        };

        const selectedSpecialists = [];
        document.querySelectorAll('#serviceSpecialists input[type="checkbox"]:checked').forEach(checkbox => {
            selectedSpecialists.push(parseInt(checkbox.value));
        });
        serviceData.specialists = selectedSpecialists;

        try {
            const form = document.getElementById('serviceForm');
            const editId = form ? form.dataset.editId : null;
            const method = editId ? 'PUT' : 'POST';
            const url = editId ? `${CONFIG.ENDPOINTS.SERVICES}/${editId}` : CONFIG.ENDPOINTS.SERVICES;

            const result = editId 
                ? await this.api.put(url, serviceData)
                : await this.api.post(url, serviceData);

            if (result.success) {
                this.notifications.success(editId ? 'Услуга обновлена' : 'Услуга добавлена');
                await this.loadData();
                const modal = bootstrap.Modal.getInstance(document.getElementById('addServiceModal'));
                if (modal) modal.hide();
            } else {
                this.notifications.error(result.error || 'Ошибка сохранения');
            }
        } catch (error) {
            this.notifications.error(error.message);
        }
    }

    editCategory(categoryId) {
        if (window.categoryModal) {
            window.categoryModal.showEdit(categoryId);
        }
    }

    editService(serviceId) {
        if (window.serviceModal) {
            window.serviceModal.showEdit(serviceId);
        }
    }

    async deleteService(serviceId) {
        if (!confirm('Удалить эту услугу? Это действие нельзя отменить.')) {
            return;
        }

        try {
            const result = await this.api.delete(`${CONFIG.ENDPOINTS.SERVICES}/${serviceId}`);
            if (result.success) {
                this.notifications.success('Услуга удалена');
                await this.load();
            } else {
                this.notifications.error(result.error || 'Ошибка удаления');
            }
        } catch (error) {
            this.notifications.error(error.message);
        }
    }

    updateSelects() {
        const select = document.getElementById('serviceSelect');
        if (!select) return;

        select.innerHTML = '<option value="">Выберите услугу</option>';
        this.appState.services.forEach(service => {
            const category = this.appState.categories.find(c => c.id == service.category_id);
            const categoryName = category ? category.name : 'Другое';
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = `${escapeHtml(service.name)} (${escapeHtml(categoryName)}, ${service.duration} мин, ${service.price} ₽)`;
            select.appendChild(option);
        });

        const calendarFilter = document.getElementById('calendarServiceFilter');
        if (calendarFilter) {
            calendarFilter.innerHTML = '<option value="">Все услуги</option>';
            this.appState.services.forEach(service => {
                const option = document.createElement('option');
                option.value = service.id;
                option.textContent = escapeHtml(service.name);
                calendarFilter.appendChild(option);
            });
        }
    }
}

