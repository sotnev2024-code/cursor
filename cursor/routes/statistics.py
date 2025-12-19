"""
Роуты для работы со статистикой
"""
from flask import Blueprint, request, jsonify
from database.models import db, Booking, Service, Specialist, Client
from datetime import datetime, timedelta
from sqlalchemy import func, and_

statistics_bp = Blueprint('statistics', __name__)


@statistics_bp.route('/', methods=['GET'])
def get_statistics():
    """Получить статистику"""
    try:
        period = request.args.get('period', 'month')  # day, week, month, year
        
        # Определяем диапазон дат
        now = datetime.now()
        
        if period == 'day':
            start_date = end_date = now.date()
        elif period == 'week':
            start_date = (now - timedelta(days=now.weekday())).date()
            end_date = now.date()
        elif period == 'month':
            start_date = now.replace(day=1).date()
            end_date = now.date()
        elif period == 'year':
            start_date = now.replace(month=1, day=1).date()
            end_date = now.date()
        else:
            start_date = now.replace(day=1).date()
            end_date = now.date()
        
        # Общая статистика
        total_bookings = Booking.query.filter(
            and_(
                Booking.date >= start_date,
                Booking.date <= end_date
            )
        ).count()
        
        completed_bookings = Booking.query.filter(
            and_(
                Booking.date >= start_date,
                Booking.date <= end_date,
                Booking.status == 'COMPLETED'
            )
        ).count()
        
        total_revenue = db.session.query(func.sum(Booking.price)).filter(
            and_(
                Booking.date >= start_date,
                Booking.date <= end_date,
                Booking.status == 'COMPLETED'
            )
        ).scalar() or 0
        
        total_clients = db.session.query(func.count(func.distinct(Booking.client_id))).filter(
            and_(
                Booking.date >= start_date,
                Booking.date <= end_date
            )
        ).scalar() or 0
        
        # Подсчитываем повторных клиентов (с более чем одной записью)
        repeat_clients = db.session.query(func.count(func.distinct(Booking.client_id))).filter(
            and_(
                Booking.date >= start_date,
                Booking.date <= end_date
            )
        ).group_by(Booking.client_id).having(func.count(Booking.id) > 1).count()
        
        # Подсчитываем новых клиентов (первая запись в периоде)
        # Это упрощенный расчет - клиенты, у которых первая запись в этом периоде
        new_clients = 0
        if period == 'day' or period == 'week' or period == 'month':
            # Для коротких периодов считаем клиентов, у которых первая запись в этом периоде
            clients_in_period = db.session.query(Booking.client_id).filter(
                and_(
                    Booking.date >= start_date,
                    Booking.date <= end_date
                )
            ).distinct().all()
            
            for client_id_tuple in clients_in_period:
                client_id = client_id_tuple[0]
                # Проверяем, есть ли записи до этого периода
                earlier_bookings = Booking.query.filter(
                    and_(
                        Booking.client_id == client_id,
                        Booking.date < start_date
                    )
                ).count()
                if earlier_bookings == 0:
                    new_clients += 1
        
        # Статистика по услугам
        services_stats = db.session.query(
            Service.name,
            func.count(Booking.id).label('bookings_count'),
            func.sum(Booking.price).label('revenue')
        ).outerjoin(
            Booking, and_(
                Service.id == Booking.service_id,
                Booking.date >= start_date,
                Booking.date <= end_date,
                Booking.status == 'COMPLETED'
            )
        ).group_by(Service.id).order_by(
            func.count(Booking.id).desc()
        ).limit(10).all()
        
        services_data = [{
            'name': name,
            'bookings_count': count or 0,
            'revenue': float(revenue) if revenue else 0
        } for name, count, revenue in services_stats]
        
        # Статистика по специалистам
        specialists_stats = db.session.query(
            Specialist.name,
            func.count(Booking.id).label('bookings_count'),
            func.sum(Booking.price).label('revenue')
        ).outerjoin(
            Booking, and_(
                Specialist.id == Booking.specialist_id,
                Booking.date >= start_date,
                Booking.date <= end_date,
                Booking.status == 'COMPLETED'
            )
        ).filter(
            Specialist.is_active == True
        ).group_by(Specialist.id).order_by(
            func.count(Booking.id).desc()
        ).limit(10).all()
        
        specialists_data = [{
            'name': name,
            'bookings_count': count or 0,
            'revenue': float(revenue) if revenue else 0
        } for name, count, revenue in specialists_stats]
        
        return jsonify({
            'success': True,
            'data': {
                'period': period,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'total_bookings': total_bookings,
                'completed_bookings': completed_bookings,
                'total_revenue': float(total_revenue),
                'total_clients': total_clients,
                'repeat_clients': repeat_clients,
                'new_clients': new_clients,
                'services': services_data,
                'specialists': specialists_data
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ошибка получения статистики: {str(e)}'
        }), 500

