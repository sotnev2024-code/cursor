"""
Скрипт миграции таблицы specialists
Добавляет новые поля: schedule_type, schedule_start_date, work_dates
Удаляет поле: days_off (если существует)
"""
import sqlite3
import os
from pathlib import Path

def migrate_specialists_table():
    """Миграция таблицы specialists"""
    # Путь к базе данных
    basedir = Path(__file__).parent.parent
    db_path = basedir / 'database' / 'beauty_salon.db'
    
    if not db_path.exists():
        print(f"База данных не найдена: {db_path}")
        return False
    
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    try:
        # Получаем список колонок в таблице
        cursor.execute("PRAGMA table_info(specialists)")
        columns = {row[1]: row for row in cursor.fetchall()}
        
        # Добавляем schedule_type, если его нет
        if 'schedule_type' not in columns:
            print("Добавляем поле schedule_type...")
            cursor.execute("ALTER TABLE specialists ADD COLUMN schedule_type VARCHAR(20) DEFAULT '5x2'")
            # Обновляем существующие записи
            cursor.execute("UPDATE specialists SET schedule_type = '5x2' WHERE schedule_type IS NULL")
        
        # Добавляем schedule_start_date, если его нет
        if 'schedule_start_date' not in columns:
            print("Добавляем поле schedule_start_date...")
            cursor.execute("ALTER TABLE specialists ADD COLUMN schedule_start_date DATE")
        
        # Добавляем work_dates, если его нет
        if 'work_dates' not in columns:
            print("Добавляем поле work_dates...")
            cursor.execute("ALTER TABLE specialists ADD COLUMN work_dates TEXT")
        
        # Удаляем days_off, если он существует (опционально, можно оставить для совместимости)
        # if 'days_off' in columns:
        #     print("Удаляем поле days_off...")
        #     # SQLite не поддерживает DROP COLUMN напрямую, нужно пересоздать таблицу
        #     # Пока оставим поле, оно просто не будет использоваться
        
        conn.commit()
        print("Миграция успешно завершена!")
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"Ошибка при миграции: {e}")
        return False
    finally:
        conn.close()

if __name__ == '__main__':
    migrate_specialists_table()

