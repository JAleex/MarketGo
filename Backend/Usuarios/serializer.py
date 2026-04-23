from rest_framework import serializers
from .models import *
from .views import *
from rest_framework_simplejwt.tokens import *
from django.contrib.auth.hashers import check_password
from django.db.models import Q
from django.utils.timezone import now, localtime
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import timedelta

class CustomTokenObtainPairSerializer(serializers.Serializer):
    usuario = serializers.CharField()
    contrasena = serializers.CharField(write_only=True)

    def validate(self, attrs):
        usuario_input = attrs["usuario"]
        contrasena = attrs["contrasena"]

        try:
            user = Usuarios.objects.get(
                Q(usuario=usuario_input) | Q(correo=usuario_input)
            )
        except Usuarios.DoesNotExist:
            raise serializers.ValidationError("Este usuario no se encuentra actualmente registrado en el sistema")

        if not user.check_contrasena(contrasena):
            raise serializers.ValidationError("Usuario o contraseña incorrectos")

        if user.fk_estado.pk != 1:
            raise serializers.ValidationError("Usuario inactivo")

        Login_log.objects.create(fk_usuario=user, login="1")

        refresh = RefreshToken.for_user(user)

        return {
            "user": {
                "pk_usuario": user.pk_usuario,
                "nombre": user.nombre,
                "correo": user.correo,
                "fk_rol": user.fk_rol.pk_rol,
                "fk_estado": user.fk_estado.pk,
            },
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }
    
class EstadosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estado
        fields = '__all__'


class MiPerfilSerializer(serializers.ModelSerializer):
    rol = serializers.CharField(source="fk_rol.nombre_rol", read_only=True)
    estado = serializers.CharField(source="fk_estado.nombre", read_only=True)
    
    class Meta:
        model = Usuarios
        fields = [
            "pk_usuario",
            "usuario",
            "numero_identificacion",
            "correo",
            "nombre",
            "telefono",
            "rol",
            "estado",
        ]

class VistaSerializer(serializers.ModelSerializer):
    estado = serializers.CharField(source='fk_estado.nombre', read_only=True)

    class Meta:
        model = Vista
        fields = [
            'pk_vista',
            'nombre',
            'ruta',
            'fk_estado',
            'estado',
            'visible_en_navbar',
        ]

    def validate_nombre(self, value):
        nombre = value.strip()
        query = Vista.objects.filter(nombre__iexact=nombre)

        if self.instance:
            query = query.exclude(pk_vista=self.instance.pk_vista)

        if query.exists():
            raise serializers.ValidationError("Ya existe una vista con este nombre")

        return nombre

    def validate_ruta(self, value):
        ruta = value.strip()
        query = Vista.objects.filter(ruta__iexact=ruta)

        if self.instance:
            query = query.exclude(pk_vista=self.instance.pk_vista)

        if query.exists():
            raise serializers.ValidationError("Esta ruta ya está siendo utilizada por otra vista")

        return ruta

class PermisoRolSerializer(serializers.ModelSerializer):
    nombre_rol = serializers.CharField(source='fk_rol.nombre_rol', read_only=True)
    nombre_vista = serializers.CharField(source='fk_vista.nombre', read_only=True)
    ruta_vista = serializers.CharField(source='fk_vista.ruta', read_only=True)

    class Meta:
        model = PermisoRol
        fields = [
            'pk_permiso_rol',
            'fk_rol',
            'nombre_rol',
            'fk_vista',
            'nombre_vista',
            'ruta_vista',
            'tiene_acceso'
        ]


class RolConPermisosSerializer(serializers.ModelSerializer):
    vistas = serializers.SerializerMethodField()

    class Meta:
        model = Rol
        fields = ['pk_rol', 'nombre_rol', 'vistas']

    def get_vistas(self, obj):
        permisos = obj.permisorol_set.filter(tiene_acceso=True)

        return [
            {
                "pk_permiso_rol": p.pk_permiso_rol,
                "fk_vista": p.fk_vista.pk_vista,
                "nombre_vista": p.fk_vista.nombre,
                "ruta_vista": p.fk_vista.ruta,
                "tiene_acceso": p.tiene_acceso,
            }
            for p in permisos
        ]