"""
Роуты для работы с клиентами
"""
from flask import Blueprint, request, jsonify
from database.models import db, Client, Booking
from sqlalchemy import or_

clients_bp = Blueprint('clients', __name__)


@clients_bp.route('/', methods=['GET'])
def get_clients():
    """Получить всех клиентов"""
    try:
        search = request.args.get('search', '')
        query = Client.query
        
        if search:
            query = query.filter(
                or_(
                    Client.name.like(f'%{search}%'),
                    Client.phone.like(f'%{search}%'),
                    Client.email.like(f'%{search}%')
                )
            )
        
        clients = query.order_by(Client.name).all()
        
        result = []
        for client in clients:
            data = client.to_dict()
            
            # Добавляем статистику записей
            bookings_count = Booking.query.filter_by(client_id=client.id).count()
            last_booking = Booking.query.filter_by(client_id=client.id).order_by(
                Booking.date.desc(), Booking.time.desc()
            ).first()
            
            data['bookings_count'] = bookings_count
            data['last_visit'] = last_booking.date.isoformat() if last_booking and last_booking.date else None
            
            result.append(data)
        
        return jsonify({
            'success': True,
            'data': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ошибка получения списка клиентов: {str(e)}'
        }), 500


@clients_bp.route('/<int:client_id>', methods=['GET'])
def get_client(client_id):
    """Получить клиента по ID"""
    try:
        client = Client.query.get_or_404(client_id)
        data = client.to_dict(include_bookings=True)
        return jsonify({
            'success': True,
            'data': data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ошибка получения клиента: {str(e)}'
        }), 500


@clients_bp.route('/', methods=['POST'])
def create_client():
    """Создать нового клиента"""
    try:
        data = request.json
        
        from datetime import datetime
        birthday = None
        if data.get('birthday'):
            birthday = datetime.strptime(data['birthday'], '%Y-%m-%d').date()
        
        client = Client(
            name=data['name'],
            phone=data.get('phone'),
            email=data.get('email'),
            telegram_id=data.get('telegram_id'),
            photo=data.get('photo'),
            birthday=birthday,
            source=data.get('source'),
            notes=data.get('notes')
        )
        
        db.session.add(client)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': client.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Ошибка создания клиента: {str(e)}'
        }), 500


@clients_bp.route('/<int:client_id>', methods=['PUT'])
def update_client(client_id):
    """Обновить клиента"""
    try:
        client = Client.query.get_or_404(client_id)
        data = request.json
        
        client.name = data['name']
        client.phone = data.get('phone')
        client.email = data.get('email')
        client.telegram_id = data.get('telegram_id')
        client.photo = data.get('photo')
        client.source = data.get('source')
        client.notes = data.get('notes')
        
        if data.get('birthday'):
            from datetime import datetime
            client.birthday = datetime.strptime(data['birthday'], '%Y-%m-%d').date()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': client.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Ошибка обновления клиента: {str(e)}'
        }), 500


@clients_bp.route('/<int:client_id>', methods=['DELETE'])
def delete_client(client_id):
    """Удалить клиента"""
    try:
        client = Client.query.get_or_404(client_id)
        db.session.delete(client)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Клиент удален'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Ошибка удаления клиента: {str(e)}'
        }), 500


@clients_bp.route('/<int:client_id>/bookings', methods=['GET'])
def get_client_bookings(client_id):
    """Получить историю записей клиента"""
    try:
        client = Client.query.get_or_404(client_id)
        bookings = Booking.query.filter_by(client_id=client_id).order_by(
            Booking.date.desc(), Booking.time.desc()
        ).all()
        
        result = []
        for booking in bookings:
            booking_data = booking.to_dict()
            # Добавляем информацию о специалисте и услуге
            if booking.specialist:
                booking_data['specialist_name'] = booking.specialist.name
            if booking.service:
                booking_data['service_name'] = booking.service.name
                booking_data['service_duration'] = booking.service.duration
                booking_data['service_price'] = float(booking.service.price) if booking.service.price else 0
            result.append(booking_data)
        
        return jsonify({
            'success': True,
            'data': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ошибка получения истории записей: {str(e)}'
        }), 500


@clients_bp.route('/find-by-phone', methods=['GET'])
def find_client_by_phone():
    """Найти клиента по номеру телефона"""
    try:
        phone = request.args.get('phone', '').strip()
        if not phone:
            return jsonify({
                'success': True,
                'data': None
            })
        
        # Ищем клиента по телефону (частичное совпадение)
        client = Client.query.filter(Client.phone.like(f'%{phone}%')).first()
        
        if client:
            return jsonify({
                'success': True,
                'data': client.to_dict()
            })
        else:
            return jsonify({
                'success': True,
                'data': None
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ошибка поиска клиента: {str(e)}'
        }), 500

