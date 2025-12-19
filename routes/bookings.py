"""
Роуты для работы с записями (бронированиями)
"""
from flask import Blueprint, request, jsonify
from database.models import db, Booking, Specialist, Service, Client
from datetime import datetime, date, time, timedelta
from sqlalchemy import and_, or_
import json

bookings_bp = Blueprint('bookings', __name__)


@bookings_bp.route('/', methods=['GET'])
def get_bookings():
    """Получить все записи"""
    try:
        query = Booking.query
        
        # Фильтры
        filter_date = request.args.get('date')
        filter_status = request.args.get('status')
        filter_specialist_id = request.args.get('specialist_id')
        
        if filter_date:
            query = query.filter(Booking.date == filter_date)
        
        if filter_status:
            query = query.filter(Booking.status == filter_status)
        
        if filter_specialist_id:
            query = query.filter(Booking.specialist_id == filter_specialist_id)
        
        bookings = query.order_by(Booking.date.desc(), Booking.time.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [b.to_dict() for b in bookings]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ошибка получения списка записей: {str(e)}'
        }), 500


@bookings_bp.route('/<int:booking_id>', methods=['GET'])
def get_booking(booking_id):
    """Получить запись по ID"""
    try:
        booking = Booking.query.get_or_404(booking_id)
        return jsonify({
            'success': True,
            'data': booking.to_dict()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ошибка получения записи: {str(e)}'
        }), 500


@bookings_bp.route('/available-dates', methods=['GET'])
def get_available_dates():
    """Получить доступные даты для бронирования"""
    try:
        service_id = request.args.get('service_id')
        specialist_id = request.args.get('specialist_id')  # может быть "any"
        start_date = request.args.get('start_date', date.today().isoformat())
        days_ahead = int(request.args.get('days_ahead', 30))
        
        if not service_id:
            return jsonify({
                'success': False,
                'error': 'Не указана услуга'
            }), 400
        
        service = Service.query.get_or_404(service_id)
        duration = service.duration
        
        # Получаем список специалистов
        if specialist_id and specialist_id != 'any':
            specialists = [Specialist.query.get_or_404(specialist_id)]
        else:
            # Получаем всех активных специалистов, которые предоставляют эту услугу
            specialists = Specialist.query.filter_by(is_active=True).all()
            # Фильтруем тех, кто предоставляет выбранную услугу (через связь многие-ко-многим)
            service = Service.query.get(service_id)
            if service:
                specialists = [s for s in specialists if service in s.services]
            else:
                specialists = []
        
        if not specialists:
            return jsonify({
                'success': False,
                'error': 'Нет доступных специалистов для этой услуги'
            }), 400
        
        # Генерируем список дат
        start = datetime.strptime(start_date, '%Y-%m-%d').date()
        available_dates = []
        
        print(f"Проверяем доступность для {len(specialists)} специалистов")
        print(f"Услуга: {service.name}, длительность: {duration} мин")
        
        for i in range(days_ahead):
            check_date = start + timedelta(days=i)
            
            # Проверяем, есть ли хотя бы один специалист, доступный в эту дату
            for specialist in specialists:
                is_available = is_specialist_available_on_date(specialist, check_date)
                print(f"Специалист {specialist.name} доступен {check_date}: {is_available}")
                
                if is_available:
                    # Проверяем, есть ли свободное время в этот день
                    available_times = get_available_times_for_date(specialist, check_date, duration)
                    print(f"  Свободное время: {len(available_times)} слотов")
                    if available_times:
                        available_dates.append(check_date.isoformat())
                        break
        
        print(f"Найдено доступных дат: {len(available_dates)}")
        
        return jsonify({
            'success': True,
            'data': sorted(list(set(available_dates)))  # Убираем дубликаты и сортируем
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ошибка получения доступных дат: {str(e)}'
        }), 500


