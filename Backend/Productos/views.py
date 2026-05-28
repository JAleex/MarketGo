import os
import uuid
 
from django.conf import settings
from django.shortcuts import get_object_or_404
from Usuarios.models import Estado
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Productos
from .serializer import *
from Utils.responses import api_response


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
    
 
def _guardar_imagen(imagen_file) -> str:

    carpeta = os.path.join(settings.MEDIA_ROOT, "productos")
    os.makedirs(carpeta, exist_ok=True)
 
    ext            = os.path.splitext(imagen_file.name)[1].lower()
    nombre_archivo = f"productos/{uuid.uuid4().hex}{ext}"
    ruta_completa  = os.path.join(settings.MEDIA_ROOT, nombre_archivo)
 
    with open(ruta_completa, "wb+") as dest:
        for chunk in imagen_file.chunks():
            dest.write(chunk)
 
    return nombre_archivo
 
 
def _eliminar_imagen(ruta_imagen: str) -> None:
    if not ruta_imagen:
        return
    ruta_completa = os.path.join(settings.MEDIA_ROOT, ruta_imagen)
    if os.path.exists(ruta_completa):
        os.remove(ruta_completa)
 
 
class MisProductosListCreateView(APIView):
    permission_classes = [IsAuthenticated]
 
    def post(self, request):
 
        serializer = MiProductoCreateSerializer(data=request.data)
 
        if not serializer.is_valid():
            return api_response(
                "Datos inválidos",
                data=serializer.errors,
                http_status=status.HTTP_400_BAD_REQUEST
            )
 
        imagen_file = serializer.validated_data.pop("imagen", None)
        ruta_imagen = _guardar_imagen(imagen_file) if imagen_file else None
 
        producto = Productos.objects.create(
            **serializer.validated_data,
            fk_usuario=request.user,
            ruta_imagen=ruta_imagen,
        )
 
        return api_response(
            "Producto creado exitosamente",
            data=ProductosListSerializer(producto, context={"request": request}).data,
            http_status=status.HTTP_201_CREATED
        )