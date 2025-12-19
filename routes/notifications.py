"""
Роуты для работы с уведомлениями
"""
from flask import Blueprint, request, jsonify
from database.models import db, Notification
import json

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('/history', methods=['GET'])
def get_history():
    """Получить историю уведомлений"""
    try:
        notifications = Notification.query.order_by(Notification.created_at.desc()).limit(50).all()
        return jsonify({
            'success': True,
            'data': [n.to_dict() for n in notifications]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ошибка получения истории уведомлений: {str(e)}'
        }), 500


@notifications_bp.route('/', methods=['POST'])
def create_notification():
    """Отправить уведомление"""
    try:
        data = request.json
        
        notification = Notification(
            type=data['type'],
            recipient_type=data['recipient_type'],
            recipient_ids=json.dumps(data.get('recipient_ids', [])) if data.get('recipient_ids') else None,
            message=data['message'],
            channels=json.dumps(data.get('channels', []))
        )
        
        db.session.add(notification)
        db.session.commit()
        
        # Здесь можно добавить логику отправки уведомлений через SMS, Email, Telegram
        
        return jsonify({
            'success': True,
            'data': notification.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Ошибка создания уведомления: {str(e)}'
        }), 500

