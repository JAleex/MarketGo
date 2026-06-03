from django.core.management.base import BaseCommand
from Usuarios.models import Estado, Rol, Vista, PermisoRol, Usuarios


class Command(BaseCommand):
    help = "Inserta los registros base de Estado, Rol, Vista y PermisoRol si no existen."

    def handle(self, *args, **kwargs):
        # ── Estados ───────────────────────────────────────────────────────────
        estados = [
            (1, "Activo"),
            (2, "Inactivo"),
            (3, "Pendiente"),
            (4, "Despachado"),
            (5, "Preparando"),
            (6, "Sin Contacto"),
            (7, "Cancelado"),
        ]
        for pk, nombre in estados:
            _, created = Estado.objects.get_or_create(pk_estado=pk, defaults={"nombre": nombre})
            if created:
                self.stdout.write(f"  Estado creado: {nombre}")

        e_activo = Estado.objects.get(pk_estado=1)

        # ── Roles ─────────────────────────────────────────────────────────────
        roles = [
            (1, "Administrador"),
            (2, "Usuario"),
        ]
        for pk, nombre_rol in roles:
            _, created = Rol.objects.get_or_create(pk_rol=pk, defaults={"nombre_rol": nombre_rol, "fk_estado": e_activo})
            if created:
                self.stdout.write(f"  Rol creado: {nombre_rol}")

        # ── Vistas ────────────────────────────────────────────────────────────
        vistas = [
            (1,  "Politicas de Acceso",   "/accesos",                True,  "bi-shield-lock"),
            (2,  "Inicio",                "/inicio",                 True,  "bi bi-house"),
            (3,  "Usuarios",              "/usuarios",               True,  "bi-people"),
            (4,  "Detalle Producto",      "/producto",               False, "bi-cart4"),
            (5,  "Mis Productos",         "/misproductos",           True,  "bi-cart"),
            (6,  "Detalle Mi Producto",   "/detalle-mi-producto",    False, "bi-cart"),
            (7,  "Carrito",               "/carrito",                True,  "bi-cart4"),
            (8,  "Mis Ventas",            "/misventas",              True,  "bi-coin"),
            (9,  "Mis Pedidos",           "/mispedidos",             True,  "bi-bag"),
            (10, "Información Personal",  "/informacionpersonal",    True,  "bi-person"),
        ]
        for pk, nombre, ruta, visible, icono in vistas:
            _, created = Vista.objects.get_or_create(
                pk_vista=pk,
                defaults={
                    "nombre": nombre,
                    "ruta": ruta,
                    "visible_en_navbar": visible,
                    "fk_estado": e_activo,
                    "icono": icono,
                },
            )
            if created:
                self.stdout.write(f"  Vista creada: {nombre}")

        # ── Permisos por Rol ──────────────────────────────────────────────────
        # (pk, tiene_acceso, fk_rol, fk_vista)
        permisos = [
            (1,  True,  1, 1),
            (2,  True,  2, 2),
            (3,  False, 2, 1),
            (4,  True,  1, 3),
            (5,  True,  2, 4),
            (6,  True,  2, 5),
            (7,  True,  2, 6),
            (8,  True,  2, 7),
            (9,  True,  2, 8),
            (10, True,  2, 9),
            (11, True,  2, 10),
        ]
        for pk, tiene_acceso, fk_rol, fk_vista in permisos:
            rol   = Rol.objects.get(pk_rol=fk_rol)
            vista = Vista.objects.get(pk_vista=fk_vista)
            _, created = PermisoRol.objects.get_or_create(
                pk_permiso_rol=pk,
                defaults={
                    "tiene_acceso": tiene_acceso,
                    "fk_rol": rol,
                    "fk_vista": vista,
                },
            )
            if created:
                self.stdout.write(f"  PermisoRol creado: rol={fk_rol} vista={fk_vista} acceso={tiene_acceso}")

        # ── Usuarios ──────────────────────────────────────────────────────────
        rol_admin   = Rol.objects.get(pk_rol=1)
        rol_usuario = Rol.objects.get(pk_rol=2)

        usuarios = [
            {
                "correo": "admin@example.com",
                "usuario": "admin",
                "contrasena": "pbkdf2_sha256$600000$icOe6aSIF8T0cNBnyaqMq4$WNcCH3ctqRaJoCtC/bWihis//OfAY3vngBTOBVlkDCM=",
                "numero_identificacion": "1",
                "telefono": "1",
                "nombre": "admin",
                "is_active": True,
                "is_staff": False,
                "is_anonymous": False,
                "fk_estado": e_activo,
                "fk_rol": rol_admin,
            },
            {
                "correo": "cliente@example.com",
                "usuario": "cliente",
                "contrasena": "pbkdf2_sha256$600000$5aZjiUku0coSg8520dUzQY$9lGWbdn9+spP7N+aeR8SaomG2n0bgztbM+oiDeakXMQ=",
                "numero_identificacion": "2",
                "telefono": "123",
                "nombre": "cliente",
                "is_active": True,
                "is_staff": False,
                "is_anonymous": False,
                "fk_estado": e_activo,
                "fk_rol": rol_usuario,
            },
        ]
        for data in usuarios:
            correo = data.pop("correo")
            _, created = Usuarios.objects.get_or_create(correo=correo, defaults=data)
            if created:
                self.stdout.write(f"  Usuario creado: {correo}")

        self.stdout.write(self.style.SUCCESS("Seed completado."))
