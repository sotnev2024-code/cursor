"""
Роуты для работы с дашбордом
"""
from flask import Blueprint, request, jsonify
from database.models import db, Booking, Service, Specialist, Client
from datetime import datetime, timedelta, date
from sqlalchemy import func, and_, or_

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/', methods=['GET'])
def get_dashboard():
    """Получить данные для дашборда"""
    try:
        today = date.today()
        tomorrow = today + timedelta(days=1)
        
        # Записи на сегодня
        today_bookings = Booking.query.filter(
            and_(
                Booking.date == today,
                Booking.status != 'CANCELLED'
            )
        ).count()
        
        # Выручка за сегодня
        today_revenue = db.session.query(func.sum(Booking.price)).filter(
            and_(
                Booking.date == today,
                Booking.status == 'COMPLETED'
            )
        ).scalar() or 0
        
        # Активные клиенты (с записями за последние 30 дней)
        thirty_days_ago = today - timedelta(days=30)
        active_clients = db.session.query(func.count(func.distinct(Booking.client_id))).filter(
            and_(
                Booking.date >= thirty_days_ago,
                Booking.date <= today
            )
        ).scalar() or 0
        
        # Ближайшие записи (сегодня и завтра, статус не CANCELLED)
        upcoming_bookings = Booking.query.filter(
            and_(
                Booking.date >= today,
                Booking.date <= tomorrow,
                Booking.status != 'CANCELLED'
            )
        ).order_by(Booking.date.asc(), Booking.time.asc()).limit(10).all()
        
        upcoming_data = []
        for booking in upcoming_bookings:
            upcoming_data.append({
                'id': booking.id,
                'date': booking.date.isoformat() if booking.date else None,
                'time': booking.time.strftime('%H:%M') if booking.time else None,
                'client_name': booking.client.name if booking.client else None,
                'client_phone': booking.client.phone if booking.client else None,
                'specialist_name': booking.specialist.name if booking.specialist else None,
                'service_name': booking.service.name if booking.service else None,
                'status': booking.status,
                'price': float(booking.price) if booking.price else 0
            })
        
        # Топ специалистов (по количеству записей за последние 7 дней)
        week_ago = today - timedelta(days=7)
        specialists_stats = db.session.query(
            Specialist.id,
            Specialist.name,
            Specialist.position,
            func.count(Booking.id).label('bookings_count')
        ).outerjoin(
            Booking, and_(
                Specialist.id == Booking.specialist_id,
                Booking.date >= week_ago,
                Booking.date <= today,
                Booking.status != 'CANCELLED'
            )
        ).filter(
            Specialist.is_active == True
        ).group_by(Specialist.id).order_by(
            func.count(Booking.id).desc()
        ).limit(5).all()
        
        top_specialists = [{
            'id': spec_id,
            'name': name,
            'position': position,
            'bookings_count': count or 0
        } for spec_id, name, position, count in specialists_stats]
        
        # Срочные действия
        hold_bookings = Booking.query.filter(
            and_(
                Booking.status == 'HOLD',
                Booking.date >= today
            )
        ).count()
        
        tomorrow_bookings = Booking.query.filter(
            and_(
                Booking.date == tomorrow,
                Booking.status != 'CANCELLED'
            )
        ).count()
        
        unconfirmed_bookings = Booking.query.filter(
            and_(
                Booking.status == 'PENDING',
                Booking.date >= today
            )
        ).count()
        
        # Последние активности (последние 10 записей)
        recent_bookings = Booking.query.filter(
            Booking.date >= today - timedelta(days=7)
        ).order_by(Booking.created_at.desc()).limit(10).all()
        
        recent_activity = []
        for booking in recent_bookings:
            activity_type = 'создана'
            if booking.status == 'COMPLETED':
                activity_type = 'завершена'
            elif booking.status == 'CANCELLED':
                activity_type = 'отменена'
            elif booking.status == 'CONFIRMED':
                activity_type = 'подтверждена'
            
            recent_activity.append({
                'id': booking.id,
                'type': activity_type,
                'date': booking.date.isoformat() if booking.date else None,
                'time': booking.time.strftime('%H:%M') if booking.time else None,
                'client_name': booking.client.name if booking.client else None,
                'service_name': booking.service.name if booking.service else None,
                'created_at': booking.created_at.isoformat() if booking.created_at else None
            })
        
        # Уведомления (можно расширить в будущем)
        pending_notifications = 0  # Пока заглушка
        
        return jsonify({
            'success': True,
            'data': {
                'todayBookings': today_bookings,
                'revenueToday': float(today_revenue),
                'clientsCount': active_clients,
                'pendingNotifications': pending_notifications,
                'upcomingBookings': upcoming_data,
                'topSpecialists': top_specialists,
                'holdBookingsCount': hold_bookings,
                'tomorrowBookingsCount': tomorrow_bookings,
                'unconfirmedCount': unconfirmed_bookings,
                'recentActivity': recent_activity
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ошибка получения данных дашборда: {str(e)}'
        }), 500

