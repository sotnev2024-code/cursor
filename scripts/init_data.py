"""
Скрипт для заполнения базы данных начальными данными
"""
from database.models import db, Category, Setting


def init_initial_data():
    """Инициализация начальных данных"""
    try:
        # Проверяем, есть ли уже данные
        if Category.query.count() > 0:
            print('📊 База данных уже содержит данные, пропускаем вставку начальных данных')
            return
        
        # Создаем категории
        categories_data = [
            {'name': 'Стрижка и укладка', 'description': 'Парикмахерские услуги', 'color': '#007bff', 'order': 1},
            {'name': 'Окрашивание', 'description': 'Окрашивание волос', 'color': '#dc3545', 'order': 2},
            {'name': 'Маникюр', 'description': 'Уход за ногтями', 'color': '#ffc107', 'order': 3},
            {'name': 'Педикюр', 'description': 'Уход за ногами', 'color': '#28a745', 'order': 4},
            {'name': 'Косметология', 'description': 'Уход за кожей', 'color': '#17a2b8', 'order': 5}
        ]
        
        for cat_data in categories_data:
            category = Category(
                name=cat_data['name'],
                description=cat_data['description'],
                color=cat_data['color'],
                display_order=cat_data['order']
            )
            db.session.add(category)
        
        # Создаем настройки
        settings_data = [
            {'key': 'salon_name', 'value': 'Салон красоты', 'description': 'Название салона'},
            {'key': 'work_start', 'value': '09:00', 'description': 'Время начала работы'},
            {'key': 'work_end', 'value': '21:00', 'description': 'Время окончания работы'},
            {'key': 'booking_interval', 'value': '15', 'description': 'Интервал между записями (мин)'},
            {'key': 'payment_methods', 'value': '["cash", "card"]', 'description': 'Способы оплаты'},
            {'key': 'prepayment_percent', 'value': '0', 'description': 'Процент предоплаты'},
            {'key': 'cancellation_fee', 'value': '0', 'description': 'Комиссия за отмену (%)'},
            {'key': 'auto_logout_minutes', 'value': '30', 'description': 'Автоматический логаут (мин)'}
        ]
        
        for setting_data in settings_data:
            setting = Setting(
                key=setting_data['key'],
                value=setting_data['value'],
                description=setting_data['description']
            )
            db.session.add(setting)
        
        db.session.commit()
        print('✅ Начальные данные успешно добавлены')
    except Exception as e:
        print(f'❌ Ошибка инициализации данных: {str(e)}')
        db.session.rollback()

