# Sistema de Gestión de servicios (Service Flow)

Este proyecto es una aplicación web moderna para administrar el ciclo de vida de servicios de productos. Permite registrar ingresos, gestionar estados, controlar Sedes y visualizar métricas como tiempos de espera y costos. El backend vivo es **PocketBase** para autenticación y datos.

## 🚀 Tecnologías

- **Framework Principal**: [Next.js 16](https://nextjs.org/) (Turbopack + App Router)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Interfaz (UI)**: [React 19](https://react.dev/)
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Base de Datos y Autenticación**: [PocketBase](https://pocketbase.io/)
- **Containerización**: [Docker](https://www.docker.com/) & Docker Compose (solo app)
- **Iconos**: [Lucide React](https://lucide.dev/)
- **Manejo de Fechas**: [date-fns](https://date-fns.org/)

## 📋 Características Principales

- **Gestión de servicios**: CRUD completo de tickets de servicio.
- **Control de Estados**: `Pendiente`, `Reparada`, `Completada`, `Cancelada` (solo lectura).
- **Cálculo de Tiempos**: Días transcurridos (Business Days).
- **Control de Sedes**: Gestión de ubicación con historial de movimientos; `address` opcional en `locations`.
- **Búsqueda y Paginación**: Filtrado por cliente, producto o número de orden con búsqueda `LIKE` (`~`) y envelope `{ data, total, page, limit }`.
- **Tenancy**: Aislamiento por `userId` + reglas de colección `userId = @request.auth.id`; ids nativos 15-char (15 caracteres, PocketBase-native).

## ⚙️ Configuración del Entorno

1. **Clonar el repositorio**

   ```bash
   git clone <url-del-repositorio>
   cd ServiceFlow
   ```

2. **Configurar Variables de Entorno**

   Crea un archivo `.env` en la raíz:

   ```env
   POCKETBASE_URL=http://127.0.0.1:8090
   ```

   - `POCKETBASE_URL` es el único locator requerido; ejemplo local `http://127.0.0.1:8090`.
   - No se commitean secretos; no hay `POCKETBASE_ADMIN_*` ni token admin en el repo.
   - La instancia local se asume ya en ejecución en `127.0.0.1:8090` (no se añade contenedor ni runbook Dokploy aquí).

3. **Instalar dependencias**

   ```bash
   pnpm install
   ```

4. **Aplicar el schema (explícito, fuera del proceso)**

   El artefacto versionado es `pocketbase/v1.collections.json` (colecciones `users`, `services`, `locations`, `location_logs`, con `address` opcional y `location_logs.userId` requerido; reglas tenant `userId = @request.auth.id`, sin filas de negocio).

   - Abre el Admin UI del PocketBase ya existente (local `http://127.0.0.1:8090/_/` o el Dokploy existente).
   - Importa `pocketbase/v1.collections.json` si la versión lo acepta; si no, transcribe campos, índices y reglas a mano. Actualiza la colección `users` existente, no crees una segunda.
   - Verifica: 4 colecciones, `address` opcional, `userId` requerido en logs, 0 filas de negocio, reglas tenant presentes, `users` create público y list/delete bloqueados.
   - `POCKETBASE_URL` se cambia en un paso separado después de verificar. No se usa API admin desde Next.js.

## ▶️ Ejecución en Desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`.

## 🐳 Ejecución con Docker

1. **Asegúrate de tener `.env` con `POCKETBASE_URL` configurado.**

2. **Levantar el contenedor de la app:**

   ```bash
   docker-compose up -d --build
   ```

   Este repo no opera PocketBase (sin binary, volumen, proxy, TLS, backup o compose de PocketBase/Dokploy).

## 📁 Estructura del Proyecto

- `/app`: Rutas y páginas de Next.js (App Router).
- `/components`: Componentes reutilizables.
- `/lib`: `pocketbase.ts` (cliente por request, `pb_auth`), `pocketbase-filter.ts` (templates `{:param}` + `pb.filter`), `env.ts` (`POCKETBASE_URL` + Zod), `auth.ts` (`getAuthUser` validado con `authRefresh`), `storage.ts` (services CRUD), `schemas.ts` (Zod), `types.ts`.
- `/pocketbase`: Artefacto `v1.collections.json`.
- `/tests`: Suite Vitest (mocks de PocketBase, sin red).

## 🔐 Autenticación y Sesión

- **Registro público**: `public self-registration` — cualquier usuario puede registrarse sin invitación; `users` create `""`.
- **Sesión**: cookie `pb_auth` con `httpOnly`, `sameSite=lax`, `path=/`, `secure` en producción, `expires` desde `exp` del JWT; valor nunca logueado. Validación server-side vía `authRefresh` antes de retornar identidad; forjada/unreachable → `null`/401 fail-closed.
- **Tenancy**: todo listado filtra `userId = {:uid}` y reglas de colección `userId = @request.auth.id`; segundo tenant no ve filas ajenas.
- **Legado**: cookie `session` (Appwrite) se ignora y se borra (`Max-Age=0`); no hay compatibilidad ni copia a `pb_auth`.

## 📦 Datos y Ciclo de Vida

- **Empty start**: este entorno PocketBase comienza vacío. Los tickets y sedes anteriores de Appwrite no aparecerán (aviso temporal en `/login` y `/register`). Sin import, sin dual-write, sin mapa de ids.
- **Ids nativos**: PocketBase genera ids nativos 15-char ids (15 caracteres, 15-character); no se pre-genera UUID ni se preserva `$id`.
- **Paginación**: `{ data, total, page, limit }` con `getList(page, perPage, { filter, sort })`; `total` desde `totalItems`; `LIKE` search (`~`) sobre `clientName`, `invoiceNumber`, `rut`; status allowlist `pending|ready|completed|cancelled`.
- **Sedes**: `address` opcional (trim, max 200, blank → omitido); `isActive` toggle; guard de borrado por historial (`location_logs`).

## 🔄 Rollback Histórico

Appwrite se dejó intacto hasta aceptación y no fue importado. En caso de falla de cutover, redesplegar la última imagen con env Appwrite previo; filas PocketBase no se copian de vuelta. La mención de Appwrite aquí es solo histórica — no configure Appwrite para trabajo nuevo ni ejecute scripts de setup de Appwrite.
