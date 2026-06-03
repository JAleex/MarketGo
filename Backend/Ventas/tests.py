"""
Pruebas unitarias del módulo Ventas.
Cubre: carrito, realización de pedidos, mis ventas (con filtros),
cambio de estado con propagación, mis pedidos y detalle de pedido.
"""
from decimal import Decimal
from datetime import date
from rest_framework.test import APITestCase
from Usuarios.models import Estado, Rol, Usuarios
from Productos.models import Productos
from Ventas.models import Carrito, Pedidos, DetallePedidos, Venta


# ── Helpers ───────────────────────────────────────────────────────────────────

def _base():
    e_activo    = Estado.objects.create(nombre="Activo")     # pk=1
    e_inactivo  = Estado.objects.create(nombre="Inactivo")   # pk=2
    e_pendiente = Estado.objects.create(nombre="Pendiente")  # pk=3
    e_enviado   = Estado.objects.create(nombre="Enviado")    # pk=4
    rol = Rol.objects.create(nombre_rol="Cliente", fk_estado=e_activo)

    def _u(usuario, correo):
        u = Usuarios.objects.create(
            usuario=usuario, correo=correo, fk_rol=rol, fk_estado=e_activo,
        )
        u.set_password("Pass1234")
        u.save()
        return u

    vendedor  = _u("v_ventas", "v_ventas@mail.com")
    comprador = _u("c_ventas", "c_ventas@mail.com")

    producto = Productos.objects.create(
        nombre="Producto Ventas", precio=Decimal("20000"),
        codigo_producto="PV001",
        fk_estado=e_activo, fk_usuario=vendedor, stock=100,
    )
    return e_activo, e_inactivo, e_pendiente, e_enviado, rol, vendedor, comprador, producto


# ── Carrito ───────────────────────────────────────────────────────────────────

