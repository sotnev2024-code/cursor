"""
Главный файл Flask приложения
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import os

from database.models import db
from routes import (
    specialists_bp, clients_bp, services_bp, categories_bp,
    bookings_bp, statistics_bp, notifications_bp, settings_bp,
    dashboard_bp, telegram_bp
)

app = Flask(__name__, static_folder='.', static_url_path='')

# Настройка для работы за прокси (Timeweb, nginx и т.д.)
from werkzeug.middleware.proxy_fix import ProxyFix
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Настройка CORS с явной поддержкой OPTIONS запросов
CORS(app, 
     resources={r"/api/*": {
         "origins": "*",
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization"]
     }},
     supports_credentials=True)

# Добавляем обработчик для OPTIONS запросов (CORS preflight)
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({'status': 'ok'})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response

# Конфигурация базы данных
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "database", "beauty_salon.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Инициализация базы данных
db.init_app(app)

# Регистрация Blueprint'ов (роутов)
app.register_blueprint(specialists_bp, url_prefix='/api/specialists')
app.register_blueprint(clients_bp, url_prefix='/api/clients')
app.register_blueprint(services_bp, url_prefix='/api/services')
app.register_blueprint(categories_bp, url_prefix='/api/categories')
app.register_blueprint(bookings_bp, url_prefix='/api/bookings')
app.register_blueprint(statistics_bp, url_prefix='/api/statistics')
app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
app.register_blueprint(settings_bp, url_prefix='/api/settings')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
app.register_blueprint(telegram_bp, url_prefix='/api/telegram')


@app.route('/')
def index():
    """Главная страница - отдаем index4.html"""
    return app.send_static_file('index4.html')


@app.route('/miniaps/')
@app.route('/miniaps/<path:filename>')
def miniaps_static(filename='mini.html'):
    """Отдача статических файлов из папки miniaps"""
    return app.send_static_file(f'miniaps/{filename}')


@app.errorhandler(404)
def not_found(error):
    """Обработчик 404 ошибок"""
    return jsonify({
        'success': False,
        'error': 'Маршрут не найден'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Обработчик 500 ошибок"""
    return jsonify({
        'success': False,
        'error': 'Внутренняя ошибка сервера'
    }), 500


if __name__ == '__main__':
    # Создаем таблицы при первом запуске
    with app.app_context():
        # Выполняем миграции перед созданием таблиц
        try:
            from scripts.migrate_specialists import migrate_specialists_table
            migrate_specialists_table()
        except Exception as e:
            print(f'⚠️  Предупреждение при миграции специалистов: {e}')
        
        try:
            from scripts.migrate_clients import migrate_clients_table
            migrate_clients_table()
        except Exception as e:
            print(f'⚠️  Предупреждение при миграции клиентов: {e}')
        
        db.create_all()
        # Заполняем начальными данными, если БД пустая
        from scripts.init_data import init_initial_data
        init_initial_data()
    
    print('🚀 Сервер запущен на http://localhost:5000')
    print('📊 API доступен по адресу http://localhost:5000/api')
    print('📄 Фронтенд доступен по адресу http://localhost:5000/')
    print('📱 Мини-приложение доступно по адресу http://localhost:5000/miniaps/')
    app.run(debug=True, host='0.0.0.0', port=5000)

