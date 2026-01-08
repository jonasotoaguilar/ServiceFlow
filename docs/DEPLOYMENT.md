# Guía de Despliegue

## Despliegue con Docker

El proyecto incluye un `Dockerfile` optimizado para producción mediante una construcción _multi-stage_ y `docker-compose`.

### Requisitos

- Docker Engine
- Docker Compose

### Pasos

1. **Configurar Variables:**
   Asegúrate de tener el archivo `.env` creado en la raíz del proyecto con las credenciales de producción (ver `docs/CONFIG.md`).

2. **Construir la imagen:**

   ```bash
   docker-compose build
   ```

3. **Iniciar el contenedor:**

   ```bash
   docker-compose up -d
   ```

   La aplicación estará disponible en el puerto **3000** (o el configurado en docker-compose).

### Dockerfile "Standalone"

El `Dockerfile` utiliza la característica "Output Standalone" de Next.js, lo que reduce drásticamente el tamaño de la imagen final copiando solo los archivos necesarios para producción.

Asegúrate de que tu `next.config.mjs` tenga activada la opción:

```js
const nextConfig = {
  output: "standalone",
  // ...
};
```

## Despliegue Manual

1. **Build:**

   ```bash
   npm run build
   ```

2. **Start:**

   ```bash
   npm run start
   ```

## Base de Datos

Antes de desplegar una nueva versión que incluya cambios en el esquema de base de datos, ejecuta las migraciones:

```bash
npx prisma migrate deploy
```
