from django.db import models
from Usuarios.models import Usuarios, Estado
from Productos.models import Productos


class Venta (models.Model):
    pk_venta = models.AutoField(primary_key=True)
    fk_producto = models.ForeignKey(Productos, models.DO_NOTHING, db_column='fk_producto',null=True)
    total_venta = models.DecimalField(max_digits=12, decimal_places=2,null=True)
    cantidad_producto = models.IntegerField(null=True)
    fk_usuario = models.ForeignKey(Usuarios, models.DO_NOTHING, db_column='fk_usuario',related_name='ventas_realizadas',null=True)
    comprador = models.ForeignKey(Usuarios, models.DO_NOTHING, db_column='fk_comprador',related_name='compras_realizadas',null=True)
    fk_estado = models.ForeignKey(Estado, models.DO_NOTHING, db_column='fk_estado', null=True)
    fecha = models.DateTimeField(auto_now_add=True, null=True)


    class Meta:
        db_table = "venta"


class Pedidos(models.Model):
    pk_pedido = models.AutoField(primary_key=True)
    fk_usuario = models.ForeignKey(Usuarios, models.DO_NOTHING, db_column='fk_usuario')
    fk_estado = models.ForeignKey(Estado, models.DO_NOTHING, db_column='fk_estado')
    cantidad_productos = models.IntegerField()
    fecha_pedido = models.DateTimeField(auto_now_add=True)
    total_pedido = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = "pedidos"


class DetallePedidos(models.Model):
    pk_detalle_pedido = models.AutoField(primary_key=True)
    fk_pedido = models.ForeignKey(Pedidos, models.DO_NOTHING, db_column='fk_pedido')
    fk_producto = models.ForeignKey(Productos, models.DO_NOTHING, db_column='fk_producto')

    total_pedido = models.DecimalField(max_digits=12, decimal_places=2)
    cantidad_producto = models.IntegerField()

    fk_estado = models.ForeignKey(Estado, models.DO_NOTHING, db_column='fk_estado')

    class Meta:
        db_table = "detalle_pedidos"


class Carrito(models.Model):
    pk_carrito = models.AutoField(primary_key=True)
    fk_usuario = models.ForeignKey(Usuarios, models.DO_NOTHING, db_column='fk_usuario')
    fk_producto = models.ForeignKey(Productos, models.DO_NOTHING, db_column='fk_producto')
    cantidad_producto = models.IntegerField()
    fk_estado = models.ForeignKey(Estado, models.DO_NOTHING, db_column='fk_estado')
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "carrito"