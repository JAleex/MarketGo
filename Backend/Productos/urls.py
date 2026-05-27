from django.urls import path
from . import views
from .views import *

urlpatterns = [
# ==================== PRODUCTOS ====================

path('productos/',ProductosListView.as_view(),name='productos-listar'),

]