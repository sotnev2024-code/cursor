"""
Роуты для работы с настройками
"""
from flask import Blueprint, request, jsonify
from database.models import db, Setting
import json

settings_bp = Blueprint('settings', __name__)


@settings_bp.route('/', methods=['GET'])
def get_settings():
    """Получить все настройки"""
    try:
        settings = Setting.query.all()
        
        # Преобразуем в объект
        settings_obj = {}
        for setting in settings:
            try:
                value = json.loads(setting.value)
            except:
                value = setting.value
            settings_obj[setting.key] = value
        
        return jsonify({
            'success': True,
            'data': settings_obj
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ошибка получения настроек: {str(e)}'
        }), 500


@settings_bp.route('/', methods=['PUT'])
def update_settings():
    """Обновить настройки"""
    try:
        data = request.json
        
        for key, value in data.items():
            value_str = json.dumps(value) if isinstance(value, (dict, list)) else str(value)
            
            setting = Setting.query.filter_by(key=key).first()
            if setting:
                setting.value = value_str
            else:
                setting = Setting(key=key, value=value_str)
                db.session.add(setting)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': data
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Ошибка обновления настроек: {str(e)}'
        }), 500

