# Sistema de Gestión de servicios (Service Flow)

Este proyecto es una aplicación web moderna diseñada para administrar el ciclo de vida de servicios de productos. Permite registrar ingresos, gestionar estados, controlar Sedes y visualizar métricas clave como tiempos de espera y costos de reparación.

## 🚀 Tecnologías

El proyecto está construido con la última tecnología disponible (2024/2025):

- **Framework Principal**: [Next.js 16](https://nextjs.org/) (Turbopack + App Router)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Interfaz (UI)**: [React 19](https://react.dev/)
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Base de Datos y Autenticación**: [Appwrite](https://appwrite.io/)
- **Containerización**: [Docker](https://www.docker.com/) & Docker Compose
- **Iconos**: [Lucide React](https://lucide.dev/)
- **Manejo de Fechas**: [date-fns](https://date-fns.org/)

## 📋 Características Principales

- **Gestión de servicios**: CRUD completo de tickets de servicio.
- **Control de Estados**:
  - `Pendiente`: Ingreso en taller.
  - `Reparada`: Listo para retiro.
  - `Completada`: Entregado al cliente.
  - `Cancelada`: Servicio anulado (Solo lectura).
- **Cálculo de Tiempos**: Días transcurridos (Business Days).
- **Control de Sedes**: Gestión de ubicación del producto con historial de movimientos.
- **Búsqueda y Paginación**: Filtrado por cliente, producto o número de orden.

## ⚙️ Configuración del Entorno

1. **Clonar el repositorio**

   ```bash
   git clone <url-del-repositorio>
   cd ServiceFlow
   ```

2. **Configurar Variables de Entorno**

   Crea un archivo `.env` en la raíz del proyecto:

   ```env
   NEXT_PUBLIC_APPWRITE_PROJECT="[PROJECT_ID]"
   NEXT_PUBLIC_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
   APPWRITE_API_KEY="[YOUR_SECRET_API_KEY]"
   ```

3. **Instalar dependencias**

   ```bash
   pnpm install
   ```

4. **Inicializar Appwrite**

   Ejecuta el script de configuración para crear la base de datos y colecciones necesarias:

   ```bash
   npx tsx scripts/setup-appwrite.ts
   ```

## ▶️ Ejecución en Desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`.

## 🐳 Ejecución con Docker

1. **Asegúrate de tener el archivo `.env` configurado.**

2. **Levantar el contenedor:**

   ```bash
   docker-compose up -d --build
   ```

## 📁 Estructura del Proyecto

- `/app`: Rutas y páginas de Next.js (App Router).
- `/components`: Componentes reutilizables.
- `/lib`: Clientes de Appwrite, tipos y lógica de almacenamiento.
- `/scripts`: Scripts de mantenimiento y configuración inicial.
- `/tests`: Suite de pruebas unitarias y de esquema.
