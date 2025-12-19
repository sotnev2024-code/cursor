"""
Роуты для интеграции с Telegram Mini App
"""
from flask import Blueprint, request, jsonify
from database.models import db, Client, Booking, Service, Specialist
from datetime import datetime

telegram_bp = Blueprint('telegram', __name__)


@telegram_bp.route('/me', methods=['POST'])
def telegram_me():
    """
    Получить или создать клиента по telegram_id.

    Ожидает JSON:
    {
        "telegram_id": "123456",
        "first_name": "Имя",
        "last_name": "Фамилия",
        "username": "telegram_username",
        "photo_url": "https://...",
        "phone": "+79990000000"  # опционально, если есть
    }
    """
    try:
        data = request.json or {}
        telegram_id = str(data.get('telegram_id') or '').strip()

        if not telegram_id:
            return jsonify({
                'success': False,
                'error': 'Не передан telegram_id'
            }), 400

        client = Client.query.filter_by(telegram_id=telegram_id).first()

        # Если клиента нет — создаём
        if not client:
            full_name_parts = []
            if data.get('first_name'):
                full_name_parts.append(data['first_name'])
            if data.get('last_name'):
                full_name_parts.append(data['last_name'])
            full_name = ' '.join(full_name_parts) or data.get('username') or 'Клиент Telegram'

            client = Client(
                name=full_name,
                phone=data.get('phone'),
                email=None,
                telegram_id=telegram_id,
                photo=data.get('photo_url'),
                source='telegram',
                notes=None
            )
            db.session.add(client)
            db.session.commit()
        else:
            # Обновляем базовые данные, если они пришли
            updated = False
            if data.get('first_name') or data.get('last_name'):
                full_name_parts = []
                if data.get('first_name'):
                    full_name_parts.append(data['first_name'])
                if data.get('last_name'):
                    full_name_parts.append(data['last_name'])
                new_name = ' '.join(full_name_parts)
                if new_name and new_name != client.name:
                    client.name = new_name
                    updated = True
            if data.get('phone') and data['phone'] != client.phone:
                client.phone = data['phone']
                updated = True
            if data.get('photo_url') and data['photo_url'] != client.photo:
                client.photo = data['photo_url']
                updated = True

            if updated:
                db.session.commit()

        return jsonify({
            'success': True,
            'data': client.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Ошибка обработки данных Telegram: {str(e)}'
        }), 500


@telegram_bp.route('/my-bookings', methods=['GET'])
def telegram_my_bookings():
    """
    Получить записи текущего Telegram-клиента.

    Принимает telegram_id в query-параметре:
    GET /api/telegram/my-bookings?telegram_id=123456
    """
    try:
        telegram_id = request.args.get('telegram_id', '').strip()
        if not telegram_id:
            return jsonify({
                'success': False,
                'error': 'Не передан telegram_id'
            }), 400

        client = Client.query.filter_by(telegram_id=telegram_id).first()
        if not client:
            return jsonify({
                'success': True,
                'data': []
            })

        # Получаем все записи клиента, от новых к старым
        bookings = Booking.query.filter_by(client_id=client.id).order_by(
            Booking.date.desc(),
            Booking.time.desc()
        ).all()

        result = []
        for booking in bookings:
            data = booking.to_dict()

            # Добавляем расширенную информацию для отображения в Telegram
            if booking.service:
                data['service_name'] = booking.service.name
                data['service_duration'] = booking.service.duration
                data['service_price'] = float(booking.service.price)
            if booking.specialist:
                data['specialist_name'] = booking.specialist.name

            result.append(data)

        return jsonify({
            'success': True,
            'data': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ошибка получения записей: {str(e)}'
        }), 500


@telegram_bp.route('/salon-info', methods=['GET'])
def telegram_salon_info():
    """
    Базовая информация о салоне для отображения в мини-приложении.
    При желании можно потом заменить на чтение из таблицы settings.
    """
    # TODO: при необходимости вынести в настройки (таблица Setting)
    info = {
        'name': 'Салон красоты «Ваш стиль»',
        'description': 'Уютный салон красоты с профессиональными мастерами. '
                       'Мы предлагаем стрижки, окрашивание, уход за волосами и ногтями.',
        'address': 'г. Примерск, ул. Красоты, д. 5',
        'metro': 'м. Центр',
        'phone': '+7 (999) 000-00-00',
        'rating': 4.9,
        'reviews': [
            {
                'author': 'Анна',
                'rating': 5,
                'text': 'Очень понравился салон, уютная атмосфера и внимательные мастера!'
            },
            {
                'author': 'Мария',
                'rating': 4.8,
                'text': 'Делаю здесь окрашивание уже год, всегда отличный результат.'
            }
        ],
        'location': {
            'lat': None,
            'lng': None,
            'how_to_get': 'Мы находимся в 5 минутах пешком от метро «Центр». '
                          'От остановки «Площадь» двигайтесь по ул. Красоты до д. 5.'
        }
    }

    return jsonify({
        'success': True,
        'data': info
    })


