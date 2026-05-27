from rest_framework import serializers
from .models import Productos


class ProductosListSerializer(serializers.ModelSerializer):

    imagen_url = serializers.SerializerMethodField()

    class Meta:
        model = Productos
        fields = [
            'pk_producto',
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