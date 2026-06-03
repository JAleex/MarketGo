from config.settings import *  # noqa: F401, F403

# Reemplaza PostgreSQL con SQLite en memoria para los tests.
# Esto evita dependencias externas y hace los tests más rápidos.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}