class TestCarrito(APITestCase):
    @classmethod
    def setUpTestData(cls):
        (cls.e_activo, cls.e_inactivo, cls.e_pendiente, cls.e_enviado,
         cls.rol, cls.vendedor, cls.comprador, cls.producto) = _base()

    def setUp(self):
        self.client.force_authenticate(user=self.comprador)

    def test_carrito_vacio(self):
        res = self.client.get("/ventas/carrito/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["data"]["total_productos"], 0)

    def test_agregar_item(self):
        res = self.client.post("/ventas/carrito/", {
            "fk_producto": self.producto.pk_producto, "cantidad_producto": 2,
        })
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["data"]["total_productos"], 2)

    def test_agregar_mismo_item_acumula(self):
        self.client.post("/ventas/carrito/", {
            "fk_producto": self.producto.pk_producto, "cantidad_producto": 1,
        })
        res = self.client.post("/ventas/carrito/", {
            "fk_producto": self.producto.pk_producto, "cantidad_producto": 3,
        })
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["data"]["total_productos"], 4)

    def test_agregar_producto_inactivo(self):
        prod_inact = Productos.objects.create(
            nombre="Inact", precio=Decimal("5000"), codigo_producto="PV_INACT",
            fk_estado=self.e_inactivo, fk_usuario=self.vendedor, stock=5,
        )
        res = self.client.post("/ventas/carrito/", {
            "fk_producto": prod_inact.pk_producto, "cantidad_producto": 1,
        })
        self.assertEqual(res.status_code, 400)

    def test_actualizar_cantidad_item(self):
        self.client.post("/ventas/carrito/", {
            "fk_producto": self.producto.pk_producto, "cantidad_producto": 1,
        })
        item = Carrito.objects.filter(
            fk_usuario=self.comprador, fk_estado=self.e_activo,
        ).first()
        res = self.client.patch(f"/ventas/carrito/{item.pk_carrito}/", {
            "cantidad_producto": 7,
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["data"]["total_productos"], 7)

    def test_actualizar_cantidad_invalida(self):
        self.client.post("/ventas/carrito/", {
            "fk_producto": self.producto.pk_producto, "cantidad_producto": 1,
        })
        item = Carrito.objects.filter(
            fk_usuario=self.comprador, fk_estado=self.e_activo,
        ).first()
        res = self.client.patch(f"/ventas/carrito/{item.pk_carrito}/", {
            "cantidad_producto": 0,
        })
        self.assertEqual(res.status_code, 400)

    def test_eliminar_item(self):
        self.client.post("/ventas/carrito/", {
            "fk_producto": self.producto.pk_producto, "cantidad_producto": 2,
        })
        item = Carrito.objects.filter(
            fk_usuario=self.comprador, fk_estado=self.e_activo,
        ).first()
        res = self.client.delete(f"/ventas/carrito/{item.pk_carrito}/")
        self.assertEqual(res.status_code, 200)
        self.assertFalse(
            Carrito.objects.filter(pk_carrito=item.pk_carrito).exists()
        )

    def test_item_no_encontrado(self):
        res = self.client.patch("/ventas/carrito/99999/", {"cantidad_producto": 1})
        self.assertEqual(res.status_code, 404)


# ── Realizar Pedido ───────────────────────────────────────────────────────────

class TestRealizarPedido(APITestCase):
    @classmethod
    def setUpTestData(cls):
        (cls.e_activo, cls.e_inactivo, cls.e_pendiente, cls.e_enviado,
         cls.rol, cls.vendedor, cls.comprador, cls.producto) = _base()

    def setUp(self):
        self.client.force_authenticate(user=self.comprador)
        Carrito.objects.create(
            fk_usuario=self.comprador,
            fk_producto=self.producto,
            cantidad_producto=2,
            fk_estado=self.e_activo,
        )

    def test_realizar_pedido_crea_pedido(self):
        res = self.client.post("/ventas/realizar-pedido/")
        self.assertEqual(res.status_code, 201)
        self.assertIn("pk_pedido", res.data["data"])
        self.assertTrue(Pedidos.objects.filter(fk_usuario=self.comprador).exists())

    def test_realizar_pedido_crea_venta(self):
        self.client.post("/ventas/realizar-pedido/")
        self.assertTrue(
            Venta.objects.filter(
                fk_usuario=self.vendedor, fk_producto=self.producto,
            ).exists()
        )

    def test_realizar_pedido_crea_detalle(self):
        res = self.client.post("/ventas/realizar-pedido/")
        pk = res.data["data"]["pk_pedido"]
        self.assertTrue(DetallePedidos.objects.filter(fk_pedido__pk_pedido=pk).exists())

    def test_realizar_pedido_vacia_carrito(self):
        self.client.post("/ventas/realizar-pedido/")
        self.assertFalse(
            Carrito.objects.filter(
                fk_usuario=self.comprador, fk_estado=self.e_activo,
            ).exists()
        )

    def test_realizar_pedido_calcula_total(self):
        res = self.client.post("/ventas/realizar-pedido/")
        pedido = Pedidos.objects.get(pk_pedido=res.data["data"]["pk_pedido"])
        self.assertEqual(pedido.total_pedido, Decimal("40000"))  # 20000 x 2

    def test_realizar_pedido_carrito_vacio(self):
        Carrito.objects.filter(fk_usuario=self.comprador).delete()
        res = self.client.post("/ventas/realizar-pedido/")
        self.assertEqual(res.status_code, 400)


# ── Mis Ventas ────────────────────────────────────────────────────────────────

class TestMisVentas(APITestCase):
    @classmethod
    def setUpTestData(cls):
        (cls.e_activo, cls.e_inactivo, cls.e_pendiente, cls.e_enviado,
         cls.rol, cls.vendedor, cls.comprador, cls.producto) = _base()

    def setUp(self):
        self.venta = Venta.objects.create(
            fk_producto=self.producto, fk_usuario=self.vendedor,
            comprador=self.comprador, total_venta=Decimal("40000"),
            cantidad_producto=2, fk_estado=self.e_pendiente,
        )
        self.client.force_authenticate(user=self.vendedor)

    def test_listar_ventas(self):
        res = self.client.get("/ventas/mis-ventas/")
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.data["data"]), 1)

    def test_filtrar_por_estado_con_resultado(self):
        res = self.client.get(f"/ventas/mis-ventas/?estado={self.e_pendiente.pk_estado}")
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.data["data"]), 1)

    def test_filtrar_por_estado_sin_resultado(self):
        res = self.client.get(f"/ventas/mis-ventas/?estado={self.e_enviado.pk_estado}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["data"]), 0)

    def test_filtrar_por_fecha_hoy(self):
        res = self.client.get(f"/ventas/mis-ventas/?fecha={date.today().isoformat()}")
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.data["data"]), 1)

    def test_no_muestra_ventas_de_otros(self):
        self.client.force_authenticate(user=self.comprador)
        res = self.client.get("/ventas/mis-ventas/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["data"]), 0)


# ── Cambiar Estado Venta ──────────────────────────────────────────────────────

class TestCambiarEstadoVenta(APITestCase):
    @classmethod
    def setUpTestData(cls):
        (cls.e_activo, cls.e_inactivo, cls.e_pendiente, cls.e_enviado,
         cls.rol, cls.vendedor, cls.comprador, cls.producto) = _base()

    def setUp(self):
        self.pedido = Pedidos.objects.create(
            fk_usuario=self.comprador, fk_estado=self.e_pendiente,
            cantidad_productos=1, total_pedido=Decimal("20000"),
        )
        self.detalle = DetallePedidos.objects.create(
            fk_pedido=self.pedido, fk_producto=self.producto,
            cantidad_producto=1, total_pedido=Decimal("20000"),
            fk_estado=self.e_pendiente,
        )
        self.venta = Venta.objects.create(
            fk_producto=self.producto, fk_usuario=self.vendedor,
            comprador=self.comprador, total_venta=Decimal("20000"),
            cantidad_producto=1, fk_estado=self.e_pendiente,
        )
        self.client.force_authenticate(user=self.vendedor)

    def test_cambiar_estado_venta(self):
        res = self.client.patch(
            f"/ventas/mis-ventas/{self.venta.pk_venta}/estado/",
            {"fk_estado": self.e_enviado.pk_estado},
        )
        self.assertEqual(res.status_code, 200)
        self.venta.refresh_from_db()
        self.assertEqual(self.venta.fk_estado.nombre, "Enviado")

    def test_propaga_estado_a_detalle_pedido(self):
        self.client.patch(
            f"/ventas/mis-ventas/{self.venta.pk_venta}/estado/",
            {"fk_estado": self.e_enviado.pk_estado},
        )
        self.detalle.refresh_from_db()
        self.assertEqual(self.detalle.fk_estado.nombre, "Enviado")

    def test_propaga_estado_a_pedido_cuando_todos_iguales(self):
        self.client.patch(
            f"/ventas/mis-ventas/{self.venta.pk_venta}/estado/",
            {"fk_estado": self.e_enviado.pk_estado},
        )
        self.pedido.refresh_from_db()
        self.assertEqual(self.pedido.fk_estado.nombre, "Enviado")

    def test_no_propaga_pedido_con_detalles_mixtos(self):
        """Pedido con dos detalles: solo se cambia uno. El pedido no debe cambiar."""
        prod2 = Productos.objects.create(
            nombre="Prod2", precio=Decimal("5000"), codigo_producto="PV_MIX",
            fk_estado=self.e_activo, fk_usuario=self.vendedor, stock=10,
        )
        DetallePedidos.objects.create(
            fk_pedido=self.pedido, fk_producto=prod2,
            cantidad_producto=1, total_pedido=Decimal("5000"),
            fk_estado=self.e_pendiente,  # queda Pendiente
        )
        self.client.patch(
            f"/ventas/mis-ventas/{self.venta.pk_venta}/estado/",
            {"fk_estado": self.e_enviado.pk_estado},
        )
        self.pedido.refresh_from_db()
        self.assertEqual(self.pedido.fk_estado.nombre, "Pendiente")

    def test_error_sin_estado(self):
        res = self.client.patch(
            f"/ventas/mis-ventas/{self.venta.pk_venta}/estado/", {},
        )
        self.assertEqual(res.status_code, 400)

    def test_error_estado_invalido(self):
        res = self.client.patch(
            f"/ventas/mis-ventas/{self.venta.pk_venta}/estado/",
            {"fk_estado": 99999},
        )
        self.assertEqual(res.status_code, 400)

    def test_error_venta_inexistente(self):
        res = self.client.patch(
            "/ventas/mis-ventas/99999/estado/",
            {"fk_estado": self.e_enviado.pk_estado},
        )
        self.assertEqual(res.status_code, 404)

    def test_error_venta_de_otro_vendedor(self):
        otro_vendedor = Usuarios.objects.create(
            usuario="otro_v", correo="otro_v@mail.com",
            fk_rol=self.rol, fk_estado=self.e_activo,
        )
        otro_vendedor.set_password("Pass1234")
        otro_vendedor.save()
        self.client.force_authenticate(user=otro_vendedor)
        res = self.client.patch(
            f"/ventas/mis-ventas/{self.venta.pk_venta}/estado/",
            {"fk_estado": self.e_enviado.pk_estado},
        )
        self.assertEqual(res.status_code, 404)


# ── Mis Pedidos ───────────────────────────────────────────────────────────────

class TestMisPedidos(APITestCase):
    @classmethod
    def setUpTestData(cls):
        (cls.e_activo, cls.e_inactivo, cls.e_pendiente, cls.e_enviado,
         cls.rol, cls.vendedor, cls.comprador, cls.producto) = _base()

    def setUp(self):
        self.pedido = Pedidos.objects.create(
            fk_usuario=self.comprador, fk_estado=self.e_pendiente,
            cantidad_productos=1, total_pedido=Decimal("20000"),
        )
        self.detalle = DetallePedidos.objects.create(
            fk_pedido=self.pedido, fk_producto=self.producto,
            cantidad_producto=1, total_pedido=Decimal("20000"),
            fk_estado=self.e_pendiente,
        )
        self.client.force_authenticate(user=self.comprador)

    def test_listar_pedidos(self):
        res = self.client.get("/ventas/mis-pedidos/")
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.data["data"]), 1)

    def test_filtrar_por_estado_con_resultado(self):
        res = self.client.get(f"/ventas/mis-pedidos/?estado={self.e_pendiente.pk_estado}")
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.data["data"]), 1)

    def test_filtrar_por_estado_sin_resultado(self):
        res = self.client.get(f"/ventas/mis-pedidos/?estado={self.e_enviado.pk_estado}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["data"]), 0)

    def test_filtrar_por_fecha_hoy(self):
        res = self.client.get(f"/ventas/mis-pedidos/?fecha={date.today().isoformat()}")
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.data["data"]), 1)

    def test_no_muestra_pedidos_de_otros(self):
        self.client.force_authenticate(user=self.vendedor)
        res = self.client.get("/ventas/mis-pedidos/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["data"]), 0)

    def test_detalle_pedido(self):
        res = self.client.get(f"/ventas/mis-pedidos/{self.pedido.pk_pedido}/detalle/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["data"]), 1)
        self.assertEqual(res.data["data"][0]["producto_nombre"], "Producto Ventas")

    def test_detalle_pedido_no_encontrado(self):
        res = self.client.get("/ventas/mis-pedidos/99999/detalle/")
        self.assertEqual(res.status_code, 404)

    def test_detalle_pedido_ajeno_retorna_404(self):
        self.client.force_authenticate(user=self.vendedor)
        res = self.client.get(f"/ventas/mis-pedidos/{self.pedido.pk_pedido}/detalle/")
        self.assertEqual(res.status_code, 404)
