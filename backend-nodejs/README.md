# Backend Node.js - SEACE ProjectFinder

Backend completo migrado desde FastAPI (Python) a Node.js con Express.

## 📋 Stack Tecnológico

- **Runtime**: Node.js 18 (Alpine)
- **Framework Web**: Express.js
- **ORM**: Sequelize
- **Base de Datos**: PostgreSQL 15 con pgvector
- **Autenticación**: JWT + bcryptjs
- **Web Scraping**: Puppeteer
- **Logging**: Winston
- **Documentación API**: Swagger/OpenAPI
- **Validación**: express-validator

## 🎯 Características Implementadas

### ✅ Módulos Backend (100%)

1. **Autenticación y Autorización** (`/api/v1/auth`)
   - Registro de usuarios
   - Login/Logout con JWT
   - Gestión de perfil
   - Cambio de contraseña
   - Control de roles (admin/user)

2. **Procesos** (`/api/v1/procesos`)
   - CRUD completo de procesos
   - Filtros avanzados (estado, departamento, entidad, categoría)
   - Búsqueda por texto
   - Estadísticas y métricas
   - Paginación

3. **Recomendaciones** (`/api/v1/recomendaciones`)
   - Generación de recomendaciones por proceso
   - MVP, Sprint 1, Stack Tecnológico
   - Gestión de visibilidad
   - Limpieza de recomendaciones

4. **Chatbot** (`/api/v1/chatbot`)
   - Procesamiento de consultas
   - Validación de queries
   - Historial de sesiones
   - Sugerencias de consultas
   - Estadísticas de uso

5. **Dashboard** (`/api/v1/dashboard`)
   - Vista general de métricas
   - Análisis por estado y departamento
   - Tendencias temporales
   - Top rubros
   - Actividad de usuarios y ETL

6. **Administración** (`/api/v1/admin`)
   - Gestión de usuarios
   - Configuración del sistema (key-value store)
   - Estadísticas del sistema
   - Tareas de mantenimiento

7. **ETL** (`/api/v1/etl`)
   - Orquestación de scraping
   - Gestión de tareas de scraping
   - Logs de operaciones ETL
   - Sincronización de procesos
   - Generación de embeddings

### ✅ Infraestructura

- **11 Modelos** de base de datos con relaciones
- **7 Servicios** con lógica de negocio
- **7 Controladores** con manejo de requests
- **7 Archivos de rutas** con documentación Swagger
- **Middlewares**: Autenticación, autorización, manejo de errores
- **Configuración**: Variables de entorno, logging, database
- **Docker**: Dockerfile optimizado + docker-compose
- **Scripts**: Inicialización de usuarios, migraciones

## 📁 Estructura del Proyecto

```
backend-nodejs/
├── src/
│   ├── config/
│   │   ├── index.js          # Configuración general
│   │   ├── database.js       # Sequelize setup
│   │   └── logger.js         # Winston logger
│   ├── models/
│   │   ├── User.js
│   │   ├── Proceso.js
│   │   ├── ProcesoEmbedding.js
│   │   ├── Anexo.js
│   │   ├── Recomendacion.js
│   │   ├── Preferencia.js
│   │   ├── UserInteraction.js
│   │   ├── ScrapingTask.js
│   │   ├── ChatbotLog.js
│   │   ├── Configuracion.js
│   │   ├── ETLLog.js
│   │   └── index.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── procesosService.js
│   │   ├── recomendacionesService.js
│   │   ├── chatbotService.js
│   │   ├── dashboardService.js
│   │   ├── adminService.js
│   │   └── etlService.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── procesosController.js
│   │   ├── recomendacionesController.js
│   │   ├── chatbotController.js
│   │   ├── dashboardController.js
│   │   ├── adminController.js
│   │   └── etlController.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── auth.js
│   │   ├── procesos.js
│   │   ├── recomendaciones.js
│   │   ├── chatbot.js
│   │   ├── dashboard.js
│   │   ├── admin.js
│   │   └── etl.js
│   ├── middlewares/
│   │   ├── auth.js            # JWT verification + role checking
│   │   ├── error.js           # Error handlers
│   │   └── index.js
│   ├── scraper/
│   │   └── SeaceScraper.js    # Puppeteer scraper
│   ├── utils/
│   │   ├── helpers.js         # Funciones auxiliares
│   │   └── index.js
│   ├── scripts/
│   │   ├── migrate.js         # Sincronización de modelos
│   │   └── init-users.js      # Usuarios iniciales
│   └── server.js              # Punto de entrada
├── logs/                      # Logs de aplicación
├── Dockerfile
├── start.sh
├── package.json
└── README.md
```

## 🚀 Instalación y Uso

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar migraciones
npm run migrate

# Crear usuarios iniciales
npm run init-users

# Iniciar servidor
npm run dev
```

### Docker

```bash
# Construir y levantar servicios
docker-compose up --build

