from django.db import models
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
# Create your models here.

class Estado(models.Model):
    pk_estado = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)
    class Meta:
        db_table = "estado"


class Rol(models.Model):
    pk_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=50)
    fk_estado = models.ForeignKey(Estado, models.DO_NOTHING, null=True, db_column='fk_estado')

    class Meta:
        db_table = "rol"


class UsuariosManager(BaseUserManager):
    def create_user(self, correo, numero_identificacion, password=None, **extra_fields):
        if not correo:
            raise ValueError('El correo debe ser obligatorio')
        correo = self.normalize_email(correo)
        user = self.model(correo=correo, numero_identificacion=numero_identificacion, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, correo, numero_identificacion, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(correo, numero_identificacion, password, **extra_fields)

class Usuarios(models.Model):
    pk_usuario = models.AutoField(primary_key=True)
    usuario = models.CharField(max_length=50, unique=True)
    contrasena = models.CharField(max_length=500)
    numero_identificacion = models.CharField(max_length=20, null=True)
    telefono = models.CharField(max_length=15, null=True)
    correo = models.CharField(max_length=100, null=True, unique=True)
    nombre = models.CharField(max_length=30, null=True)
    fk_rol = models.ForeignKey(Rol, models.DO_NOTHING, db_column='fk_rol')
    fk_estado = models.ForeignKey(Estado, models.DO_NOTHING, null=True, db_column='fk_estado')

    
    # Campos requeridos por Django
    last_login = models.DateTimeField(auto_now=True)  
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_anonymous = models.BooleanField(default=False)
    USERNAME_FIELD = 'correo'
    REQUIRED_FIELDS = ['numero_identificacion']

    
    objects = UsuariosManager()


    @property
    def id(self):
        return self.pk_usuario

    @property
    def is_authenticated(self):
        return True  

    def get_email_field_name(self):
        return "correo"

    def __str__(self):
        return self.usuario
    class Meta:
        db_table = "usuarios"
    def set_password(self, raw_password):
        self.contrasena = make_password(raw_password)

    def check_contrasena(self, raw_password):
        from django.contrib.auth.hashers import check_password
        return check_password(raw_password, self.contrasena)

 

class Login_log(models.Model):
    pk_login_log = models.AutoField(primary_key=True)
    fk_usuario = models.ForeignKey(Usuarios, models.DO_NOTHING, db_column='fk_usuario', null=True)
    timestamp = models.DateTimeField(auto_now_add=True, null=True)
    login = models.CharField(max_length=5, null=True)

    class Meta:
        db_table = "login_log"


class Vista(models.Model):
    pk_vista = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    ruta = models.CharField(max_length=200, unique=True)
    icono = models.CharField(max_length=100, null=True)
    fk_estado = models.ForeignKey(Estado, models.DO_NOTHING, db_column='fk_estado')
    visible_en_navbar = models.BooleanField(default=True)
    
    class Meta:
        db_table = "vista"

class PermisoRol(models.Model):
    pk_permiso_rol = models.AutoField(primary_key=True)
    fk_rol = models.ForeignKey(Rol, models.DO_NOTHING, db_column='fk_rol')
    fk_vista = models.ForeignKey(Vista, models.DO_NOTHING, db_column='fk_vista')
    tiene_acceso = models.BooleanField(default=True)
    
    class Meta:
        db_table = "permiso_rol"
        unique_together = ('fk_rol', 'fk_vista')

