from decimal import Decimal
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from Productos.models import Productos
from Usuarios.models import Estado
from Ventas.models import Carrito, Pedidos, DetallePedidos, Venta
from Utils.responses import api_response
from .serializers import AgregarAlCarritoSerializer, CarritoItemSerializer, VentaSerializer


# ── helpers ───────────────────────────────────────────────────────────────────

def _estado(nombre: str):
    return Estado.objects.get(nombre=nombre)

def _items_activos(usuario):
    return (
        Carrito.objects
        .filter(fk_usuario=usuario, fk_estado__nombre="Activo")
        .select_related("fk_producto", "fk_producto__fk_usuario", "fk_estado")
        .order_by("fk_producto__fk_usuario__nombre", "fecha")
    )

def _resumen(items, request):
    data        = CarritoItemSerializer(items, many=True, context={"request": request}).data
    total_precio = sum(i["subtotal"] for i in data)
    total_cant   = sum(i["cantidad_producto"] for i in data)
    return {
        "items":            data,
        "total_productos":  total_cant,
        "total_precio":     total_precio,
    }


# ── vistas ────────────────────────────────────────────────────────────────────

class CarritoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = _items_activos(request.user)
        return api_response(
            "Carrito obtenido exitosamente",
            data=_resumen(items, request),
            http_status=status.HTTP_200_OK,
        )

    def post(self, request):
        ser = AgregarAlCarritoSerializer(data=request.data)
        if not ser.is_valid():
            return api_response(
                "Datos inválidos",
                data=ser.errors,
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        producto = Productos.objects.get(pk=ser.validated_data["fk_producto"])
        cantidad = ser.validated_data["cantidad_producto"]

        # Si el mismo producto ya está en el carrito activo → sumar cantidad
        item_existente = Carrito.objects.filter(
            fk_usuario=request.user,
            fk_producto=producto,
            fk_estado__nombre="Activo",
        ).first()

        if item_existente:
            item_existente.cantidad_producto += cantidad
            item_existente.save()
        else:
            Carrito.objects.create(
                fk_usuario=request.user,
                fk_producto=producto,
                cantidad_producto=cantidad,
                fk_estado=_estado("Activo"),
            )

        items = _items_activos(request.user)
        return api_response(
            "Producto agregado al carrito",
            data=_resumen(items, request),
            http_status=status.HTTP_201_CREATED,
        )


class CarritoItemView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_item(self, request, pk):
        try:
            return Carrito.objects.get(pk=pk, fk_usuario=request.user)
        except Carrito.DoesNotExist:
            return None

    def patch(self, request, pk):
        item = self._get_item(request, pk)
        if not item:
            return api_response("Ítem no encontrado", http_status=status.HTTP_404_NOT_FOUND)

        cantidad = request.data.get("cantidad_producto")
        if cantidad is None or int(cantidad) < 1:
            return api_response("Cantidad inválida", http_status=status.HTTP_400_BAD_REQUEST)

        item.cantidad_producto = int(cantidad)
        item.save()

        items = _items_activos(request.user)
        return api_response(
            "Cantidad actualizada",
            data=_resumen(items, request),
            http_status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        item = self._get_item(request, pk)
        if not item:
            return api_response("Ítem no encontrado", http_status=status.HTTP_404_NOT_FOUND)

        item.delete()

        items = _items_activos(request.user)
        return api_response(
            "Producto eliminado del carrito",
            data=_resumen(items, request),
            http_status=status.HTTP_200_OK,
        )


class RealizarPedidoView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        items = list(_items_activos(request.user))

        if not items:
            return api_response(
                "El carrito está vacío",
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        estado_pendiente = _estado("Pendiente")
        estado_inactivo  = _estado("Inactivo")

        total   = sum(
            Decimal(str(i.fk_producto.precio)) * i.cantidad_producto
            for i in items
        )
        cant_total = sum(i.cantidad_producto for i in items)

        pedido = Pedidos.objects.create(
            fk_usuario=request.user,
            fk_estado=estado_pendiente,
            cantidad_productos=cant_total,
            total_pedido=total,
        )
        for item in items:
            DetallePedidos.objects.create(
                fk_pedido=pedido,
                fk_producto=item.fk_producto,
                cantidad_producto=item.cantidad_producto,
                total_pedido=Decimal(str(item.fk_producto.precio)) * item.cantidad_producto,
                fk_estado=estado_pendiente,
            )
            Venta.objects.create(
                fk_producto=item.fk_producto,
                fk_usuario=item.fk_producto.fk_usuario,
                comprador = request.user,
                total_venta = Decimal(str(item.fk_producto.precio)) * item.cantidad_producto,
                cantidad_producto = item.cantidad_producto,
                fk_estado_id = 1,
            )

            item.fk_estado = estado_inactivo
            item.save()
            

        return api_response(
            "Pedido realizado exitosamente",
            data={
                "pk_pedido":          pedido.pk_pedido,
                "total_pedido":       float(pedido.total_pedido),
                "cantidad_productos": pedido.cantidad_productos,
            },
            http_status=status.HTTP_201_CREATED,
        )


class MisVentasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = (
            Venta.objects
            .filter(fk_usuario=request.user)
            .select_related("fk_producto", "comprador", "fk_estado")
            .order_by("-fecha")
        )

        estado = request.query_params.get("estado")
        if estado:
            qs = qs.filter(fk_estado__pk=estado)

        fecha = request.query_params.get("fecha")
        if fecha:
            qs = qs.filter(fecha__date=fecha)

        data = VentaSerializer(qs, many=True).data
        return api_response("Ventas obtenidas", data=data, http_status=status.HTTP_200_OK)


class CambiarEstadoVentaView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            venta = Venta.objects.get(pk=pk, fk_usuario=request.user)
        except Venta.DoesNotExist:
            return api_response("Venta no encontrada", http_status=status.HTTP_404_NOT_FOUND)

        fk_estado = request.data.get("fk_estado")
        if not fk_estado:
            return api_response("Estado requerido", http_status=status.HTTP_400_BAD_REQUEST)

        try:
            nuevo_estado = Estado.objects.get(pk=fk_estado)
        except Estado.DoesNotExist:
            return api_response("Estado no válido", http_status=status.HTTP_400_BAD_REQUEST)

        venta.fk_estado = nuevo_estado
        venta.save()

        return api_response(
            "Estado actualizado",
            data=VentaSerializer(venta).data,
            http_status=status.HTTP_200_OK,
        )