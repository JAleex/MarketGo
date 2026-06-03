"""
3 Pruebas de integración — flujos multi-capa completos.

Integración 1: Flujo de compra completo
    Login = agregar 2 productos al carrito -> realizar pedido
    -> verificar Pedido, DetallePedidos, Ventas y vaciado del carrito.

Integración 2: Gestión de venta con propagación de estado
    Vendedor cambia estado de una venta -> el DetallePedidos y el Pedido
    padre se actualizan cuando todos los detalles coinciden; y NO se
    actualiza cuando el pedido tiene detalles con estados distintos.

Integración 3: Flujo completo de actualización de perfil
    GET -> PATCH exitoso -> GET verifica cambios -> PATCH con correo
    duplicado devuelve 400.
"""
from decimal import Decimal
from rest_framework.test import APITestCase
from Usuarios.models import Estado, Rol, Usuarios
from Productos.models import Productos
from Ventas.models import Carrito, Pedidos, DetallePedidos, Venta


# ── Helpers compartidos ───────────────────────────────────────────────────────

def _estados():
    e_activo    = Estado.objects.create(nombre="Activo")
    e_inactivo  = Estado.objects.create(nombre="Inactivo")
    e_pendiente = Estado.objects.create(nombre="Pendiente")
    e_enviado   = Estado.objects.create(nombre="Enviado")
    return e_activo, e_inactivo, e_pendiente, e_enviado


def _rol(estado):
    return Rol.objects.create(nombre_rol="Cliente", fk_estado=estado)


def _usuario(usuario, correo, rol, estado, password="Pass1234"):
    u = Usuarios.objects.create(usuario=usuario, correo=correo, fk_rol=rol, fk_estado=estado)
    u.set_password(password)
    u.save()
    return u


# ─────────────────────────────────────────────────────────────────────────────
# INTEGRACIÓN 1: Flujo completo de compra
# ─────────────────────────────────────────────────────────────────────────────

