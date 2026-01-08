# Arquitectura del Sistema

## Visión General

El sistema sigue una arquitectura moderna, basada en componentes reutilizables y servicios en la nube para maximizar la escalabilidad y minimizar el mantenimiento.

## Stack Tecnológico

### Frontend (Next.js 16)

- **App Router**: Manejo de rutas y layouts anidados.
- **React Server Components (RSC)**: La mayoría de las páginas se renderizan en el servidor para mejor rendimiento.
- **Client Components**: Usados solo donde se requiere interactividad (formularios, modales, dashboards dinámicos).
- **Tailwind CSS v4**: Estilizado utility-first con motor Oxide para compilación instantánea.

### Backend (Serverless / Edge)

- **Server Actions**: La lógica de mutación de datos (crear garantías, actualizar estados) reside en `app/actions`, ejecutándose en el servidor sin necesidad de API routes tradicionales.
- **API Routes**: Usado para endpoints específicos que requieren compatibilidad REST o webhooks.

### Persistencia de Datos

- **PostgreSQL**: Base de datos relacional principal.
- **Prisma ORM**: Capa de abstracción de datos.
  - Se conecta a Postgres mediante **Driver Adapters** (`@prisma/adapter-pg`) para soportar entornos serverless y edge.
- **Appwrite**:
  - **Auth**: Gestión de usuarios y sesiones.
  - El cliente de Appwrite se inicializa en el servidor (`lib/appwrite.ts`) para validar sesiones.

## Flujo de Datos

1. **Ingreso**: El usuario llena un formulario en el Dashboard.
2. **Validación**: Validación en cliente (HTML5/React) y servidor (Zod/Tipos manuales).
3. **Procesamiento**: Server Action recibe `FormData`.
   - Verifica sesión con Appwrite.
   - Escribe en Postgres vía Prisma.
4. **Respuesta**: Revalida el path (`revalidatePath`) para actualizar la UI sin recargar.
