from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Productos
from .serializer import ProductosListSerializer
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