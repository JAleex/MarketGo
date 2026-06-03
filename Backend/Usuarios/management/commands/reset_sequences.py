from django.core.management.base import BaseCommand
from django.db import connection
from django.apps import apps


class Command(BaseCommand):
    help = "Resetea las secuencias de PK de PostgreSQL al máximo ID existente"

    def handle(self, *args, **options):
        app_labels = ["Usuarios", "Productos", "Ventas"]
        sequence_sql = connection.ops.sequence_reset_sql(
            self.style,
            [
                model
                for label in app_labels
                for model in apps.get_app_config(label).get_models()
            ],
        )

        if not sequence_sql:
            self.stdout.write("No hay secuencias que resetear.")
            return

        with connection.cursor() as cursor:
            for sql in sequence_sql:
                cursor.execute(sql)

        self.stdout.write(self.style.SUCCESS(f"Secuencias reseteadas ({len(sequence_sql)} tablas)."))
