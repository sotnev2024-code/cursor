"""
Роуты для работы со специалистами
"""
from flask import Blueprint, request, jsonify
from database.models import db, Specialist, Service
from datetime import datetime
import json

specialists_bp = Blueprint('specialists', __name__)


@specialists_bp.route('/', methods=['GET'])
def get_specialists():
    """Получить всех специалистов"""
    try:
        specialists = Specialist.query.filter_by(is_active=True).order_by(Specialist.name).all()
        
        result = []
        for specialist in specialists:
            data = specialist.to_dict(include_services=True)
            result.append(data)
        
        return jsonify({
            'success': True,
            'data': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ошибка получения списка специалистов: {str(e)}'
        }), 500


@specialists_bp.route('/<int:specialist_id>', methods=['GET'])
def get_specialist(specialist_id):
    """Получить специалиста по ID"""
    try:
        specialist = Specialist.query.get_or_404(specialist_id)
        return jsonify({
            'success': True,
            'data': specialist.to_dict(include_services=True)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ошибка получения специалиста: {str(e)}'
        }), 500


@specialists_bp.route('/', methods=['POST'])
def create_specialist():
    """Создать нового специалиста"""
    try:
        data = request.json
        
        # Создаем специалиста
        specialist = Specialist(
            name=data['name'],
            position=data['position'],
            description=data.get('description'),
            phone=data.get('phone'),
            email=data.get('email'),
            photo=data.get('photo'),
            start_time=data.get('start_time', '09:00'),
            end_time=data.get('end_time', '18:00'),
            step=data.get('step', 30),
            schedule_type=data.get('schedule_type', '5x2'),
            schedule_start_date=datetime.strptime(data['schedule_start_date'], '%Y-%m-%d').date() if data.get('schedule_start_date') and data['schedule_start_date'] else None,
            work_dates=json.dumps(data.get('work_dates', [])) if data.get('work_dates') else None,
            comment=data.get('comment'),
            rating=data.get('rating', 0)
        )
        
        db.session.add(specialist)
        db.session.flush()  # Получаем ID
        
        # Добавляем услуги
        if 'services' in data and isinstance(data['services'], list):
            services = Service.query.filter(Service.id.in_(data['services'])).all()
            specialist.services = services
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': specialist.to_dict(include_services=True)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Ошибка создания специалиста: {str(e)}'
        }), 500


@specialists_bp.route('/<int:specialist_id>', methods=['PUT'])
def update_specialist(specialist_id):
    """Обновить специалиста"""
    try:
        specialist = Specialist.query.get_or_404(specialist_id)
        data = request.json
        
        specialist.name = data['name']
        specialist.position = data['position']
        specialist.description = data.get('description')
        specialist.phone = data.get('phone')
        specialist.email = data.get('email')
        specialist.photo = data.get('photo')
        specialist.start_time = data.get('start_time', '09:00')
        specialist.end_time = data.get('end_time', '18:00')
        specialist.step = data.get('step', 30)
        specialist.schedule_type = data.get('schedule_type', '5x2')
        specialist.schedule_start_date = datetime.strptime(data['schedule_start_date'], '%Y-%m-%d').date() if data.get('schedule_start_date') and data['schedule_start_date'] else None
        specialist.work_dates = json.dumps(data.get('work_dates', [])) if data.get('work_dates') else None
        specialist.comment = data.get('comment')
        specialist.rating = data.get('rating', 0)
        
        # Обновляем услуги
        if 'services' in data and isinstance(data['services'], list):
            services = Service.query.filter(Service.id.in_(data['services'])).all()
            specialist.services = services
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': specialist.to_dict(include_services=True)
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Ошибка обновления специалиста: {str(e)}'
        }), 500


@specialists_bp.route('/<int:specialist_id>', methods=['DELETE'])
def delete_specialist(specialist_id):
    """Удалить специалиста (пометить как неактивного)"""
    try:
        specialist = Specialist.query.get_or_404(specialist_id)
        specialist.is_active = False
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Специалист удален'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Ошибка удаления специалиста: {str(e)}'
        }), 500

