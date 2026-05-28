from Usuarios.models import Estado
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Productos
from .serializer import *
from Utils.responses import api_response
from django.shortcuts import get_object_or_404


class ProductosListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        productos = Productos.objects.filter(fk_estado_id=1).order_by('-pk_producto')

        serializer = ProductosListSerializer(
            productos,
            many=True,
            context={'request': request}
        )

        return api_response(
            "Productos obtenidos exitosamente",
            data=serializer.data,
            http_status=status.HTTP_200_OK
        )
    
class ProductoDetallePublicoView(APIView):
    def get(self, request, pk):
        try:
            producto = Productos.objects.get(pk=pk, fk_estado__nombre="Activo")
        except Productos.DoesNotExist:
            return api_response("Producto no encontrado", http_status=status.HTTP_404_NOT_FOUND)
        serializer = ProductoDetallePublicoSerializer(producto, context={"request": request})
        return api_response( "Productos obtenidos exitosamente", data=serializer.data, http_status=status.HTTP_200_OK)
    
    

class MisProductosListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        productos = Productos.objects.filter(fk_usuario=request.user).order_by('-pk_producto')

        serializer = ProductosListSerializer(
            productos,
            many=True,
            context={'request': request}
        )

        return api_response(
            "Productos obtenidos exitosamente",
            data=serializer.data,
            http_status=status.HTTP_200_OK
        )
    
class ToggleEstadoProductoView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):

        producto = get_object_or_404(
            Productos,
            pk_producto=pk
        )

        estado_activo = Estado.objects.get(nombre="Activo")
        estado_inactivo = Estado.objects.get(nombre="Inactivo")

        # TOGGLE
        if producto.fk_estado == estado_activo:
            producto.fk_estado = estado_inactivo
            mensaje = "Producto desactivado exitosamente"
        else:
            producto.fk_estado = estado_activo
            mensaje = "Producto activado exitosamente"

        producto.save()

        return api_response(
            mensaje,
            data={
                "pk_producto": producto.pk_producto,
                "estado": producto.fk_estado.nombre
            },
            http_status=status.HTTP_200_OK
        )