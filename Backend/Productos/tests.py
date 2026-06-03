"""
Pruebas unitarias del módulo Productos.
Cubre: catálogo público, mis productos, CRUD, serializers y toggle de estado.
"""
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APITestCase
from Usuarios.models import Estado, Rol, Usuarios
from Productos.models import Productos
from Productos.serializer import FlexBooleanField, MiProductoCreateSerializer


# ── Helpers ───────────────────────────────────────────────────────────────────

def _setup_base():
    e_activo   = Estado.objects.create(nombre="Activo")
    e_inactivo = Estado.objects.create(nombre="Inactivo")
    rol = Rol.objects.create(nombre_rol="Cliente", fk_estado=e_activo)
    vendedor = Usuarios.objects.create(
        usuario="vendedor_p", correo="vendedor_p@mail.com",
        fk_rol=rol, fk_estado=e_activo,
    )
    vendedor.set_password("Pass1234")
    vendedor.save()
    comprador = Usuarios.objects.create(
        usuario="comprador_p", correo="comprador_p@mail.com",
        fk_rol=rol, fk_estado=e_activo,
    )
    comprador.set_password("Pass1234")
    comprador.save()
    return e_activo, e_inactivo, rol, vendedor, comprador


# ── FlexBooleanField ──────────────────────────────────────────────────────────

class TestFlexBooleanField(TestCase):
    """Pruebas unitarias para el campo flexible de booleano."""

    def setUp(self):
        self.field = FlexBooleanField()

    def test_string_true(self):
        for val in ("true", "1", "yes"):
            self.assertTrue(self.field.to_internal_value(val))

    def test_string_false(self):
        for val in ("false", "0", "no"):
            self.assertFalse(self.field.to_internal_value(val))

    def test_bool_true(self):
        self.assertTrue(self.field.to_internal_value(True))
        self.assertTrue(self.field.to_internal_value(1))

    def test_bool_false(self):
        self.assertFalse(self.field.to_internal_value(False))
        self.assertFalse(self.field.to_internal_value(0))

    def test_valor_invalido_lanza_error(self):
        from rest_framework.exceptions import ValidationError
        with self.assertRaises(ValidationError):
            self.field.to_internal_value("maybe")

    def test_representacion(self):
        self.assertTrue(self.field.to_representation(True))
        self.assertFalse(self.field.to_representation(False))


# ── Catálogo público ──────────────────────────────────────────────────────────

