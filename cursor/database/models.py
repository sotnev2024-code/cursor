"""
Модели базы данных (SQLAlchemy ORM)
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class Category(db.Model):
    """Модель категории услуг"""
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    color = db.Column(db.String(7), default='#007bff')
    display_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Связи
    services = db.relationship('Service', backref='category', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'color': self.color,
            'display_order': self.display_order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Service(db.Model):
    """Модель услуги"""
    __tablename__ = 'services'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    duration = db.Column(db.Integer, nullable=False, default=30)  # в минутах
    price = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    display_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    is_popular = db.Column(db.Boolean, default=False)
    online_booking = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Связи многие-ко-многим со специалистами
    specialists = db.relationship('Specialist', secondary='specialist_services', back_populates='services')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'category_color': self.category.color if self.category else None,
            'duration': self.duration,
            'price': float(self.price),
            'display_order': self.display_order,
            'is_active': self.is_active,
            'is_popular': self.is_popular,
            'online_booking': self.online_booking,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Specialist(db.Model):
    """Модель специалиста"""
    __tablename__ = 'specialists'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    position = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    photo = db.Column(db.String(500))
    rating = db.Column(db.Numeric(3, 2), default=0)
    start_time = db.Column(db.String(5), default='09:00')
    end_time = db.Column(db.String(5), default='18:00')
    step = db.Column(db.Integer, default=30)  # шаг записи в минутах
    schedule_type = db.Column(db.String(20), default='5x2')  # Тип графика: '5x2', '2x2', 'flexible'
    schedule_start_date = db.Column(db.Date)  # Дата начала рабочей недели для графиков 5x2 и 2x2
    work_dates = db.Column(db.Text)  # JSON массив дат работы для свободного графика (формат: ['YYYY-MM-DD', ...])
    comment = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Связи
    bookings = db.relationship('Booking', backref='specialist', lazy=True)
    services = db.relationship('Service', secondary='specialist_services', back_populates='specialists')
    
    def to_dict(self, include_services=False):
        data = {
            'id': self.id,
            'name': self.name,
            'position': self.position,
            'description': self.description,
            'phone': self.phone,
            'email': self.email,
            'photo': self.photo,
            'rating': float(self.rating) if self.rating else 0,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'step': self.step,
            'schedule_type': self.schedule_type or '5x2',
            'schedule_start_date': self.schedule_start_date.isoformat() if self.schedule_start_date else None,
            'work_dates': self.get_work_dates(),
            'comment': self.comment,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_services:
            data['services'] = [s.to_dict() for s in self.services]
        
        return data
    
    def get_work_dates(self):
        """Получить даты работы как список (для свободного графика)"""
        import json
        if self.work_dates:
            try:
                return json.loads(self.work_dates)
            except:
                return []
        return []


# Таблица связи многие-ко-многим: специалисты и услуги
specialist_services = db.Table('specialist_services',
    db.Column('id', db.Integer, primary_key=True),
    db.Column('specialist_id', db.Integer, db.ForeignKey('specialists.id', ondelete='CASCADE'), nullable=False),
    db.Column('service_id', db.Integer, db.ForeignKey('services.id', ondelete='CASCADE'), nullable=False),
    db.Column('created_at', db.DateTime, default=datetime.utcnow),
    db.UniqueConstraint('specialist_id', 'service_id', name='unique_specialist_service')
)


class Client(db.Model):
    """Модель клиента"""
    __tablename__ = 'clients'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    telegram_id = db.Column(db.String(100), unique=True, nullable=True)  # ID пользователя в Telegram
    photo = db.Column(db.String(500))
    birthday = db.Column(db.Date)
    source = db.Column(db.String(100))  # Источник: 'telegram', 'website', 'phone', 'walk_in', 'referral', etc.
    notes = db.Column(db.Text)  # Комментарии/заметки о клиенте
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Связи
    bookings = db.relationship('Booking', backref='client', lazy=True)
    
    def to_dict(self, include_bookings=False):
        data = {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'email': self.email,
            'telegram_id': self.telegram_id,
            'photo': self.photo,
            'birthday': self.birthday.isoformat() if self.birthday else None,
            'source': self.source,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        # Подсчитываем количество записей
        bookings_count = db.session.query(Booking).filter_by(client_id=self.id).count()
        data['bookings_count'] = bookings_count
        
        # Добавляем последнее посещение
        last_booking = db.session.query(Booking).filter_by(client_id=self.id).order_by(Booking.date.desc(), Booking.time.desc()).first()
        data['last_visit'] = last_booking.date.isoformat() if last_booking and last_booking.date else None
        
        if include_bookings:
            bookings = db.session.query(Booking).filter_by(client_id=self.id).order_by(Booking.date.desc(), Booking.time.desc()).all()
            data['bookings'] = [b.to_dict() for b in bookings]
        
        return data


class Booking(db.Model):
    """Модель записи (бронирования)"""
    __tablename__ = 'bookings'
    
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id', ondelete='CASCADE'), nullable=False)
    specialist_id = db.Column(db.Integer, db.ForeignKey('specialists.id', ondelete='CASCADE'), nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id', ondelete='CASCADE'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    duration = db.Column(db.Integer, nullable=False)  # длительность в минутах
    price = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(20), default='PENDING')  # PENDING, CONFIRMED, HOLD, CANCELLED, COMPLETED
    payment_method = db.Column(db.String(20))  # cash, card, online
    payment_status = db.Column(db.String(20), default='UNPAID')  # UNPAID, PAID, PARTIAL
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Связи
    service = db.relationship('Service', backref='bookings')
    
    def to_dict(self):
        return {
            'id': self.id,
            'client_id': self.client_id,
            'client_name': self.client.name if self.client else None,
            'client_phone': self.client.phone if self.client else None,
            'client_email': self.client.email if self.client else None,
            'specialist_id': self.specialist_id,
            'specialist_name': self.specialist.name if self.specialist else None,
            'specialist_phone': self.specialist.phone if self.specialist else None,
            'service_id': self.service_id,
            'service_name': self.service.name if self.service else None,
            'service_duration': self.service.duration if self.service else None,
            'date': self.date.isoformat() if self.date else None,
            'time': self.time.strftime('%H:%M') if self.time else None,
            'duration': self.duration,
            'price': float(self.price),
            'status': self.status,
            'payment_method': self.payment_method,
            'payment_status': self.payment_status,
            'comment': self.comment,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Notification(db.Model):
    """Модель уведомления"""
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False)  # REMINDER, PROMOTION, NEW_SERVICE, BIRTHDAY, CUSTOM
    recipient_type = db.Column(db.String(20), nullable=False)  # ALL, TODAY, TOMORROW, SPECIFIC
    recipient_ids = db.Column(db.Text)  # JSON массив ID клиентов
    message = db.Column(db.Text, nullable=False)
    channels = db.Column(db.Text, nullable=False)  # JSON массив: SMS, EMAIL, TELEGRAM
    status = db.Column(db.String(20), default='PENDING')  # PENDING, SENT, FAILED
    sent_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        import json
        return {
            'id': self.id,
            'type': self.type,
            'recipient_type': self.recipient_type,
            'recipient_ids': json.loads(self.recipient_ids) if self.recipient_ids else [],
            'message': self.message,
            'channels': json.loads(self.channels) if self.channels else [],
            'status': self.status,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Setting(db.Model):
    """Модель настройки"""
    __tablename__ = 'settings'
    
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        import json
        # Пытаемся распарсить JSON, если не получается - возвращаем как строку
        try:
            value = json.loads(self.value)
        except:
            value = self.value
        
        return {
            'id': self.id,
            'key': self.key,
            'value': value,
            'description': self.description,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

