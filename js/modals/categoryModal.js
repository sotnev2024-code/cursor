/**
 * Модуль модального окна категории
 */
class CategoryModal {
    constructor() {
        this.modalElement = document.getElementById('addCategoryModal');
        this.render();
    }

    /**
     * Рендерит HTML-разметку модального окна
     */
    render() {
        if (!this.modalElement) return;

        this.modalElement.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Добавление категории услуг</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="categoryForm">
                            <div class="mb-3">
                                <label class="form-label">Название категории *</label>
                                <input type="text" class="form-control" id="categoryName" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Описание</label>
                                <textarea class="form-control" id="categoryDescription" rows="3"></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Порядок отображения</label>
                                <input type="number" class="form-control" id="categoryOrder" value="0">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Цвет категории</label>
                                <input type="color" class="form-control form-control-color" id="categoryColor" value="#007bff">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                        <button type="button" class="btn btn-primary" onclick="window.servicesModule.saveCategory()">Сохранить категорию</button>
                    </div>
                </div>
            </div>
        `;

        // Обновляем ссылку на форму
        this.form = document.getElementById('categoryForm');
    }

    /**
     * Показать модальное окно для добавления новой категории
     */
    showAdd() {
        if (this.form) {
            this.form.reset();
            this.form.removeAttribute('data-edit-id');
        }

        if (this.modalElement) {
            const modal = new bootstrap.Modal(this.modalElement);
            modal.show();
        }
    }

    /**
     * Показать модальное окно для редактирования категории
     */
    showEdit(categoryId) {
        if (!window.servicesModule) return;
        
        const categories = window.servicesModule.appState?.categories || [];
        const category = categories.find(c => c.id == categoryId);
        if (!category) return;

        const elements = {
            name: document.getElementById('categoryName'),
            description: document.getElementById('categoryDescription'),
            order: document.getElementById('categoryOrder'),
            color: document.getElementById('categoryColor')
        };

        if (elements.name) elements.name.value = category.name || '';
        if (elements.description) elements.description.value = category.description || '';
        if (elements.order) elements.order.value = category.order || 0;
        if (elements.color) elements.color.value = category.color || '#007bff';

        // Сохраняем ID для обновления
        if (this.form) {
            this.form.dataset.editId = categoryId;
        }

        if (this.modalElement) {
            const modal = new bootstrap.Modal(this.modalElement);
            modal.show();
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

