from django.urls import path
from .views import (
    CarritoView, CarritoItemView, RealizarPedidoView,
    MisVentasView, CambiarEstadoVentaView,
    MisPedidosView, DetallePedidoView,
)

urlpatterns = [
    path("carrito/",                        CarritoView.as_view(),            name="carrito"),
    path("carrito/<int:pk>/",               CarritoItemView.as_view(),        name="carrito-item"),
    path("realizar-pedido/",                RealizarPedidoView.as_view(),     name="realizar-pedido"),
    path("mis-ventas/",                     MisVentasView.as_view(),          name="mis-ventas"),
    path("mis-ventas/<int:pk>/estado/",     CambiarEstadoVentaView.as_view(), name="mis-ventas-estado"),
    path("mis-pedidos/",                    MisPedidosView.as_view(),         name="mis-pedidos"),
    path("mis-pedidos/<int:pk>/detalle/",   DetallePedidoView.as_view(),      name="mis-pedidos-detalle"),
]