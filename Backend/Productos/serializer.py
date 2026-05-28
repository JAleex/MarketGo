from rest_framework import serializers
from .models import Productos


class ProductosListSerializer(serializers.ModelSerializer):
    estado = serializers.CharField(source="fk_estado.nombre", read_only=True)
    imagen_url = serializers.SerializerMethodField()

    class Meta:
        model = Productos
        fields = [
            'pk_producto',
            'fk_estado',
            'estado',
            'nombre',
            'precio',
            'stock',
            'detalles',
            'codigo_producto',
            'imagen_url'
        ]

    def get_imagen_url(self, obj):

        request = self.context.get('request')
        if obj.ruta_imagen:
            return request.build_absolute_uri(
                f"/media/{obj.ruta_imagen}"
            )

        return None
    

class ProductoDetallePublicoSerializer(serializers.ModelSerializer):
    """Detalle público de un producto (vista cliente)."""
    estado = serializers.CharField(source="fk_estado.nombre", read_only=True)
    imagen_url = serializers.SerializerMethodField()
 
    # Datos de contacto condicionados por los flags del vendedor
    nombre_vendedor = serializers.SerializerMethodField()
    telefono_vendedor = serializers.SerializerMethodField()
    correo_vendedor = serializers.SerializerMethodField()
 
    class Meta:
        model = Productos
        fields = [
            "pk_producto", "nombre", "precio", "fecha_publicacion",
            "detalles", "estado", "codigo_producto",
            "imagen_url", "stock",
            "nombre_vendedor", "telefono_vendedor", "correo_vendedor",
        ]
 
    def get_imagen_url(self, obj):

        request = self.context.get('request') 
        if obj.ruta_imagen:
            return request.build_absolute_uri(f"/media/{obj.ruta_imagen}")
        return None
 
    def get_nombre_vendedor(self, obj):
        if obj.muestra_nombre:
            u = obj.fk_usuario
            return f"{u.nombre or ''} {getattr(u, 'apellido', '') or ''}".strip()
        return None
 
    def get_telefono_vendedor(self, obj):
        return obj.fk_usuario.telefono if obj.muestra_telefono else None
 
    def get_correo_vendedor(self, obj):
        return obj.fk_usuario.correo if obj.muestra_correo else None
    

class MiProductoCreateSerializer(serializers.ModelSerializer):
   
    imagen = serializers.ImageField(write_only=True, required=False, allow_null=True)
 
    class Meta:
        model = Productos
        fields = [
            "codigo_producto",
            "nombre",
            "precio",
            "detalles",
            "fk_estado",
            "stock",
            "muestra_nombre",
            "muestra_telefono",
            "muestra_correo",
            "imagen",
        ]
 
    def validate_codigo_producto(self, value):
        qs = Productos.objects.filter(codigo_producto=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Ya existe un producto con ese código.")
        return value
 
    def validate_precio(self, value):
        if value <= 0:
            raise serializers.ValidationError("El precio debe ser mayor a cero.")
        return value
 
    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("El stock no puede ser negativo.")
        return value