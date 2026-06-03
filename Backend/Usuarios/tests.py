"""
Pruebas unitarias del módulo Usuarios.
Cubre: autenticación, perfil, registro, gestión de usuarios, vistas y permisos.
"""
from unittest.mock import patch, MagicMock
from django.test import TestCase
from rest_framework.test import APITestCase
from Usuarios.models import Estado, Rol, Usuarios, Vista, PermisoRol, Login_log
from Utils.responses import api_response


# ── Helpers ───────────────────────────────────────────────────────────────────

def _estados_y_roles():
    """Crea Estado y Rol en el orden correcto para que los PKs coincidan con el código."""
    e_activo   = Estado.objects.create(nombre="Activo")    # pk=1
    e_inactivo = Estado.objects.create(nombre="Inactivo")  # pk=2
    r_admin    = Rol.objects.create(nombre_rol="Administrador", fk_estado=e_activo)  # pk=1
    r_cliente  = Rol.objects.create(nombre_rol="Cliente",       fk_estado=e_activo)  # pk=2
    return e_activo, e_inactivo, r_admin, r_cliente


def _crear_usuario(usuario, correo, rol, estado, password="Pass1234"):
    u = Usuarios.objects.create(usuario=usuario, correo=correo, fk_rol=rol, fk_estado=estado)
    u.set_password(password)
    u.save()
    return u


# ── Utils ─────────────────────────────────────────────────────────────────────

class TestApiResponse(TestCase):
    """Pruebas unitarias para la función helper api_response."""

    def test_respuesta_exitosa_sin_data(self):
        res = api_response("OK")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["status"], "success")
        self.assertEqual(res.data["message"], "OK")
        self.assertNotIn("data", res.data)

    def test_respuesta_error_con_data(self):
        res = api_response("Fallo", "error", 400, {"campo": "invalido"})
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.data["status"], "error")
        self.assertEqual(res.data["data"]["campo"], "invalido")

    def test_respuesta_con_data(self):
        res = api_response("Datos", data={"key": "value"})
        self.assertIn("data", res.data)
        self.assertEqual(res.data["data"]["key"], "value")

    def test_http_status_personalizado(self):
        res = api_response("Creado", http_status=201)
        self.assertEqual(res.status_code, 201)


# ── Login / Autenticación ─────────────────────────────────────────────────────

