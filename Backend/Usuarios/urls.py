from django.urls import path
from . import views
from .views import CustomTokenObtainPairView
from .views import *

urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', RefreshAccessTokenFromCookie.as_view(), name='token_refresh'),
    path("chequeo-autenticacion/", CheckAuthView.as_view(), name='chequeo-auth'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('perfil-usuario/', getPerfilUsuarioView.as_view(), name='perfi-usuario'),
    path('estados/', getEstadosView.as_view(), name='estados-lista'),
    path("mi-perfil/", MiPerfilView.as_view(), name="mi_perfil"),
    
    path("recuperar-contrasena/", RecuperarContrasenaAPIView.as_view(), name="recuperar_contrasena"),
    path("restablecer-contrasena/<uidb64>/<token>/", ResetearPasswordAPIView.as_view(), name="restablecer_password"),

    path('vistas/', VistaListCreateView.as_view(), name='vistas-list-create'),
    path('vistas/<int:pk>/', VistaDetailView.as_view(), name='vistas-detail'),
    path('permisos-rol/', PermisoRolListView.as_view(), name='permisos-rol-list'),

    path('permisos-rol/actualizar/', PermisoRolUpdateView.as_view(), name='permisos-rol-update'),
    path('permisos-rol/bulk/', PermisoRolBulkUpdateView.as_view(), name='permisos-rol-bulk'),
    path('roles-permisos/', RolesConPermisosView.as_view(), name='roles-permisos'),
    path('crear-usuario/', RegistroNuevoUsuario.as_view(), name='crear-usuario'),


     # ==================== CRUD DE EVALUADORES ====================

    path('usuarios/', UsuariosListView.as_view(), name='usuarios-listar'),
    path('usuarios/crear/', UsuariosCreateView.as_view(), name='usuarios-crear'),
    path('usuarios/<int:pk>/', UsuariosDetailView.as_view(), name='usuarios-detalle'),
    path('usuarios/<int:pk>/actualizar/', UsuariosUpdateView.as_view(), name='usuarios-actualizar'),
    path('usuarios/<int:pk>/desactivar/', UsuariosDesactivateView.as_view(), name='usuarios-desactivar'),
    path('usuarios/<int:pk>/activar/', UsuariosActivateView.as_view(), name='usuarios-activar'),

]