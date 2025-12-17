# Sistema de Gestión de Garantías (Warranty System)

Este proyecto es una aplicación web moderna diseñada para administrar el ciclo de vida de garantías de productos. Permite registrar ingresos, gestionar estados, controlar ubicaciones y visualizar métricas clave como tiempos de espera y costos de reparación.

## 🚀 Tecnologías

El proyecto está construido con un stack tecnológico moderno y robusto:

- **Framework Principal**: [Next.js 14](https://nextjs.org/) (App Router)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Base de Datos**: [PostgreSQL](https://www.postgresql.org/) (vía [Supabase](https://supabase.com/))
- **ORM**: [Prisma](https://www.prisma.io/)
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
- **Validaciones Locales**: Formateo y validación de RUT chileno y teléfonos.
- **Ubicaciones**: Gestión dinámica de la ubicación física del producto (Recepción, Taller, Bodega, etc.).
- **Búsqueda y Paginación**: Filtrado rápido por cliente, producto o número de boleta, con navegación paginada.

## 🛠️ Requisitos Previos

- [Node.js](https://nodejs.org/) (v18 o superior)
- [Docker](https://www.docker.com/) (Opcional, para despliegue containerizado)
- Cuenta en [Supabase](https://supabase.com/) (o instancia local de Supabase)

## ⚙️ Configuración del Entorno

1.  **Clonar el repositorio**

    ```bash
    git clone <url-del-repositorio>
    cd warranty-system
    ```

2.  **Configurar Variables de Entorno**

    Crea un archivo `.env` en la raíz del proyecto. Puedes usar el siguiente template:

    ```env
    # Conexión a Base de Datos (Supabase Transaction Pooler recomendado para Serverless/Docker)
    DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/[DB_NAME]?pgbouncer=true"

    # URL Directa (Para migraciones)
    DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/[DB_NAME]"

    # Supabase Auth & Public
    NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-ID].supabase.co"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
    ```

3.  **Instalar dependencias**

    ```bash
    npm install
    ```

4.  **Inicializar la Base de Datos**

    Sincroniza el esquema de Prisma con tu base de datos en Supabase:

    ```bash
    npx prisma migrate dev --name init
    ```

    _(Opcional) Poblar con datos de prueba:_

    ```bash
    npx tsx prisma/seed-dummy.ts
    ```

## ▶️ Ejecución en Desarrollo

Para iniciar el servidor de desarrollo localmente:

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## 🐳 Ejecución con Docker

El proyecto incluye configuración lista para producción usando Docker.

1.  **Asegúrate de tener el archivo `.env` configurado correctamente.**

2.  **Construir y levantar el contenedor:**

    ```bash
    docker-compose up -d --build
    ```

    Esto iniciará la aplicación en el puerto **3000** en modo producción optimizado (Standalone).

3.  **Ver logs:**
    ```bash
    docker-compose logs -f
    ```

## 📁 Estructura del Proyecto

- `/app`: Rutas y páginas de Next.js (App Router).
- `/components`: Componentes de React reutilizables (Modales, Tablas, UI Kit).
- `/lib`: Utilidades, clientes de Supabase/Prisma y helpers.
- `/prisma`: Esquema de base de datos (`schema.prisma`) y scripts de seed.
- `/public`: Archivos estáticos.

## 🤝 Contribución

1.  Hacer un fork del repositorio.
2.  Crear una rama para tu feature (`git checkout -b feature/nueva-feature`).
3.  Hacer commit de tus cambios (`git commit -m 'feat: agregar nueva funcionalidad'`).
4.  Hacer push a la rama (`git push origin feature/nueva-feature`).
5.  Abrir un Pull Request.