class TestCatalogoPublico(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.e_activo, cls.e_inactivo, cls.rol, cls.vendedor, cls.comprador = _setup_base()
        cls.producto_activo = Productos.objects.create(
            nombre="Producto Activo",
            precio=Decimal("10000"),
            codigo_producto="PACT001",
            fk_estado=cls.e_activo,
            fk_usuario=cls.vendedor,
            stock=10,
        )
        cls.producto_inactivo = Productos.objects.create(
            nombre="Producto Inactivo",
            precio=Decimal("5000"),
            codigo_producto="PINACT001",
            fk_estado=cls.e_inactivo,
            fk_usuario=cls.vendedor,
            stock=5,
        )

    def setUp(self):
        # El endpoint de detalle requiere autenticación (permiso global IsAuthenticated)
        self.client.force_authenticate(user=self.comprador)

    def test_lista_solo_activos(self):
        res = self.client.get("/productos/productos/")
        self.assertEqual(res.status_code, 200)
        nombres = [p["nombre"] for p in res.data["data"]]
        self.assertIn("Producto Activo", nombres)
        self.assertNotIn("Producto Inactivo", nombres)

    def test_detalle_producto_activo(self):
        res = self.client.get(f"/productos/productos/{self.producto_activo.pk_producto}/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["data"]["nombre"], "Producto Activo")

    def test_detalle_producto_inactivo_retorna_404(self):
        res = self.client.get(f"/productos/productos/{self.producto_inactivo.pk_producto}/")
        self.assertEqual(res.status_code, 404)

    def test_detalle_producto_inexistente(self):
        res = self.client.get("/productos/productos/99999/")
        self.assertEqual(res.status_code, 404)

    def test_detalle_muestra_info_vendedor_segun_flags(self):
        # Se crea un producto local para no modificar el objeto de setUpTestData
        prod = Productos.objects.create(
            nombre="Con Flags", precio=Decimal("5000"), codigo_producto="FLAGS_ON",
            fk_estado=self.e_activo, fk_usuario=self.vendedor, stock=1,
            muestra_nombre=True, muestra_correo=True,
        )
        self.vendedor.correo = "vendedor_p@mail.com"
        res = self.client.get(f"/productos/productos/{prod.pk_producto}/")
        self.assertIsNotNone(res.data["data"]["correo_vendedor"])

    def test_detalle_oculta_info_vendedor(self):
        prod = Productos.objects.create(
            nombre="Sin Flags", precio=Decimal("5000"), codigo_producto="FLAGS_OFF",
            fk_estado=self.e_activo, fk_usuario=self.vendedor, stock=1,
            muestra_nombre=False, muestra_correo=False,
        )
        res = self.client.get(f"/productos/productos/{prod.pk_producto}/")
        self.assertIsNone(res.data["data"]["correo_vendedor"])


# ── Mis Productos ─────────────────────────────────────────────────────────────

class TestMisProductos(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.e_activo, cls.e_inactivo, cls.rol, cls.vendedor, cls.comprador = _setup_base()
        cls.producto = Productos.objects.create(
            nombre="Mi Producto",
            precio=Decimal("15000"),
            codigo_producto="MPROD001",
            fk_estado=cls.e_activo,
            fk_usuario=cls.vendedor,
            stock=20,
        )

    def setUp(self):
        self.client.force_authenticate(user=self.vendedor)

    def test_listar_mis_productos(self):
        res = self.client.get("/productos/mis-productos/")
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.data["data"]), 1)

    def test_solo_muestra_propios(self):
        self.client.force_authenticate(user=self.comprador)
        res = self.client.get("/productos/mis-productos/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["data"]), 0)

    def test_crear_producto(self):
        res = self.client.post("/productos/crear-mis-productos/", {
            "nombre": "Nuevo", "precio": "30000",
            "codigo_producto": "MPROD002",
            "fk_estado": self.e_activo.pk_estado,
            "stock": "5", "muestra_nombre": "true",
        })
        self.assertEqual(res.status_code, 201)
        self.assertTrue(Productos.objects.filter(codigo_producto="MPROD002").exists())

    def test_crear_producto_codigo_duplicado(self):
        res = self.client.post("/productos/crear-mis-productos/", {
            "nombre": "Dup", "precio": "5000",
            "codigo_producto": "MPROD001",
            "fk_estado": self.e_activo.pk_estado,
            "stock": "1",
        })
        self.assertEqual(res.status_code, 400)

    def test_crear_producto_precio_cero(self):
        res = self.client.post("/productos/crear-mis-productos/", {
            "nombre": "Gratis", "precio": "0",
            "codigo_producto": "MPROD_INV",
            "fk_estado": self.e_activo.pk_estado,
            "stock": "1",
        })
        self.assertEqual(res.status_code, 400)

    def test_crear_producto_precio_negativo(self):
        res = self.client.post("/productos/crear-mis-productos/", {
            "nombre": "Negativo", "precio": "-100",
            "codigo_producto": "MPROD_NEG",
            "fk_estado": self.e_activo.pk_estado,
            "stock": "1",
        })
        self.assertEqual(res.status_code, 400)

    def test_crear_producto_stock_negativo(self):
        res = self.client.post("/productos/crear-mis-productos/", {
            "nombre": "Sin stock", "precio": "5000",
            "codigo_producto": "MPROD_NEG2",
            "fk_estado": self.e_activo.pk_estado,
            "stock": "-1",
        })
        self.assertEqual(res.status_code, 400)

    def test_editar_producto(self):
        res = self.client.patch(
            f"/productos/mis-productos/{self.producto.pk_producto}/editar/",
            {"nombre": "Editado", "precio": "20000"},
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["data"]["nombre"], "Editado")

    def test_editar_producto_ajeno_retorna_404(self):
        self.client.force_authenticate(user=self.comprador)
        res = self.client.patch(
            f"/productos/mis-productos/{self.producto.pk_producto}/editar/",
            {"nombre": "Hack"},
        )
        self.assertEqual(res.status_code, 404)

    def test_toggle_desactivar(self):
        res = self.client.patch(f"/productos/cambiar-estado-producto/{self.producto.pk_producto}/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["data"]["estado"], "Inactivo")

    def test_toggle_activar(self):
        prod = Productos.objects.create(
            nombre="Inactivo Toggle", precio=Decimal("5000"),
            codigo_producto="TOG001",
            fk_estado=self.e_inactivo,
            fk_usuario=self.vendedor, stock=1,
        )
        res = self.client.patch(f"/productos/cambiar-estado-producto/{prod.pk_producto}/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["data"]["estado"], "Activo")

    def test_sin_autenticar_retorna_401(self):
        self.client.force_authenticate(user=None)
        res = self.client.get("/productos/mis-productos/")
        self.assertEqual(res.status_code, 401)
