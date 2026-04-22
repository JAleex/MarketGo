from django.db import models
from Usuarios.models import Usuarios, Estado

class Productos(models.Model):
    pk_producto = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=150)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_publicacion = models.DateTimeField(auto_now_add=True)
    detalles = models.TextField(null=True)
    
    fk_estado = models.ForeignKey(Estado, models.DO_NOTHING, db_column='fk_estado')
    fk_usuario = models.ForeignKey(Usuarios, models.DO_NOTHING, db_column='fk_usuario')

    stock = models.IntegerField(default=0)
    codigo_producto = models.CharField(max_length=50, unique=True)

    muestra_nombre = models.BooleanField(default=True)
    muestra_telefono = models.BooleanField(default=False)
    muestra_correo = models.BooleanField(default=False)

    ruta_imagen = models.CharField(max_length=255, null=True)

    class Meta:
        db_table = "productos"

    def __str__(self):
        return self.nombre