class TestIntegracionFlujoCompra(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.e_activo, cls.e_inactivo, cls.e_pendiente, _ = _estados()
        cls.rol = _rol(cls.e_activo)
        cls.vendedor  = _usuario("int1_vendedor",  "int1_v@mail.com",  cls.rol, cls.e_activo)
        cls.comprador = _usuario("int1_comprador", "int1_c@mail.com", cls.rol, cls.e_activo)
        cls.prod_a = Productos.objects.create(
            nombre="Prod A", precio=Decimal("15000"),
            codigo_producto="INT1_A",
            fk_estado=cls.e_activo, fk_usuario=cls.vendedor, stock=50,
        )
        cls.prod_b = Productos.objects.create(
            nombre="Prod B", precio=Decimal("25000"),
            codigo_producto="INT1_B",
            fk_estado=cls.e_activo, fk_usuario=cls.vendedor, stock=20,
        )

    def test_flujo_carrito_a_pedido(self):
        self.client.force_authenticate(user=self.comprador)

        # 1 — Agregar dos productos al carrito
        res = self.client.post("/ventas/carrito/", {
            "fk_producto": self.prod_a.pk_producto, "cantidad_producto": 2,
        })
        self.assertEqual(res.status_code, 201)

        res = self.client.post("/ventas/carrito/", {
            "fk_producto": self.prod_b.pk_producto, "cantidad_producto": 1,
        })
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["data"]["total_productos"], 3)

        # 2 — Realizar el pedido
        res = self.client.post("/ventas/realizar-pedido/")
        self.assertEqual(res.status_code, 201)
        pk_pedido = res.data["data"]["pk_pedido"]

        # 3 — Verificar Pedido creado con total correcto
        pedido = Pedidos.objects.get(pk_pedido=pk_pedido)
        self.assertEqual(pedido.fk_usuario, self.comprador)
        self.assertEqual(pedido.cantidad_productos, 3)
        self.assertEqual(
            pedido.total_pedido,
            Decimal("15000") * 2 + Decimal("25000") * 1,
        )

        # 4 — Verificar DetallePedidos: 2 registros (uno por producto)
        self.assertEqual(DetallePedidos.objects.filter(fk_pedido=pedido).count(), 2)

        # 5 — Verificar Ventas creadas para el vendedor
        self.assertEqual(
            Venta.objects.filter(fk_usuario=self.vendedor).count(), 2,
        )

        # 6 — Verificar que el carrito quedó vacío
        self.assertFalse(
            Carrito.objects.filter(
                fk_usuario=self.comprador, fk_estado=self.e_activo,
            ).exists()
        )

        # 7 — Verificar endpoint de detalle de pedido
        res = self.client.get(f"/ventas/mis-pedidos/{pk_pedido}/detalle/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["data"]), 2)


# ─────────────────────────────────────────────────────────────────────────────
# INTEGRACIÓN 2: Gestión de venta y propagación de estado
# ─────────────────────────────────────────────────────────────────────────────

class TestIntegracionPropagacionEstado(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.e_activo, cls.e_inactivo, cls.e_pendiente, cls.e_enviado = _estados()
        cls.rol = _rol(cls.e_activo)
        cls.vendedor  = _usuario("int2_vendedor",  "int2_v@mail.com",  cls.rol, cls.e_activo)
        cls.vendedor2 = _usuario("int2_vendedor2", "int2_v2@mail.com", cls.rol, cls.e_activo)
        cls.comprador = _usuario("int2_comprador", "int2_c@mail.com",  cls.rol, cls.e_activo)
        cls.producto = Productos.objects.create(
            nombre="Prod Int2", precio=Decimal("30000"),
            codigo_producto="INT2_PROD",
            fk_estado=cls.e_activo, fk_usuario=cls.vendedor, stock=50,
        )
        cls.producto2 = Productos.objects.create(
            nombre="Prod Int2b", precio=Decimal("10000"),
            codigo_producto="INT2_PROD2",
            fk_estado=cls.e_activo, fk_usuario=cls.vendedor2, stock=50,
        )

    def _crear_pedido_con_detalle(self, producto, cantidad=1):
        total = producto.precio * cantidad
        pedido = Pedidos.objects.create(
            fk_usuario=self.comprador, fk_estado=self.e_pendiente,
            cantidad_productos=cantidad, total_pedido=total,
        )
        detalle = DetallePedidos.objects.create(
            fk_pedido=pedido, fk_producto=producto,
            cantidad_producto=cantidad, total_pedido=total,
            fk_estado=self.e_pendiente,
        )
        venta = Venta.objects.create(
            fk_producto=producto, fk_usuario=producto.fk_usuario,
            comprador=self.comprador, total_venta=total,
            cantidad_producto=cantidad, fk_estado=self.e_pendiente,
        )
        return pedido, detalle, venta

    def test_cambio_estado_propaga_pedido_un_detalle(self):
        pedido, detalle, venta = self._crear_pedido_con_detalle(self.producto)
        self.client.force_authenticate(user=self.vendedor)

        res = self.client.patch(
            f"/ventas/mis-ventas/{venta.pk_venta}/estado/",
            {"fk_estado": self.e_enviado.pk_estado},
        )
        self.assertEqual(res.status_code, 200)

        venta.refresh_from_db()
        detalle.refresh_from_db()
        pedido.refresh_from_db()

        self.assertEqual(venta.fk_estado.nombre, "Enviado")
        self.assertEqual(detalle.fk_estado.nombre, "Enviado")
        self.assertEqual(pedido.fk_estado.nombre, "Enviado")

    def test_cambio_estado_no_propaga_pedido_dos_detalles(self):
        pedido = Pedidos.objects.create(
            fk_usuario=self.comprador, fk_estado=self.e_pendiente,
            cantidad_productos=2, total_pedido=Decimal("40000"),
        )
        detalle1 = DetallePedidos.objects.create(
            fk_pedido=pedido, fk_producto=self.producto,
            cantidad_producto=1, total_pedido=Decimal("30000"),
            fk_estado=self.e_pendiente,
        )
        DetallePedidos.objects.create(
            fk_pedido=pedido, fk_producto=self.producto2,
            cantidad_producto=1, total_pedido=Decimal("10000"),
            fk_estado=self.e_pendiente,  # se mantiene Pendiente
        )
        venta = Venta.objects.create(
            fk_producto=self.producto, fk_usuario=self.vendedor,
            comprador=self.comprador, total_venta=Decimal("30000"),
            cantidad_producto=1, fk_estado=self.e_pendiente,
        )

        self.client.force_authenticate(user=self.vendedor)
        self.client.patch(
            f"/ventas/mis-ventas/{venta.pk_venta}/estado/",
            {"fk_estado": self.e_enviado.pk_estado},
        )

        pedido.refresh_from_db()
        detalle1.refresh_from_db()

        # Detalle1 cambió, pero el Pedido NO porque detalle2 sigue Pendiente
        self.assertEqual(detalle1.fk_estado.nombre, "Enviado")
        self.assertEqual(pedido.fk_estado.nombre, "Pendiente")


# ─────────────────────────────────────────────────────────────────────────────
# INTEGRACIÓN 3: Flujo completo de perfil de usuario
# ─────────────────────────────────────────────────────────────────────────────

class TestIntegracionPerfil(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.e_activo = Estado.objects.create(nombre="Activo")
        Estado.objects.create(nombre="Inactivo")
        cls.rol = Rol.objects.create(nombre_rol="Cliente", fk_estado=cls.e_activo)
        cls.otro = _usuario("int3_otro", "int3_otro@mail.com", cls.rol, cls.e_activo)

    def setUp(self):
        self.usuario = _usuario("int3_user", "int3@mail.com", self.rol, self.e_activo)
        self.usuario.nombre = "Nombre Original"
        self.usuario.telefono = "3001111111"
        self.usuario.save()
        self.client.force_authenticate(user=self.usuario)

    def test_flujo_get_patch_get_validacion(self):
        # 1 — GET inicial: verificar datos
        res = self.client.get("/usuarios/mi-perfil/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["data"]["nombre"], "Nombre Original")

        # 2 — PATCH: actualizar nombre y teléfono
        res = self.client.patch("/usuarios/mi-perfil/", {
            "nombre": "Nombre Nuevo", "telefono": "3009999999",
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["data"]["nombre"], "Nombre Nuevo")

        # 3 — GET: confirmar persistencia
        res = self.client.get("/usuarios/mi-perfil/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["data"]["nombre"], "Nombre Nuevo")
        self.assertEqual(res.data["data"]["telefono"], "3009999999")

        # 4 — PATCH con correo de otro usuario → 400
        res = self.client.patch("/usuarios/mi-perfil/", {
            "correo": "int3_otro@mail.com",
        })
        self.assertEqual(res.status_code, 400)

        # 5 — GET final: datos anteriores se mantienen (el PATCH fallido no modificó nada)
        res = self.client.get("/usuarios/mi-perfil/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["data"]["correo"], "int3@mail.com")
