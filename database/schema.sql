-- Схема базы данных для салона красоты

-- Таблица категорий услуг
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#007bff',
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица услуг
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category_id INTEGER NOT NULL,
    duration INTEGER NOT NULL DEFAULT 30, -- в минутах
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    is_popular BOOLEAN DEFAULT 0,
    online_booking BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Таблица специалистов
CREATE TABLE IF NOT EXISTS specialists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    description TEXT,
    phone TEXT,
    email TEXT,
    photo TEXT,
    rating DECIMAL(3, 2) DEFAULT 0,
    start_time TEXT DEFAULT '09:00',
    end_time TEXT DEFAULT '18:00',
    step INTEGER DEFAULT 30, -- шаг записи в минутах
    days_off TEXT, -- JSON массив дней недели (0-6, где 0=воскресенье)
    comment TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Связь многие-ко-многим: специалисты и услуги
CREATE TABLE IF NOT EXISTS specialist_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    specialist_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (specialist_id) REFERENCES specialists(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    UNIQUE(specialist_id, service_id)
);

-- Таблица клиентов
CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    photo TEXT,
    birthday DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица записей (бронирований)
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    specialist_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    duration INTEGER NOT NULL, -- длительность в минутах
    price DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'PENDING', -- PENDING, CONFIRMED, HOLD, CANCELLED, COMPLETED
    payment_method TEXT, -- cash, card, online
    payment_status TEXT DEFAULT 'UNPAID', -- UNPAID, PAID, PARTIAL
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (specialist_id) REFERENCES specialists(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Таблица уведомлений
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- REMINDER, PROMOTION, NEW_SERVICE, BIRTHDAY, CUSTOM
    recipient_type TEXT NOT NULL, -- ALL, TODAY, TOMORROW, SPECIFIC
    recipient_ids TEXT, -- JSON массив ID клиентов (если SPECIFIC)
    message TEXT NOT NULL,
    channels TEXT NOT NULL, -- JSON массив: SMS, EMAIL, TELEGRAM
    status TEXT DEFAULT 'PENDING', -- PENDING, SENT, FAILED
    sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица настроек
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_specialist ON bookings(specialist_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_specialist_services_specialist ON specialist_services(specialist_id);
CREATE INDEX IF NOT EXISTS idx_specialist_services_service ON specialist_services(service_id);