@bookings_bp.route('/available-times', methods=['GET'])
def get_available_times():
    """Получить доступное время для бронирования"""
    try:
        service_id = request.args.get('service_id')
        specialist_id = request.args.get('specialist_id')  # может быть "any"
        booking_date = request.args.get('date')
        
        if not service_id or not booking_date:
            return jsonify({
                'success': False,
                'error': 'Не указаны услуга или дата'
            }), 400
        
        service = Service.query.get_or_404(service_id)
        duration = service.duration
        booking_date_obj = datetime.strptime(booking_date, '%Y-%m-%d').date()
        
        # Получаем список специалистов
        if specialist_id and specialist_id != 'any':
            specialists = [Specialist.query.get_or_404(specialist_id)]
        else:
            # Получаем всех активных специалистов, которые предоставляют эту услугу
            specialists = Specialist.query.filter_by(is_active=True).all()
            # Фильтруем тех, кто предоставляет выбранную услугу (через связь многие-ко-многим)
            service = Service.query.get(service_id)
            if service:
                specialists = [s for s in specialists if service in s.services]
            else:
                specialists = []
        
        if not specialists:
            return jsonify({
                'success': False,
                'error': 'Нет доступных специалистов для этой услуги'
            }), 400
        
        # Собираем доступное время от всех специалистов
        all_available_times = {}
        
        for specialist in specialists:
            if is_specialist_available_on_date(specialist, booking_date_obj):
                times = get_available_times_for_date(specialist, booking_date_obj, duration)
                for time_slot in times:
                    if time_slot not in all_available_times:
                        all_available_times[time_slot] = []
                    all_available_times[time_slot].append({
                        'id': specialist.id,
                        'name': specialist.name
                    })
        
        # Сортируем время
        sorted_times = sorted(all_available_times.keys())
        
        result = []
        for time_str in sorted_times:
            result.append({
                'time': time_str,
                'specialists': all_available_times[time_str]
            })
        
        return jsonify({
            'success': True,
            'data': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ошибка получения доступного времени: {str(e)}'
        }), 500


def is_specialist_available_on_date(specialist, check_date):
    """Проверяет, доступен ли специалист в указанную дату"""
    schedule_type = specialist.schedule_type or '5x2'
    
    if schedule_type == 'flexible':
        # Для свободного графика проверяем work_dates
        work_dates = specialist.get_work_dates()
        if not work_dates:
            return False
        return check_date.isoformat() in work_dates
    
    elif schedule_type == '5x2':
        # 5 рабочих дней, 2 выходных
        if not specialist.schedule_start_date:
            # Если нет даты начала, считаем что специалист работает (для обратной совместимости)
            return True
        
        # Вычисляем количество дней с начала графика
        days_diff = (check_date - specialist.schedule_start_date).days
        if days_diff < 0:
            return False
        
        # Определяем день недели в цикле (0-6, где 0 - первый рабочий день)
        day_in_cycle = days_diff % 7
        
        # Первые 5 дней - рабочие, последние 2 - выходные
        return day_in_cycle < 5
    
    elif schedule_type == '2x2':
        # 2 рабочих дня, 2 выходных
        if not specialist.schedule_start_date:
            # Если нет даты начала, считаем что специалист работает (для обратной совместимости)
            return True
        
        days_diff = (check_date - specialist.schedule_start_date).days
        if days_diff < 0:
            return False
        
        # Определяем день в цикле (0-3)
        day_in_cycle = days_diff % 4
        
        # Первые 2 дня - рабочие, последние 2 - выходные
        return day_in_cycle < 2
    
    # По умолчанию считаем что специалист доступен (для обратной совместимости)
    return True


