from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('usuarios/', include('Usuarios.urls')),
    path('productos/', include('Productos.urls')),
]

# Configuración para archivos media (imágenes locales)
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )