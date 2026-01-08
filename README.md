# Sistema de Gestión de Garantías (Warranty System)

Este proyecto es una aplicación web moderna diseñada para administrar el ciclo de vida de garantías de productos. Permite registrar ingresos, gestionar estados, controlar ubicaciones y visualizar métricas clave como tiempos de espera y costos de reparación.

## 🚀 Tecnologías

El proyecto está construido con la última tecnología disponible (a fecha 2024/2025):

- **Framework Principal**: [Next.js 16](https://nextjs.org/) (Turbopack + App Router)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Interfaz (UI)**: [React 19](https://react.dev/)
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/) (Oxide Engine)
- **Base de Datos**: [PostgreSQL](https://www.postgresql.org/) (Gestionada con Prisma)
- **Autenticación**: [Appwrite](https://appwrite.io/)
- **ORM**: [Prisma 7](https://www.prisma.io/) (con **Driver Adapters** para Serverless/Edge)
- **Containerización**: [Docker](https://www.docker.com/) & Docker Compose
- **Iconos**: [Lucide React](https://lucide.dev/)
- **Manejo de Fechas**: [date-fns](https://date-fns.org/)

## 📋 Características Principales

- **Gestión de Garantías**: CRUD completo (Crear, Leer, Actualizar, Borrar) de tickets de garantía.
- **Control de Estados**:
  - `Pendiente`: Garantía ingresada y en proceso.
  - `Lista`: Producto reparado/revisado, listo para retiro.
  - `Completada`: Producto entregado al cliente (proceso cerrado).
- **Cálculo de Tiempos**: Visualización automática de días transcurridos desde el ingreso (Business Days).
- **Indicadores Visuales**: Badges de colores según la antigüedad del ticket (Verde, Naranja, Rojo).
- **Validaciones Locales**: Validaciones estrictas para RUT chileno y teléfonos (+56 9).
- **Ubicaciones**: Gestión dinámica de la ubicación física del producto (Recepción, Taller, Bodega, etc.) con historial de movimientos.
- **Búsqueda y Paginación**: Filtrado rápido por cliente, producto o número de boleta, con navegación paginada.

## 🛠️ Requisitos Previos

- [Node.js](https://nodejs.org/) (v20 o superior recomendado)
- [Docker](https://www.docker.com/) (Opcional, para despliegue containerizado)
- Instancia de [Appwrite](https://appwrite.io/) (Cloud o Self-hosted)
- Base de datos PostgreSQL

## ⚙️ Configuración del Entorno

1. **Clonar el repositorio**

   ```bash
   git clone <url-del-repositorio>
   cd warranty-system
   ```

2. **Configurar Variables de Entorno**

   Crea un archivo `.env` en la raíz del proyecto. Ver `docs/CONFIG.md` para más detalles.

   ```env
   # Database (Prisma / PostgreSQL)
   DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

   # Auth (Appwrite)
   NEXT_PUBLIC_APPWRITE_PROJECT="[PROJECT_ID]"
   NEXT_PUBLIC_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
   APPWRITE_API_KEY="[YOUR_SECRET_API_KEY]"
   ```

3. **Instalar dependencias**

   ```bash
   npm install
   ```

4. **Inicializar la Base de Datos**

   Gracias a `prisma.config.ts` (nuevo en Prisma 7), la CLI utilizará automáticamente la `DIRECT_URL` para realizar cambios en el esquema sin romper el pool de conexiones de la aplicación.

   ```bash
   npx prisma migrate dev --name init
   ```

   _(Opcional) Poblar con datos de prueba:_

   ```bash
   npx tsx prisma/seed-dummy.ts
   ```

## ▶️ Ejecución en Desarrollo

Para iniciar el servidor de desarrollo localmente (ahora usa Turbopack por defecto en Next 16):

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## 🐳 Ejecución con Docker

El proyecto incluye configuración lista para producción usando Docker.

1. **Asegúrate de tener el archivo `.env` configurado correctamente.**

2. **Construir y levantar el contenedor:**

   ```bash
   docker-compose up -d --build
   ```

   Esto iniciará la aplicación en el puerto **3000** en modo producción optimizado (Standalone).

3. **Ver logs:**

   ```bash
   docker-compose logs -f
   ```

## 📁 Estructura del Proyecto

- `/app`: Rutas y páginas de Next.js (App Router).
- `/components`: Componentes de React reutilizables (Modales, Tablas, UI Kit).
- `/lib`: Utilidades, clientes de Supabase/Prisma y lógica de negocio.
  - `prisma.ts`: Configuración del cliente Prisma con Driver Adapters (`pg`).
- `/prisma`:
  - `schema.prisma`: Definición del modelo de datos.
  - `prisma.config.ts`: Configuración de la CLI de Prisma 7.
- `/public`: Archivos estáticos.

## 🤝 Contribución

1. Hacer un fork del repositorio.
2. Crear una rama para tu feature (`git checkout -b feature/nueva-feature`).
3. Hacer commit de tus cambios (`git commit -m 'feat: agregar nueva funcionalidad'`).
4. Hacer push a la rama (`git push origin feature/nueva-feature`).
5. Abrir un Pull Request.
