#!/bin/sh
set -e

echo "==> Ejecutando migraciones..."
python manage.py migrate --noinput

echo "==> Insertando datos base..."
python manage.py seed_data

echo "==> Reseteando secuencias de PK..."
python manage.py sqlsequencereset Usuarios Productos Ventas | python manage.py dbshell

echo "==> Iniciando servidor..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120 \
    --access-logfile -
