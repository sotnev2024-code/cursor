# Пакет с роутами API
from .specialists import specialists_bp
from .clients import clients_bp
from .services import services_bp
from .categories import categories_bp
from .bookings import bookings_bp
from .statistics import statistics_bp
from .notifications import notifications_bp
from .settings import settings_bp
from .dashboard import dashboard_bp
from .telegram import telegram_bp

__all__ = [
    'specialists_bp',
    'clients_bp',
    'services_bp',
    'categories_bp',
    'bookings_bp',
    'statistics_bp',
    'notifications_bp',
    'settings_bp',
    'dashboard_bp',
    'telegram_bp'
]

