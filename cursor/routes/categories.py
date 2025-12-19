"""
Роуты для работы с категориями услуг
"""
from flask import Blueprint, request, jsonify
from database.models import db, Category

categories_bp = Blueprint('categories', __name__)


@categories_bp.route('/', methods=['OPTIONS'])
def options_categories():
    """Обработка OPTIONS запросов для CORS"""
    response = jsonify({'status': 'ok'})
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add('Access-Control-Allow-Headers', "Content-Type, Authorization")
    response.headers.add('Access-Control-Allow-Methods', "GET, POST, PUT, DELETE, OPTIONS")
    return response


@categories_bp.route('/', methods=['GET'])
def get_categories():
    """Получить все категории"""
    try:
        categories = Category.query.order_by(Category.display_order, Category.name).all()
        return jsonify({
            'success': True,
            'data': [c.to_dict() for c in categories]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ошибка получения списка категорий: {str(e)}'
        }), 500


@categories_bp.route('/<int:category_id>', methods=['GET'])
def get_category(category_id):
    """Получить категорию по ID"""
    try:
        category = Category.query.get_or_404(category_id)
        return jsonify({
            'success': True,
            'data': category.to_dict()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ошибка получения категории: {str(e)}'
        }), 500


@categories_bp.route('/', methods=['POST'])
def create_category():
    """Создать новую категорию"""
    try:
        data = request.json
        
        category = Category(
            name=data['name'],
            description=data.get('description'),
            color=data.get('color', '#007bff'),
            display_order=data.get('display_order', 0)
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': category.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Ошибка создания категории: {str(e)}'
        }), 500


@categories_bp.route('/<int:category_id>', methods=['PUT'])
def update_category(category_id):
    """Обновить категорию"""
    try:
        category = Category.query.get_or_404(category_id)
        data = request.json
        
        category.name = data['name']
        category.description = data.get('description')
        category.color = data.get('color', '#007bff')
        category.display_order = data.get('display_order', 0)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': category.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Ошибка обновления категории: {str(e)}'
        }), 500


@categories_bp.route('/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    """Удалить категорию"""
    try:
        category = Category.query.get_or_404(category_id)
        db.session.delete(category)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Категория удалена'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Ошибка удаления категории: {str(e)}'
        }), 500