class TestLogin(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.e_activo, cls.e_inactivo, cls.r_admin, cls.r_cliente = _estados_y_roles()
        cls.usuario = _crear_usuario("loginuser", "login@mail.com", cls.r_cliente, cls.e_activo)

    def test_login_exitoso(self):
        res = self.client.post("/usuarios/token/", {
            "correo": "login@mail.com", "password": "Pass1234",
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["status"], "success")

    def test_login_crea_log(self):
        antes = Login_log.objects.count()
        self.client.post("/usuarios/token/", {"correo": "login@mail.com", "password": "Pass1234"})
        self.assertGreater(Login_log.objects.count(), antes)

    def test_login_contrasena_incorrecta(self):
        res = self.client.post("/usuarios/token/", {
            "correo": "login@mail.com", "password": "wrong",
        })
        self.assertEqual(res.status_code, 400)

    def test_login_usuario_no_existe(self):
        res = self.client.post("/usuarios/token/", {
            "correo": "noexiste@mail.com", "password": "Pass1234",
        })
        self.assertEqual(res.status_code, 400)

    def test_login_usuario_inactivo(self):
        inactivo = _crear_usuario("inact", "inact@mail.com", self.r_cliente, self.e_inactivo)
        res = self.client.post("/usuarios/token/", {
            "correo": "inact@mail.com", "password": "Pass1234",
        })
        self.assertEqual(res.status_code, 400)

    def test_chequeo_auth_autenticado(self):
        self.client.force_authenticate(user=self.usuario)
        res = self.client.get("/usuarios/chequeo-autenticacion/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("fk_rol", res.data["data"])

    def test_chequeo_auth_sin_sesion(self):
        res = self.client.get("/usuarios/chequeo-autenticacion/")
        self.assertEqual(res.status_code, 401)

    def test_logout_exitoso(self):
        self.client.force_authenticate(user=self.usuario)
        res = self.client.post("/usuarios/logout/")
        self.assertEqual(res.status_code, 200)

    def test_logout_sin_autenticar(self):
        res = self.client.post("/usuarios/logout/")
        self.assertEqual(res.status_code, 401)

    def test_refresh_sin_cookie(self):
        res = self.client.post("/usuarios/token/refresh/")
        self.assertEqual(res.status_code, 401)


# ── Perfil propio ─────────────────────────────────────────────────────────────

class TestMiPerfil(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.e_activo, _, cls.r_admin, cls.r_cliente = _estados_y_roles()

    def setUp(self):
        self.usuario = _crear_usuario("perfiluser", "perfil@mail.com", self.r_cliente, self.e_activo)
        self.usuario.nombre = "Juan"
        self.usuario.telefono = "3001234567"
        self.usuario.numero_identificacion = "123456789"
        self.usuario.save()
        self.client.force_authenticate(user=self.usuario)

    def test_get_perfil(self):
        res = self.client.get("/usuarios/mi-perfil/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["data"]["correo"], "perfil@mail.com")

    def test_patch_nombre(self):
        res = self.client.patch("/usuarios/mi-perfil/", {"nombre": "Pedro"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["data"]["nombre"], "Pedro")

    def test_patch_telefono(self):
        res = self.client.patch("/usuarios/mi-perfil/", {"telefono": "3009999999"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["data"]["telefono"], "3009999999")

    def test_patch_correo_duplicado(self):
        _crear_usuario("otro", "otro@mail.com", self.r_cliente, self.e_activo)
        res = self.client.patch("/usuarios/mi-perfil/", {"correo": "otro@mail.com"})
        self.assertEqual(res.status_code, 400)

    def test_patch_usuario_duplicado(self):
        _crear_usuario("dup", "dup@mail.com", self.r_cliente, self.e_activo)
        res = self.client.patch("/usuarios/mi-perfil/", {"usuario": "dup"})
        self.assertEqual(res.status_code, 400)

    def test_patch_numero_identificacion_duplicado(self):
        otro = _crear_usuario("otro2", "otro2@mail.com", self.r_cliente, self.e_activo)
        otro.numero_identificacion = "999999999"
        otro.save()
        res = self.client.patch("/usuarios/mi-perfil/", {"numero_identificacion": "999999999"})
        self.assertEqual(res.status_code, 400)

    def test_patch_contrasena(self):
        res = self.client.patch("/usuarios/mi-perfil/", {"contrasena": "NuevaPass123"})
        self.assertEqual(res.status_code, 200)
        self.usuario.refresh_from_db()
        self.assertTrue(self.usuario.check_contrasena("NuevaPass123"))

    def test_patch_contrasena_vacia_no_cambia(self):
        res = self.client.patch("/usuarios/mi-perfil/", {"contrasena": ""})
        self.assertEqual(res.status_code, 200)
        self.usuario.refresh_from_db()
        self.assertTrue(self.usuario.check_contrasena("Pass1234"))

    def test_patch_sin_autenticar(self):
        self.client.force_authenticate(user=None)
        res = self.client.patch("/usuarios/mi-perfil/", {"nombre": "X"})
        self.assertEqual(res.status_code, 401)

    def test_get_perfil_usuario_view(self):
        res = self.client.get("/usuarios/perfil-usuario/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("pk_usuario", res.data)


# ── Registro de nuevo usuario ─────────────────────────────────────────────────

class TestRegistro(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.e_activo, _, cls.r_admin, cls.r_cliente = _estados_y_roles()

    def test_registro_exitoso(self):
        res = self.client.post("/usuarios/crear-usuario/", {
            "usuario": "nuevo", "correo": "nuevo@mail.com",
            "password": "Pass1234", "nombre": "Nuevo",
        })
        self.assertEqual(res.status_code, 201)
        self.assertTrue(Usuarios.objects.filter(correo="nuevo@mail.com").exists())

    def test_registro_usuario_duplicado(self):
        _crear_usuario("existe", "existe@mail.com", self.r_cliente, self.e_activo)
        res = self.client.post("/usuarios/crear-usuario/", {
            "usuario": "existe", "correo": "otro@mail.com",
            "password": "Pass1234", "nombre": "Test",
        })
        self.assertEqual(res.status_code, 400)

    def test_registro_correo_duplicado(self):
        _crear_usuario("uniqa", "dupcorreo@mail.com", self.r_cliente, self.e_activo)
        res = self.client.post("/usuarios/crear-usuario/", {
            "usuario": "uniqb", "correo": "dupcorreo@mail.com",
            "password": "Pass1234", "nombre": "Test",
        })
        self.assertEqual(res.status_code, 400)

    def test_registro_campo_obligatorio_faltante(self):
        res = self.client.post("/usuarios/crear-usuario/", {
            "usuario": "incompleto", "password": "Pass1234",
        })
        self.assertEqual(res.status_code, 400)


# ── Estados ───────────────────────────────────────────────────────────────────

class TestEstados(APITestCase):
    @classmethod
    def setUpTestData(cls):
        Estado.objects.create(nombre="Activo")
        Estado.objects.create(nombre="Inactivo")

    def test_get_estados(self):
        res = self.client.get("/usuarios/estados/")
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.data), 2)


# ── CRUD Admin de Usuarios ────────────────────────────────────────────────────

class TestUsuariosAdmin(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.e_activo, cls.e_inactivo, cls.r_admin, cls.r_cliente = _estados_y_roles()
        cls.admin = _crear_usuario("admin", "admin@mail.com", cls.r_admin, cls.e_activo, "Admin1234")

    def setUp(self):
        self.client.force_authenticate(user=self.admin)

    def test_listar_usuarios(self):
        res = self.client.get("/usuarios/usuarios/")
        self.assertEqual(res.status_code, 200)

    def test_crear_usuario(self):
        res = self.client.post("/usuarios/usuarios/crear/", {
            "usuario": "nuevo_adm", "correo": "nuevo_adm@mail.com",
            "contrasena": "Pass1234",
            "fk_rol": self.r_cliente.pk_rol,
            "fk_estado": self.e_activo.pk_estado,
        })
        self.assertEqual(res.status_code, 201)

    def test_crear_usuario_correo_duplicado(self):
        _crear_usuario("dup_adm", "dup_adm@mail.com", self.r_cliente, self.e_activo)
        res = self.client.post("/usuarios/usuarios/crear/", {
            "usuario": "dup_adm2", "correo": "dup_adm@mail.com",
            "contrasena": "Pass1234",
            "fk_rol": self.r_cliente.pk_rol,
            "fk_estado": self.e_activo.pk_estado,
        })
        self.assertEqual(res.status_code, 400)

    def test_detalle_usuario(self):
        res = self.client.get(f"/usuarios/usuarios/{self.admin.pk_usuario}/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["data"]["usuario"], "admin")

    def test_actualizar_usuario(self):
        u = _crear_usuario("upd_u", "upd_u@mail.com", self.r_cliente, self.e_activo)
        res = self.client.patch(f"/usuarios/usuarios/{u.pk_usuario}/actualizar/", {
            "nombre": "Actualizado",
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["data"]["nombre"], "Actualizado")

    def test_desactivar_usuario(self):
        u = _crear_usuario("desact_u", "desact_u@mail.com", self.r_cliente, self.e_activo)
        res = self.client.patch(f"/usuarios/usuarios/{u.pk_usuario}/desactivar/")
        self.assertEqual(res.status_code, 200)
        u.refresh_from_db()
        self.assertEqual(u.fk_estado.pk_estado, 2)  # pk=2 = Inactivo

    def test_activar_usuario(self):
        u = _crear_usuario("act_u", "act_u@mail.com", self.r_cliente, self.e_inactivo)
        res = self.client.patch(f"/usuarios/usuarios/{u.pk_usuario}/activar/")
        self.assertEqual(res.status_code, 200)
        u.refresh_from_db()
        self.assertEqual(u.fk_estado.pk_estado, 1)  # pk=1 = Activo

    def test_sin_autenticar_retorna_401(self):
        self.client.force_authenticate(user=None)
        res = self.client.get("/usuarios/usuarios/")
        self.assertEqual(res.status_code, 401)


# ── Vistas y Permisos ─────────────────────────────────────────────────────────

class TestVistasPermisos(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.e_activo, _, cls.r_admin, cls.r_cliente = _estados_y_roles()
        cls.admin = _crear_usuario("admin_vp", "adminvp@mail.com", cls.r_admin, cls.e_activo)
        cls.vista = Vista.objects.create(
            nombre="Inicio", ruta="/inicio", fk_estado=cls.e_activo,
        )

    def setUp(self):
        self.client.force_authenticate(user=self.admin)

    def test_listar_vistas(self):
        res = self.client.get("/usuarios/vistas/")
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.data["data"]), 1)

    def test_crear_vista(self):
        res = self.client.post("/usuarios/vistas/", {
            "nombre": "Nueva Vista", "ruta": "/nueva",
            "fk_estado": self.e_activo.pk_estado,
        })
        self.assertEqual(res.status_code, 201)

    def test_crear_vista_nombre_duplicado(self):
        res = self.client.post("/usuarios/vistas/", {
            "nombre": "Inicio", "ruta": "/inicio-dup",
            "fk_estado": self.e_activo.pk_estado,
        })
        self.assertEqual(res.status_code, 400)

    def test_crear_vista_ruta_duplicada(self):
        res = self.client.post("/usuarios/vistas/", {
            "nombre": "Otra Vista", "ruta": "/inicio",
            "fk_estado": self.e_activo.pk_estado,
        })
        self.assertEqual(res.status_code, 400)

    def test_actualizar_vista(self):
        res = self.client.patch(f"/usuarios/vistas/{self.vista.pk_vista}/", {
            "visible_en_navbar": False,
        })
        self.assertEqual(res.status_code, 200)

    def test_listar_permisos_por_rol(self):
        PermisoRol.objects.create(
            fk_rol=self.r_admin, fk_vista=self.vista, tiene_acceso=True,
        )
        res = self.client.get(f"/usuarios/permisos-rol/?fk_rol={self.r_admin.pk_rol}")
        self.assertEqual(res.status_code, 200)

    def test_listar_permisos_sin_filtro(self):
        res = self.client.get("/usuarios/permisos-rol/")
        self.assertEqual(res.status_code, 200)

    def test_actualizar_permiso(self):
        res = self.client.post("/usuarios/permisos-rol/actualizar/", {
            "fk_rol": self.r_cliente.pk_rol,
            "fk_vista": self.vista.pk_vista,
            "tiene_acceso": True,
        })
        self.assertEqual(res.status_code, 200)

    def test_actualizar_permiso_sin_rol(self):
        res = self.client.post("/usuarios/permisos-rol/actualizar/", {
            "fk_vista": self.vista.pk_vista, "tiene_acceso": True,
        })
        self.assertEqual(res.status_code, 400)

    def test_bulk_update_permisos(self):
        res = self.client.post("/usuarios/permisos-rol/bulk/", {
            "fk_rol": self.r_cliente.pk_rol,
            "permisos": [{"fk_vista": self.vista.pk_vista, "tiene_acceso": True}],
        }, format="json")
        self.assertEqual(res.status_code, 200)

    def test_bulk_update_sin_rol(self):
        res = self.client.post("/usuarios/permisos-rol/bulk/", {
            "permisos": [{"fk_vista": self.vista.pk_vista, "tiene_acceso": True}],
        }, format="json")
        self.assertEqual(res.status_code, 400)

    def test_roles_con_permisos(self):
        res = self.client.get("/usuarios/roles-permisos/")
        self.assertEqual(res.status_code, 200)


