from rest_framework import serializers
from Ventas.models import Carrito, Pedidos, DetallePedidos, Venta
from Productos.models import Productos


class AgregarAlCarritoSerializer(serializers.Serializer):
    """Payload para agregar un producto al carrito."""
    fk_producto      = serializers.IntegerField()
    cantidad_producto = serializers.IntegerField(min_value=1)

    def validate_fk_producto(self, value):
        if not Productos.objects.filter(pk=value, fk_estado__nombre="Activo").exists():
            raise serializers.ValidationError("Producto no disponible.")
        return value


class CarritoItemSerializer(serializers.ModelSerializer):
    """Un ítem del carrito con datos del producto embebidos."""
    producto_nombre    = serializers.CharField(source="fk_producto.nombre",    read_only=True)
    producto_precio    = serializers.DecimalField(
        source="fk_producto.precio", max_digits=12, decimal_places=2, read_only=True
    )
    vendedor_nombre    = serializers.SerializerMethodField()
    imagen_url         = serializers.SerializerMethodField()
    subtotal           = serializers.SerializerMethodField()

    class Meta:
        model  = Carrito
        fields = [
            "pk_carrito",
            "fk_producto",
            "producto_nombre",
            "producto_precio",
            "vendedor_nombre",
            "imagen_url",
            "cantidad_producto",
            "subtotal",
            "fecha",
        ]

    def get_vendedor_nombre(self, obj):
        u = obj.fk_producto.fk_usuario
        return u.nombre or u.usuario

    def get_imagen_url(self, obj):
        request = self.context.get("request")
        if obj.fk_producto.ruta_imagen and request:
            return request.build_absolute_uri(f"/media/{obj.fk_producto.ruta_imagen}")
        return None

    def get_subtotal(self, obj):
        return float(obj.fk_producto.precio) * obj.cantidad_producto


class ResumenCarritoSerializer(serializers.Serializer):
    """Resumen agregado del carrito para el panel lateral."""
    total_productos = serializers.IntegerField()
    total_precio    = serializers.FloatField()
    items           = CarritoItemSerializer(many=True)


class VentaSerializer(serializers.ModelSerializer):
    comprador_nombre = serializers.SerializerMethodField()
    comprador_correo = serializers.SerializerMethodField()
    estado_nombre    = serializers.CharField(source="fk_estado.nombre", read_only=True)
    pk_producto      = serializers.IntegerField(source="fk_producto.pk_producto", read_only=True)

    class Meta:
        model  = Venta
        fields = [
            "pk_venta",
            "pk_producto",
            "cantidad_producto",
            "fecha",
            "comprador_nombre",
            "comprador_correo",
            "total_venta",
            "fk_estado",
            "estado_nombre",
        ]

    def get_comprador_nombre(self, obj):
        if not obj.comprador:
            return None
        return obj.comprador.nombre or obj.comprador.usuario

    def get_comprador_correo(self, obj):
        if not obj.comprador:
            return None
        return obj.comprador.correo


class DetallePedidoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="fk_producto.nombre",  read_only=True)
    producto_precio = serializers.DecimalField(
        source="fk_producto.precio", max_digits=12, decimal_places=2, read_only=True
    )
    pk_producto     = serializers.IntegerField(source="fk_producto.pk_producto", read_only=True)
    imagen_url      = serializers.SerializerMethodField()
    estado_nombre   = serializers.CharField(source="fk_estado.nombre", read_only=True)

    class Meta:
        model  = DetallePedidos
        fields = [
            "pk_detalle_pedido",
            "pk_producto",
            "producto_nombre",
            "producto_precio",
            "imagen_url",
            "cantidad_producto",
            "total_pedido",
            "estado_nombre",
        ]

    def get_imagen_url(self, obj):
        request = self.context.get("request")
        if obj.fk_producto.ruta_imagen and request:
            return request.build_absolute_uri(f"/media/{obj.fk_producto.ruta_imagen}")
        return None


class PedidoSerializer(serializers.ModelSerializer):
    estado_nombre = serializers.CharField(source="fk_estado.nombre", read_only=True)

    class Meta:
        model  = Pedidos
        fields = [
            "pk_pedido",
            "cantidad_productos",
            "fecha_pedido",
            "total_pedido",
            "fk_estado",
            "estado_nombre",
        ]