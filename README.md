# Система управления салоном красоты

Полнофункциональная система управления салоном красоты с модульной архитектурой.

## Структура проекта

```
├── app.py               # Главный файл Flask приложения
├── requirements.txt     # Зависимости Python
├── index4.html          # Главная HTML страница
├── css/                 # Стили
├── js/                  # JavaScript модули
│   ├── api/            # API клиент
│   ├── modules/        # Модули приложения
│   ├── modals/         # Модальные окна
│   ├── state/          # Управление состоянием
│   └── utils/           # Утилиты
├── routes/              # API роуты (Python)
├── database/            # База данных
│   ├── models.py       # Модели SQLAlchemy
│   └── schema.sql       # Схема БД (для справки)
└── scripts/             # Скрипты
    └── init_data.py     # Инициализация данных
```

## Установка и запуск

### 1. Установка зависимостей

```bash
pip install -r requirements.txt
```

Или с виртуальным окружением (рекомендуется):

```bash
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

**Важно**: Если у вас Python 3.13 и возникает ошибка с SQLAlchemy, сначала обновите SQLAlchemy:

```bash
pip install --upgrade SQLAlchemy>=2.0.36
```

### 2. Запуск сервера

```bash
python app.py
```

Сервер автоматически:
- Создаст базу данных SQLite
- Создаст все таблицы
- Заполнит начальными данными

Сервер будет доступен по адресу: `http://localhost:5000`

## API Endpoints

### Специалисты
- `GET /api/specialists` - Получить всех специалистов
- `GET /api/specialists/:id` - Получить специалиста по ID
- `POST /api/specialists` - Создать специалиста
- `PUT /api/specialists/:id` - Обновить специалиста
- `DELETE /api/specialists/:id` - Удалить специалиста

### Клиенты
- `GET /api/clients` - Получить всех клиентов
- `GET /api/clients/:id` - Получить клиента по ID
- `POST /api/clients` - Создать клиента
- `PUT /api/clients/:id` - Обновить клиента
- `DELETE /api/clients/:id` - Удалить клиента

### Услуги
- `GET /api/services` - Получить все услуги
- `GET /api/services/:id` - Получить услугу по ID
- `POST /api/services` - Создать услугу
- `PUT /api/services/:id` - Обновить услугу
- `DELETE /api/services/:id` - Удалить услугу

### Категории
- `GET /api/categories` - Получить все категории
- `GET /api/categories/:id` - Получить категорию по ID
- `POST /api/categories` - Создать категорию
- `PUT /api/categories/:id` - Обновить категорию
- `DELETE /api/categories/:id` - Удалить категорию

### Записи
- `GET /api/bookings` - Получить все записи
- `GET /api/bookings/:id` - Получить запись по ID
- `POST /api/bookings` - Создать запись
- `PUT /api/bookings/:id` - Обновить запись
- `DELETE /api/bookings/:id` - Удалить запись

### Статистика
- `GET /api/statistics?period=month` - Получить статистику (day/week/month/year)

### Уведомления
- `GET /api/notifications/history` - История уведомлений
- `POST /api/notifications` - Отправить уведомление

### Настройки
- `GET /api/settings` - Получить настройки
- `PUT /api/settings` - Обновить настройки

## База данных

Используется SQLite для простоты развертывания. База данных создается автоматически при первом запуске.

### Основные таблицы:
- `specialists` - Специалисты
- `clients` - Клиенты
- `services` - Услуги
- `categories` - Категории услуг
- `bookings` - Записи/бронирования
- `specialist_services` - Связь специалистов и услуг
- `notifications` - Уведомления
- `settings` - Настройки системы

## Технологии

- **Frontend**: Vanilla JavaScript, Bootstrap 5
- **Backend**: Python + Flask + SQLAlchemy
- **Database**: SQLite
- **API**: RESTful

## Разработка

При запуске `python app.py` автоматически включается режим отладки (`debug=True`), который перезагружает сервер при изменении файлов.

## Решение проблем

Если возникает ошибка с SQLAlchemy и Python 3.13, см. файл `FIX_PYTHON313.md`