def get_available_times_for_date(specialist, booking_date, duration):
    """Получает список доступного времени для специалиста в указанную дату"""
    # Парсим время начала и конца работы
    start_time = datetime.strptime(specialist.start_time or '09:00', '%H:%M').time()
    end_time = datetime.strptime(specialist.end_time or '18:00', '%H:%M').time()
    step = specialist.step or 30
    
    # Получаем все записи специалиста на эту дату
    existing_bookings = Booking.query.filter(
        and_(
            Booking.specialist_id == specialist.id,
            Booking.date == booking_date,
            Booking.status != 'CANCELLED'
        )
    ).order_by(Booking.time).all()
    
    # Генерируем возможные временные слоты
    available_times = []
    current_time = start_time
    
    while True:
        # Проверяем, помещается ли услуга до конца рабочего дня
        end_slot = add_minutes_to_time(current_time, duration)
        if end_slot > end_time:
            break
        
        # Проверяем, не пересекается ли слот с существующими записями
        is_available = True
        for booking in existing_bookings:
            booking_start = booking.time
            booking_end = add_minutes_to_time(booking_start, booking.duration)
            
            # Проверяем пересечение
            if not (end_slot <= booking_start or current_time >= booking_end):
                is_available = False
                break
        
        if is_available:
            available_times.append(current_time.strftime('%H:%M'))
        
        # Переходим к следующему слоту
        current_time = add_minutes_to_time(current_time, step)
        if current_time >= end_time:
            break
    
    return available_times


def add_minutes_to_time(time_obj, minutes):
    """Добавляет минуты к времени"""
    dt = datetime.combine(date.today(), time_obj)
    dt += timedelta(minutes=minutes)
    return dt.time()


@bookings_bp.route('/', methods=['POST'])
def create_booking():
    """Создать новую запись"""
    try:
        data = request.json
        
        # Проверяем конфликт времени
        booking_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        booking_time = datetime.strptime(data['time'], '%H:%M').time()
        
        existing = Booking.query.filter(
            and_(
                Booking.specialist_id == data['specialist_id'],
                Booking.date == booking_date,
                Booking.time == booking_time,
                Booking.status != 'CANCELLED'
            )
        ).first()
        
        if existing:
            return jsonify({
                'success': False,
                'error': 'Это время уже занято'
            }), 400
        
        booking = Booking(
            client_id=data['client_id'],
            specialist_id=data['specialist_id'],
            service_id=data['service_id'],
            date=booking_date,
            time=booking_time,
            duration=data.get('duration', 30),
            price=data.get('price', 0),
            status=data.get('status', 'PENDING'),
            payment_method=data.get('payment_method'),
            comment=data.get('comment')
        )
        
        db.session.add(booking)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': booking.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Ошибка создания записи: {str(e)}'
        }), 500


@bookings_bp.route('/<int:booking_id>', methods=['PUT'])
def update_booking(booking_id):
    """Обновить запись"""
    try:
        booking = Booking.query.get_or_404(booking_id)
        data = request.json
        
        # Проверяем конфликт времени (если изменились дата, время или специалист)
        booking_date = datetime.strptime(data.get('date', booking.date.isoformat()), '%Y-%m-%d').date()
        booking_time = datetime.strptime(data.get('time', booking.time.strftime('%H:%M')), '%H:%M').time()
        specialist_id = data.get('specialist_id', booking.specialist_id)
        
        if booking_date != booking.date or booking_time != booking.time or specialist_id != booking.specialist_id:
            existing = Booking.query.filter(
                and_(
                    Booking.specialist_id == specialist_id,
                    Booking.date == booking_date,
                    Booking.time == booking_time,
                    Booking.status != 'CANCELLED',
                    Booking.id != booking_id
                )
            ).first()
            
            if existing:
                return jsonify({
                    'success': False,
                    'error': 'Это время уже занято'
                }), 400
        
        booking.client_id = data.get('client_id', booking.client_id)
        booking.specialist_id = specialist_id
        booking.service_id = data.get('service_id', booking.service_id)
        booking.date = booking_date
        booking.time = booking_time
        booking.duration = data.get('duration', booking.duration)
        booking.price = data.get('price', booking.price)
        booking.status = data.get('status', booking.status)
        booking.payment_method = data.get('payment_method', booking.payment_method)
        booking.payment_status = data.get('payment_status', booking.payment_status)
        booking.comment = data.get('comment', booking.comment)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': booking.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Ошибка обновления записи: {str(e)}'
        }), 500


@bookings_bp.route('/<int:booking_id>', methods=['DELETE'])
def delete_booking(booking_id):
    """Удалить запись"""
    try:
        booking = Booking.query.get_or_404(booking_id)
        db.session.delete(booking)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Запись удалена'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Ошибка удаления записи: {str(e)}'
        }), 500
