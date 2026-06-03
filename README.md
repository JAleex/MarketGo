# MarketGo

Plataforma de marketplace donde los usuarios pueden publicar, comprar y gestionar productos. Incluye módulos de autenticación, catálogo, carrito de compras, pedidos, ventas y administración de permisos.

---

## Tabla de contenido

1. [Descripción del proyecto](#descripción-del-proyecto)
2. [Arquitectura general](#arquitectura-general)
3. [Tecnologías utilizadas](#tecnologías-utilizadas)
4. [Requisitos previos](#requisitos-previos)
5. [Variables de entorno](#variables-de-entorno)
6. [Instalación y ejecución local](#instalación-y-ejecución-local)
7. [Ejecución con Docker](#ejecución-con-docker)
8. [Documentación de la API](#documentación-de-la-api)
9. [Módulos del sistema](#módulos-del-sistema)

---

## Descripción del proyecto

MarketGo es una aplicación web full-stack que conecta vendedores y compradores en un entorno de marketplace. Los usuarios con rol **Cliente** pueden explorar productos, gestionar su carrito, realizar pedidos y administrar su perfil. Los usuarios con rol **Administrador** pueden gestionar usuarios y controlar los permisos de acceso por rol.

La autenticación se basa en JWT almacenado en **cookies HttpOnly**, con refresco automático transparente para el usuario.

---

## Arquitectura general

```
┌─────────────────────────────────────────────────────────┐
│                      Cliente (Browser)                   │
│              React 19 + TypeScript + Vite               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │  Login / │ │ Catálogo │ │ Carrito  │ │ Pedidos / │  │
│  │ Registro │ │Productos │ │ de Compra│ │  Ventas   │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST + Cookies JWT
┌──────────────────────▼──────────────────────────────────┐
│                Django REST Framework (API)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Usuarios │ │Productos │ │  Ventas  │ │   Utils   │  │
│  │   App    │ │   App    │ │   App    │ │ responses │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ ORM / psycopg2
┌──────────────────────▼──────────────────────────────────┐
│                    PostgreSQL                            │
│  estado · rol · usuarios · productos · pedidos          │
│  detalle_pedidos · venta · carrito · vista · permiso_rol│
└─────────────────────────────────────────────────────────┘
```

**Patrón de capas en el Frontend:**
- `LogicaXxx.ts` — hook de React que centraliza estado, llamadas a la API y lógica de negocio.
- `Xxx.tsx` — componente de presentación que consume el hook.
- `api.tsx` — instancia de Axios con interceptor de refresco automático de JWT.

**Flujo de autenticación:**
1. El usuario inicia sesión → el backend emite `access_token` (5 min) y `refresh_token` (7 días) en cookies HttpOnly.
2. El interceptor de Axios detecta respuestas `401` y llama automáticamente a `/usuarios/token/refresh/`.
3. Si el refresh falla, redirige a `/login`.

---

## Tecnologías utilizadas

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| Python | 3.11+ | Lenguaje principal |
| Django | 4.2 | Framework web |
| Django REST Framework | 3.15 | API REST |
| djangorestframework-simplejwt | 5.5 | Autenticación JWT |
| django-cors-headers | 4.7 | Manejo de CORS |
| psycopg2-binary | 2.9 | Driver PostgreSQL |
| dj-database-url | 2.1 | Configuración de BD por URL |
| python-decouple | 3.8 | Variables de entorno |
| Pillow | 12.1 | Procesamiento de imágenes |
| gunicorn | 25.1 | Servidor WSGI para producción |
| drf-spectacular | 0.28+ | Documentación OpenAPI/Swagger |

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React | 19 | Framework UI |
| TypeScript | 6.0 | Tipado estático |
| Vite | 8.0 | Bundler y servidor de desarrollo |
| Axios | 1.15 | Cliente HTTP |
| React Router DOM | 7.14 | Enrutamiento SPA |
| Bootstrap 5 | 5.3 | Estilos y componentes UI |
| Bootstrap Icons | 1.13 | Iconografía |
| SweetAlert2 | 11 | Alertas y notificaciones |

### Infraestructura
| Tecnología | Uso |
|---|---|
| PostgreSQL | Base de datos relacional |
| Docker + Docker Compose | Contenerización |
| Gunicorn | Servidor WSGI en producción |

---

## Requisitos previos

- **Python** 3.11 o superior
- **Node.js** 18 o superior
- **PostgreSQL** 14 o superior (o una cadena de conexión a una instancia remota)
- **Docker** y **Docker Compose** (opcional, para ejecución contenorizada)

---

## Variables de entorno

### Backend (`Backend/.env`)

```env
# Django
SECRET_KEY=tu_clave_secreta_aqui
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Base de datos
DATABASE_URL=postgres://usuario:contraseña@host:5432/nombre_bd

# CORS / CSRF
URL_FRONT=http://localhost:5173

# URL pública del backend (para correos de recuperación)
BACKEND_URL=http://localhost:8000

# Cookies de autenticación
CS_HTTPONLY=True
CS_SECURE=False
CS_SAMESITE=Lax
CS_PATH=/
```

### Frontend (`Frontend/.env`)

```env
VITE_API_URL=http://localhost:8000
VITE_FRONT_END_URL=http://localhost:5173
```

---

## Instalación y ejecución local

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd 01_MarketGo
```

### 2. Backend

```bash
cd Backend

# Crear y activar entorno virtual
python -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env            # editar .env con tus valores

# Aplicar migraciones
python manage.py migrate

# (Opcional) Crear superusuario
python manage.py createsuperuser

# Iniciar servidor de desarrollo
python manage.py runserver
```

El backend quedará disponible en `http://localhost:8000`.

### 3. Frontend

```bash
cd Frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env            # editar .env con tus valores

# Iniciar servidor de desarrollo
npm run dev
```

El frontend quedará disponible en `http://localhost:5173`.

---

## Ejecución con Docker

El proyecto incluye archivos `docker-compose.yml` independientes para cada servicio. Ambos comparten la red externa `RED_MARKETGO`.

### Crear la red compartida (una sola vez)

```bash
docker network create RED_MARKETGO
```

### Backend

```bash
cd Backend
docker compose up -d
```

### Frontend

```bash
cd Frontend
docker compose up -d
```

### Verificar contenedores activos

```bash
docker ps
```

---

## Documentación de la API

La documentación interactiva de la API está disponible en:

| Interfaz | URL |
|---|---|
| Swagger UI | `http://localhost:8000/api/docs/` |
| ReDoc | `http://localhost:8000/api/redoc/` |
| Esquema OpenAPI (JSON) | `http://localhost:8000/api/schema/` |

> La documentación se genera automáticamente con **drf-spectacular** a partir de las vistas y serializadores de Django REST Framework.

---


## Módulos del sistema

### Autenticación (`/usuarios/`)
| Método | Endpoint | Descripción | Autenticación |
|---|---|---|---|
| POST | `/usuarios/token/` | Inicio de sesión | No |
| POST | `/usuarios/token/refresh/` | Refrescar access token | No |
| POST | `/usuarios/logout/` | Cerrar sesión | Sí |
| GET | `/usuarios/chequeo-autenticacion/` | Verificar sesión activa | Sí |
| POST | `/usuarios/crear-usuario/` | Registro de nuevo usuario | No |

### Perfil de usuario (`/usuarios/`)
| Método | Endpoint | Descripción | Autenticación |
|---|---|---|---|
| GET | `/usuarios/mi-perfil/` | Obtener datos del perfil propio | Sí |
| PATCH | `/usuarios/mi-perfil/` | Actualizar perfil propio | Sí |
| GET | `/usuarios/perfil-usuario/` | Datos básicos de sesión | Sí |
| GET | `/usuarios/estados/` | Listar todos los estados | No |

### Administración de usuarios (`/usuarios/`)
| Método | Endpoint | Descripción | Autenticación |
|---|---|---|---|
| GET | `/usuarios/usuarios/` | Listar usuarios | Sí |
| POST | `/usuarios/usuarios/crear/` | Crear usuario | Sí |
| GET | `/usuarios/usuarios/<pk>/` | Detalle de usuario | Sí |
| PATCH | `/usuarios/usuarios/<pk>/actualizar/` | Actualizar usuario | Sí |
| PATCH | `/usuarios/usuarios/<pk>/desactivar/` | Desactivar usuario | Sí |
| PATCH | `/usuarios/usuarios/<pk>/activar/` | Activar usuario | Sí |

### Permisos y roles (`/usuarios/`)
| Método | Endpoint | Descripción | Autenticación |
|---|---|---|---|
| GET/POST | `/usuarios/vistas/` | Listar / crear vistas | Sí |
| PATCH | `/usuarios/vistas/<pk>/` | Actualizar vista | Sí |
| GET | `/usuarios/permisos-rol/` | Listar permisos por rol | Sí |
| POST | `/usuarios/permisos-rol/actualizar/` | Actualizar un permiso | Sí |
| POST | `/usuarios/permisos-rol/bulk/` | Actualización masiva de permisos | Sí |
| GET | `/usuarios/roles-permisos/` | Roles con sus permisos | Sí |

### Productos (`/productos/`)
| Método | Endpoint | Descripción | Autenticación |
|---|---|---|---|
| GET | `/productos/productos/` | Catálogo público (activos) | Sí |
| GET | `/productos/productos/<pk>/` | Detalle público de producto | No |
| GET | `/productos/mis-productos/` | Productos del usuario autenticado | Sí |
| POST | `/productos/crear-mis-productos/` | Crear producto | Sí |
| PATCH | `/productos/mis-productos/<pk>/editar/` | Editar producto | Sí |
| PATCH | `/productos/cambiar-estado-producto/<pk>/` | Activar / desactivar producto | Sí |

### Carrito, pedidos y ventas (`/ventas/`)
| Método | Endpoint | Descripción | Autenticación |
|---|---|---|---|
| GET | `/ventas/carrito/` | Ver carrito activo | Sí |
| POST | `/ventas/carrito/` | Agregar producto al carrito | Sí |
| PATCH | `/ventas/carrito/<pk>/` | Actualizar cantidad de ítem | Sí |
| DELETE | `/ventas/carrito/<pk>/` | Eliminar ítem del carrito | Sí |
| POST | `/ventas/realizar-pedido/` | Confirmar compra del carrito | Sí |
| GET | `/ventas/mis-ventas/` | Listar ventas del vendedor (filtros: `?estado`, `?fecha`) | Sí |
| PATCH | `/ventas/mis-ventas/<pk>/estado/` | Cambiar estado de una venta | Sí |
| GET | `/ventas/mis-pedidos/` | Listar pedidos del comprador (filtros: `?estado`, `?fecha`) | Sí |
| GET | `/ventas/mis-pedidos/<pk>/detalle/` | Detalles de un pedido | Sí |
