# Исправление ошибки с Python 3.13

## Проблема

При использовании Python 3.13 возникает ошибка:
```
AssertionError: Class <class 'sqlalchemy.sql.elements.SQLCoreOperations'> directly inherits TypingOnly but has additional attributes
```

Это связано с несовместимостью старых версий SQLAlchemy с Python 3.13.

## Решение

### Вариант 1: Обновить SQLAlchemy (рекомендуется)

В вашем виртуальном окружении выполните:

```bash
pip install --upgrade SQLAlchemy>=2.0.36
```

Или переустановите все зависимости:

```bash
pip install --upgrade -r requirements.txt
```

После обновления попробуйте снова запустить:

```bash
python app.py
```

### Вариант 2: Использовать Python 3.11 или 3.12

Если обновление не помогает, можно использовать более старую версию Python:

```bash
# Создать новое виртуальное окружение с Python 3.12
python3.12 -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### Вариант 3: Использовать конкретную версию SQLAlchemy

Если проблемы продолжаются, можно зафиксировать конкретную версию:

```bash
pip install SQLAlchemy==2.0.36 Flask-SQLAlchemy==3.1.1
```

## Проверка

После обновления попробуйте запустить:

```bash
python app.py
```

Если ошибка сохраняется, проверьте версию SQLAlchemy:

```bash
python -c "import sqlalchemy; print(sqlalchemy.__version__)"
```

Должна быть версия 2.0.36 или выше.

