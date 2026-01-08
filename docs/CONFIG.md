# Guía de Configuración

## Variables de Entorno

El proyecto requiere las siguientes variables de entorno para funcionar correctamente.

### Base de Datos (PostgreSQL / Prisma)

El proyecto utiliza Prisma con Adaptadores para PostgreSQL. Se recomienda usar un servicio compatible con connection pooling (como Supabase Transaction Pooler) para producción.

```env
# URL de conexión principal para la aplicación (Pooling habilitado puerto 6543 en Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true"

# URL de conexión directa para migraciones (Puerto 5432)
DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

### Autenticación (Appwrite)

El sistema utiliza Appwrite para la gestión de identidad y usuarios.

```env
# ID del Proyecto en Appwrite
NEXT_PUBLIC_APPWRITE_PROJECT="[PROJECT_ID]"

# Endpoint de la API de Appwrite
NEXT_PUBLIC_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"

# API Key de Appwrite (Server-side)
# Debe tener permisos para gestionar usuarios (users.read, users.write, etc.)
APPWRITE_API_KEY="[YOUR_SECRET_API_KEY]"
```

### Configuración General

```env
# Entorno (development, production)
NODE_ENV="development"
```
