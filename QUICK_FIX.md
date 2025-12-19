# Быстрое исправление ошибки Python 3.13

## Проблема
```
AssertionError: Class <class 'sqlalchemy.sql.elements.SQLCoreOperations'> directly inherits TypingOnly but has additional attributes
```

## Решение (выполните в терминале)

```bash
# В активированном виртуальном окружении (venv)
pip install --upgrade SQLAlchemy>=2.0.36
```

После этого запустите:

```bash
python app.py
```

## Альтернатива

Если обновление не помогает, переустановите все зависимости:

```bash
pip install --upgrade -r requirements.txt
```

