from Utils.responses import api_response
from config import settings
from rest_framework.permissions import IsAuthenticated,AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import *
from rest_framework.generics import ListAPIView
from .serializer import *
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from datetime import datetime, timezone, timedelta
import time
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from django.http import JsonResponse
from decouple import config
from django.db.models import Q
import os
import jwt
from rest_framework_simplejwt.exceptions import TokenError,InvalidToken
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from Utils.email_sender import GraphEmailSender

# Configurar la cookie
COOKIE_SETTINGS = {
    'httponly': config('CS_HTTPONLY', cast=bool),
    'secure': config('CS_SECURE', cast=bool), 
    'samesite': config('CS_SAMESITE'),
    'path': config('CS_PATH'),
}


def set_auth_cookie(response, key, value, max_age=None, expires=None):
    response.set_cookie(
        key=key,
        value=value,
        max_age=max_age,
        expires=expires,
        **COOKIE_SETTINGS
    )

#VISTAS INICIO DE SESION    
class CustomTokenObtainPairView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CustomTokenObtainPairSerializer(data={
            "usuario": request.data.get("correo"),
            "contrasena": request.data.get("password"),
        })

        if not serializer.is_valid():
            error_message = serializer.errors.get("non_field_errors", serializer.errors)
            return api_response(
                error_message[0] if isinstance(error_message, list) else error_message,
                "error",
                status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data
        response = api_response("Login exitoso", data=data["user"])

        response.set_cookie(
            "access_token",
            data["access"],
            max_age=settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds(),
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax",
        )

        response.set_cookie(
            "refresh_token",
            data["refresh"],
            max_age=settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds(),
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax",
        )

        return response

class RefreshAccessTokenFromCookie(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")

        if not refresh_token:
            return api_response("Refresh token no encontrado", "error", 401)

        try:
            refresh = RefreshToken(refresh_token)

            response = api_response("Token refrescado")

            response.set_cookie(
                "access_token",
                str(refresh.access_token),
                max_age=settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds(),
                httponly=True,
                secure=not settings.DEBUG,
                samesite="Lax",
            )

            response.set_cookie(
                "refresh_token",
                str(refresh),
                max_age=settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds(),
                httponly=True,
                secure=not settings.DEBUG,
                samesite="Lax",
            )

            return response

        except TokenError:
            return api_response("Refresh token inválido", "error", 401)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh = request.COOKIES.get("refresh_token")
        if refresh:
            try:
                RefreshToken(refresh).blacklist()
            except TokenError:
                pass

        Login_log.objects.create(fk_usuario=request.user, login="0")

        response = api_response("Logout exitoso")
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        return response
        
class CheckAuthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return api_response(
            "Usuario autenticado",
            data={
                "fk_rol": user.fk_rol.pk_rol,
                "fk_estado": user.fk_estado.pk
            }
        )

#INFORMACIÓN DE USUARIO

class getPerfilUsuarioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response({"detail": "Usuario no autenticado"}, status=status.HTTP_401_UNAUTHORIZED)
        user = request.user

        user_data = {
            'pk_usuario': user.pk_usuario,
            'usuario': user.usuario,
            'correo': user.correo,
            'nombre': user.nombre,
            'numero_identificacion': user.numero_identificacion,
            'telefono':user.telefono,
            'fk_rol' : user.fk_rol.pk_rol if user.fk_rol else None,
            'fk_estado' : user.fk_estado.pk_estado if user.fk_estado else None,
        }

        return Response(user_data, status=status.HTTP_200_OK)



class getEstadosView(ListAPIView):
    permission_classes = [AllowAny]
    queryset = Estado.objects.all()
    serializer_class = EstadosSerializer


class MiPerfilView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            usuario = request.user
            serializer = MiPerfilSerializer(usuario)
            return api_response(
                message="Información del perfil obtenida exitosamente",
                status_type="success",
                http_status=status.HTTP_200_OK,
                data=serializer.data
            )
        except Exception as e:
            return api_response(
                message=f"Error al obtener información del usuario: {str(e)}",
                status_type="error",
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def patch(self, request):
        try:
            from .serializer import ActualizarMiPerfilSerializer
            serializer = ActualizarMiPerfilSerializer(request.user, data=request.data, partial=True)
            if not serializer.is_valid():
                errores = {k: (v[0] if isinstance(v, list) else v) for k, v in serializer.errors.items()}
                return api_response(
                    "Error en la validación",
                    status_type="error",
                    http_status=status.HTTP_400_BAD_REQUEST,
                    data=errores
                )
            usuario_actualizado = serializer.save()
            return api_response(
                "Perfil actualizado exitosamente",
                http_status=status.HTTP_200_OK,
                data=MiPerfilSerializer(usuario_actualizado).data
            )
        except Exception as e:
            return api_response(
                message=f"Error al actualizar el perfil: {str(e)}",
                status_type="error",
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# =========================
# GESTIÓN DE VISTAS
# =========================
class VistaListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        vistas = Vista.objects.all().order_by('-visible_en_navbar', 'nombre')
        serializer = VistaSerializer(vistas, many=True)
        return api_response("Vistas obtenidas", data=serializer.data, http_status=status.HTTP_200_OK)

    def post(self, request):
        serializer = VistaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return api_response(
                "Vista creada exitosamente",
                data=serializer.data,
                http_status=status.HTTP_201_CREATED
            )
        errores = {}
        for campo, mensajes in serializer.errors.items():
            if isinstance(mensajes, list):
                errores[campo] = mensajes[0]
            else:
                errores[campo] = str(mensajes)
        
        return api_response(
            "Error al crear vista",
            "error",
            status.HTTP_400_BAD_REQUEST,
            data=errores
        )



class VistaDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        vista = get_object_or_404(Vista, pk_vista=pk)
        serializer = VistaSerializer(vista, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return api_response("Vista actualizada", data=serializer.data, http_status=status.HTTP_200_OK)
        errores = {}
        for campo, mensajes in serializer.errors.items():
            if isinstance(mensajes, list):
                errores[campo] = mensajes[0]
            else:
                errores[campo] = str(mensajes)
        
        return api_response(
            "Error al actualizar",
            "error",
            status.HTTP_400_BAD_REQUEST,
            data=errores
        )


# =========================
# GESTIÓN DE PERMISOS POR ROL
# =========================
class PermisoRolListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        fk_rol = request.query_params.get('fk_rol')
        permisos = PermisoRol.objects.filter(fk_rol_id=fk_rol) if fk_rol else PermisoRol.objects.all()
        serializer = PermisoRolSerializer(permisos, many=True)
        return api_response("Permisos obtenidos", data=serializer.data, http_status=status.HTTP_200_OK)


class PermisoRolUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        fk_rol = request.data.get('fk_rol')
        fk_vista = request.data.get('fk_vista')
        tiene_acceso = request.data.get('tiene_acceso', True)

        if not fk_rol or not fk_vista:
            return api_response(
                "Debe enviar fk_rol y fk_vista",
                "error",
                status.HTTP_400_BAD_REQUEST
            )

        # PROTECCIÓN: El rol Administrador (pk=1) siempre debe tener acceso a la vista de Políticas (pk=1)
        if int(fk_rol) == 1 and int(fk_vista) == 1 and not tiene_acceso:
            return api_response(
                "No se puede denegar el acceso del rol Administrador a la vista de Políticas de Acceso",
                "error",
                status.HTTP_403_FORBIDDEN
            )

        permiso, created = PermisoRol.objects.update_or_create(
            fk_rol_id=fk_rol,
            fk_vista_id=fk_vista,
            defaults={'tiene_acceso': bool(tiene_acceso)}
        )

        serializer = PermisoRolSerializer(permiso)
        mensaje = "Permiso creado" if created else "Permiso actualizado"
        return api_response(mensaje, data=serializer.data, http_status=status.HTTP_200_OK)


class PermisoRolBulkUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        fk_rol = request.data.get('fk_rol')
        permisos_data = request.data.get('permisos', [])

        if not fk_rol:
            return api_response("Debe enviar fk_rol", "error", status.HTTP_400_BAD_REQUEST)

        if not isinstance(permisos_data, list):
            return api_response("El campo permisos debe ser una lista", "error", status.HTTP_400_BAD_REQUEST)

        for permiso_data in permisos_data:
            if 'fk_vista' not in permiso_data or 'tiene_acceso' not in permiso_data:
                return api_response(
                    "Cada permiso debe incluir fk_vista y tiene_acceso",
                    "error",
                    status.HTTP_400_BAD_REQUEST
                )

            # PROTECCIÓN: El rol Administrador (pk=1) siempre debe tener acceso a la vista de Políticas (pk=1)
            if int(fk_rol) == 1 and int(permiso_data['fk_vista']) == 1 and not permiso_data['tiene_acceso']:
                return api_response(
                    "No se puede denegar el acceso del rol Administrador a la vista de Políticas de Acceso",
                    "error",
                    status.HTTP_403_FORBIDDEN
                )

            PermisoRol.objects.update_or_create(
                fk_rol_id=fk_rol,
                fk_vista_id=permiso_data['fk_vista'],
                defaults={'tiene_acceso': bool(permiso_data['tiene_acceso'])}
            )

        return api_response("Permisos actualizados masivamente", http_status=status.HTTP_200_OK)



# =========================
# ROLES Y USUARIOS
# =========================
class RolesConPermisosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        roles = Rol.objects.all()
        serializer = RolConPermisosSerializer(roles, many=True)
        return Response(serializer.data)

# =========================
# RECUPERACIÓN DE CONTRASEÑA
# =========================

class CustomTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        return f"{user.pk_usuario}{user.contrasena}{timestamp}"

    def make_token(self, user):
        timestamp = int(time.time())  
        base_token = super().make_token(user) 
        return f"{base_token}-{timestamp}" 

    def is_token_valid(self, user, token, expiration_seconds=43200):  
        try:
            parts = token.rsplit('-', 1)  
            if len(parts) != 2:
                return False
            base_token, timestamp_str = parts
            timestamp = int(timestamp_str) 
            current_time = int(time.time()) 
            if current_time - timestamp > expiration_seconds:
                return False

            return super().check_token(user, base_token)  

        except ValueError:
            return False
        
custom_token_generator = CustomTokenGenerator()


class RegistroNuevoUsuario(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        
        # Validar campos obligatorios
        required_fields = ['usuario', 'correo', 'password', 'nombre']
        for field in required_fields:
            if not data.get(field):
                return api_response(f"El campo {field} es obligatorio", "error", status.HTTP_400_BAD_REQUEST)

        # Verificar si el usuario o correo ya existen
        if Usuarios.objects.filter(Q(usuario=data['usuario']) | Q(correo=data['correo'])).exists():
            return api_response("El usuario o correo ya se encuentra registrado", "error", status.HTTP_400_BAD_REQUEST)

        try:
            # Obtener rol por defecto (ej: Cliente/Usuario con pk=2) y estado activo (pk=1)
            rol_defecto = Rol.objects.get(pk_rol=2)
            estado_activo = Estado.objects.get(pk_estado=1)

            nuevo_usuario = Usuarios.objects.create(
                usuario=data['usuario'],
                correo=data['correo'],
                nombre=data['nombre'],
                fk_rol=rol_defecto,
                fk_estado=estado_activo
            )
            nuevo_usuario.set_password(data['password'])
            nuevo_usuario.save()

            return api_response(
                "Usuario registrado exitosamente",
                data={"pk_usuario": nuevo_usuario.pk_usuario, "usuario": nuevo_usuario.usuario},
                http_status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return api_response(f"Error al registrar usuario: {str(e)}", "error", status.HTTP_500_INTERNAL_SERVER_ERROR)

# ==================== CRUD DE EVALUADORES ====================

class UsuariosListView(APIView):
    """Vista para listar todos los evaluadores"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        evaluadores = Usuarios.objects.select_related(
            'fk_rol',
            'fk_estado'
        ).filter(fk_rol_id=2) 
        
        serializer = UsuariosListSerializer(evaluadores, many=True)

        return api_response(
            "Usuarios obtenidos exitosamente",
            data=serializer.data,
            http_status=status.HTTP_200_OK
        )


class UsuariosCreateView(APIView):
    """Vista para crear un nuevo evaluador"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = UsuariosCreateSerializer(data=request.data)

        if not serializer.is_valid():
            return api_response(
                "Error en la validación de datos",
                status_type="error",
                http_status=status.HTTP_400_BAD_REQUEST,
                data=serializer.errors
            )

        evaluador = serializer.save()
        response_data = UsuariosListSerializer(evaluador).data

        return api_response(
            "Usuarios creado exitosamente",
            data=response_data,
            http_status=status.HTTP_201_CREATED
        )


class UsuariosUpdateView(APIView):
    """Vista para actualizar un evaluador existente"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        evaluador = get_object_or_404(Usuarios, pk_usuario=pk)

        serializer = UsuariosUpdateSerializer(
            evaluador,
            data=request.data,
            partial=True
        )

        if not serializer.is_valid():
            return api_response(
                "Error en la validación de datos",
                status_type="error",
                http_status=status.HTTP_400_BAD_REQUEST,
                data=serializer.errors
            )

        evaluador_actualizado = serializer.save()
        response_data = UsuariosListSerializer(evaluador_actualizado).data

        return api_response(
            "Usuarios actualizado exitosamente",
            data=response_data,
            http_status=status.HTTP_200_OK
        )


class UsuariosDesactivateView(APIView):
    """Vista para desactivar un evaluador"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        evaluador = get_object_or_404(Usuarios, pk_usuario=pk)
        estado_inactivo = get_object_or_404(Estado, pk_estado=2)

        evaluador.fk_estado = estado_inactivo
        evaluador.save()

        response_data = UsuariosListSerializer(evaluador).data

        return api_response(
            "Usuarios desactivado exitosamente",
            data=response_data,
            http_status=status.HTTP_200_OK
        )


class UsuariosActivateView(APIView):
    """Vista para activar un evaluador"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        evaluador = get_object_or_404(Usuarios, pk_usuario=pk)
        estado_activo = get_object_or_404(Estado, pk_estado=1)

        evaluador.fk_estado = estado_activo
        evaluador.save()

        response_data = UsuariosListSerializer(evaluador).data

        return api_response(
            "Usuarios activado exitosamente",
            data=response_data,
            http_status=status.HTTP_200_OK
        )


class UsuariosDetailView(APIView):
    """Vista para obtener el detalle de un evaluador específico"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        evaluador = get_object_or_404(Usuarios, pk_usuario=pk)
        serializer = UsuariosListSerializer(evaluador)

        return api_response(
            "Usuarios obtenido exitosamente",
            data=serializer.data,
            http_status=status.HTTP_200_OK
        )