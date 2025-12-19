"""
Скрипт миграции таблицы clients
Добавляет новые поля: telegram_id, source
"""
import sqlite3
from pathlib import Path

def migrate_clients_table():
    """Миграция таблицы clients"""
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
        cursor.execute("PRAGMA table_info(clients)")
        columns = {row[1]: row for row in cursor.fetchall()}
        
        # Добавляем telegram_id, если его нет
        if 'telegram_id' not in columns:
            print("Добавляем поле telegram_id...")
            cursor.execute("ALTER TABLE clients ADD COLUMN telegram_id VARCHAR(100)")
        
        # Добавляем source, если его нет
        if 'source' not in columns:
            print("Добавляем поле source...")
            cursor.execute("ALTER TABLE clients ADD COLUMN source VARCHAR(100)")
        
        conn.commit()
        print("Миграция клиентов успешно завершена!")
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"Ошибка при миграции: {e}")
        return False
    finally:
        conn.close()

if __name__ == '__main__':
    migrate_clients_table()

