
from django.contrib import admin
from django.urls import path, include,re_path

urlpatterns = [
    path('usuarios/', include('Usuarios.urls'))
]
