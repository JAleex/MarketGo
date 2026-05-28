from django.urls import path
from . import views
from .views import *

urlpatterns = [
# ==================== PRODUCTOS HOME PAGE ====================

path('productos/',ProductosListView.as_view(),name='productos-listar'),
path("productos/<int:pk>/", ProductoDetallePublicoView.as_view(), name="producto-detalle"),

# ==================== MIS PRODUCTOS ====================
path('mis-productos/',MisProductosListView.as_view(),name='mis-productos-listar'),
path('cambiar-estado-producto/<int:pk>/',ToggleEstadoProductoView.as_view(),name='mis-productos-cambiar-estado'),
path("crear-mis-productos/",MisProductosListCreateView.as_view(),name="mis-productos",),



]