# Solo backend
docker-compose up backend-nodejs
```

## 🔌 Endpoints Principales

### Autenticación
- `POST /api/v1/auth/register` - Registrar usuario
- `POST /api/v1/auth/login` - Iniciar sesión
- `GET /api/v1/auth/me` - Perfil actual
- `PUT /api/v1/auth/me` - Actualizar perfil
- `PUT /api/v1/auth/me/password` - Cambiar contraseña

### Procesos
- `GET /api/v1/procesos` - Listar procesos (filtros + paginación)
- `GET /api/v1/procesos/:id` - Detalle de proceso
- `GET /api/v1/procesos/search/text` - Búsqueda textual
- `GET /api/v1/procesos/stats/overview` - Estadísticas

### Recomendaciones
- `GET /api/v1/recomendaciones/:proceso_id` - Obtener recomendaciones
- `POST /api/v1/recomendaciones/:proceso_id/generate` - Generar nuevas
- `DELETE /api/v1/recomendaciones/:proceso_id/clear` - Limpiar

### Chatbot
- `POST /api/v1/chatbot/query` - Consulta al chatbot
- `GET /api/v1/chatbot/suggestions` - Sugerencias
- `GET /api/v1/chatbot/session/:id/history` - Historial

### Dashboard
- `GET /api/v1/dashboard/overview` - Vista general
- `GET /api/v1/dashboard/by-estado` - Por estado
- `GET /api/v1/dashboard/trends` - Tendencias

### Admin
- `GET /api/v1/admin/users` - Gestión de usuarios
- `GET /api/v1/admin/config` - Configuración del sistema
- `GET /api/v1/admin/stats/system` - Estadísticas del sistema

### ETL
- `POST /api/v1/etl/scraping/start` - Iniciar scraping
- `GET /api/v1/etl/scraping/tasks` - Tareas de scraping
- `GET /api/v1/etl/logs` - Logs de ETL
- `POST /api/v1/etl/sync` - Sincronizar procesos

## 📖 Documentación API

Acceder a Swagger UI en: `http://localhost:8000/api-docs`

## 🔐 Variables de Entorno

```bash
# Servidor
NODE_ENV=development
PORT=8000
HOST=0.0.0.0

# Base de datos
DB_HOST=postgres
DB_PORT=5432
DB_NAME=seace_db
DB_USER=postgres
DB_PASSWORD=postgres123

# JWT
JWT_SECRET=tu_secreto_super_seguro
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info

# Scraping
CHROME_BIN=/usr/bin/chromium-browser
SCRAPING_TIMEOUT=60000
SCRAPING_MAX_RETRIES=3
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Con coverage
npm run test:coverage
```

## 📊 Monitoreo y Logs

Los logs se almacenan en el directorio `logs/`:
- `combined.log` - Todos los logs
- `error.log` - Solo errores

Configuración en `src/config/logger.js`

## 🔄 Migración desde FastAPI

### Equivalencias

| FastAPI | Node.js |
|---------|---------|
| Pydantic | express-validator |
| SQLAlchemy | Sequelize |
| Argon2 | bcryptjs |
| NodeJs  |
| Selenium | Puppeteer |
| Uvicorn | Express |

### Cambios Principales

1. **Rutas**: `/api/v1/*` en ambos
2. **Autenticación**: Bearer token JWT en ambos
3. **Modelos**: Estructura equivalente con Sequelize
4. **Respuestas**: Mismo formato JSON
5. **Códigos HTTP**: Idénticos
6. **Validación**: express-validator replica Pydantic schemas

## 🛠️ Comandos Útiles

```bash
# Verificar sintaxis
node -c src/server.js

# Ver logs en tiempo real
tail -f logs/combined.log

# Ejecutar migraciones
npm run migrate

# Crear usuario admin
npm run init-users

# Linter
npm run lint
```

## 🚨 Troubleshooting

### Error de conexión a PostgreSQL
```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps

# Verificar variables de entorno
echo $DB_HOST
```

### Error con Puppeteer
```bash
# Instalar dependencias de Chromium (Alpine)
apk add chromium chromium-chromedriver
```

### Token JWT expirado
```bash
# Ajustar tiempo de expiración en .env
JWT_EXPIRES_IN=7d
```

## 📝 Notas de Desarrollo

- Los embeddings usan pgvector (requiere extensión instalada)
- El scraper usa Puppeteer en modo headless
- La autenticación es stateless con JWT
- Logs rotan automáticamente

## 🎯 Estado de Migración

✅ **Backend Node.js: 100%**
- Todos los endpoints implementados
- Paridad funcional con FastAPI
- Documentación Swagger completa
- Middlewares de seguridad
- Sistema de logging robusto

🔜 **Pendientes**:
- Adaptación completa del frontend
- Tests de integración
- Despliegue en producción

## 👥 Contribuidores

SEACE ProjectFinder Team

## 📄 Licencia

ISC