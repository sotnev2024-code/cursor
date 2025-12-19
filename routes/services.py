"""
Роуты для работы с услугами
"""
from flask import Blueprint, request, jsonify
from database.models import db, Service, Specialist

services_bp = Blueprint('services', __name__)


@services_bp.route('/', methods=['GET'])
def get_services():
    """Получить все услуги"""
    try:
        services = Service.query.order_by(Service.display_order, Service.name).all()
        return jsonify({
            'success': True,
            'data': [s.to_dict() for s in services]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ошибка получения списка услуг: {str(e)}'
        }), 500


@services_bp.route('/<int:service_id>', methods=['GET'])
def get_service(service_id):
    """Получить услугу по ID"""
    try:
        service = Service.query.get_or_404(service_id)
        data = service.to_dict()
        
        # Добавляем специалистов
        data['specialists'] = [s.to_dict() for s in service.specialists]
        
        return jsonify({
            'success': True,
            'data': data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ошибка получения услуги: {str(e)}'
        }), 500


@services_bp.route('/', methods=['POST'])
def create_service():
    """Создать новую услугу"""
    try:
        data = request.json
        
        service = Service(
            name=data['name'],
            description=data.get('description'),
            category_id=data['category_id'],
            duration=data.get('duration', 30),
            price=data.get('price', 0),
            display_order=data.get('display_order', 0),
            is_active=data.get('is_active', True),
            is_popular=data.get('is_popular', False),
            online_booking=data.get('online_booking', True)
        )
        
        db.session.add(service)
        db.session.flush()
        
        # Добавляем специалистов
        if 'specialists' in data and isinstance(data['specialists'], list):
            specialists = Specialist.query.filter(Specialist.id.in_(data['specialists'])).all()
            service.specialists = specialists
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': service.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Ошибка создания услуги: {str(e)}'
        }), 500


@services_bp.route('/<int:service_id>', methods=['PUT'])
def update_service(service_id):
    """Обновить услугу"""
    try:
        service = Service.query.get_or_404(service_id)
        data = request.json
        
        service.name = data['name']
        service.description = data.get('description')
        service.category_id = data['category_id']
        service.duration = data.get('duration', 30)
        service.price = data.get('price', 0)
        service.display_order = data.get('display_order', 0)
        service.is_active = data.get('is_active', True)
        service.is_popular = data.get('is_popular', False)
        service.online_booking = data.get('online_booking', True)
        
        # Обновляем специалистов
        if 'specialists' in data and isinstance(data['specialists'], list):
            specialists = Specialist.query.filter(Specialist.id.in_(data['specialists'])).all()
            service.specialists = specialists
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': service.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Ошибка обновления услуги: {str(e)}'
        }), 500


@services_bp.route('/<int:service_id>', methods=['DELETE'])
def delete_service(service_id):
    """Удалить услугу"""
    try:
        service = Service.query.get_or_404(service_id)
        db.session.delete(service)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Услуга удалена'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Ошибка удаления услуги: {str(e)}'
        }), 500

