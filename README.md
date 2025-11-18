# SEACE ProjectFinder

**Transforma procesos de contratación pública del Estado Peruano (SEACE) en oportunidades comerciales de software mediante inteligencia artificial.**

---

## Arquitectura Técnica

SEACE ProjectFinder es una aplicación full-stack dockerizada compuesta por tres servicios principales: una base de datos **PostgreSQL 15** con extensión **pgvector** para búsquedas vectoriales semánticas, un backend en **Node.js con Express** que expone una API RESTful estructurada en 7 módulos funcionales, y un frontend en **React con Vite** optimizado para experiencias de usuario ágiles y responsivas.

El sistema opera bajo una arquitectura de microservicios coordinados mediante Docker Compose, garantizando portabilidad, escalabilidad y facilidad de despliegue tanto en entornos cloud como on-premise.

---

## Flujo de Datos End-to-End

1. **Extracción Automatizada (ETL)**  
   Un orquestador ejecuta tareas de scraping parametrizables sobre el portal oficial SEACE utilizando **Puppeteer** en modo headless. Navega dinámicamente aplicando filtros por año, objeto de contratación, entidad, fechas y tipo de proceso. Extrae datos estructurados de tablas HTML, incluyendo nomenclatura, entidad convocante, objeto, estado, monto referencial, ubicación geográfica y enlaces a documentos.

2. **Transformación y Normalización**  
   Los datos crudos se limpian, normalizan (fechas ISO 8601, montos numéricos, monedas detectadas) y enriquecen con metadatos OCDS. Se aplica estrategia de **upsert** por `id_proceso` para evitar duplicados y actualizar cambios en procesos existentes.

3. **Generación de Embeddings Semánticos**  
   Título y descripción de cada proceso se convierten en vectores de **768 dimensiones** mediante **Google Gemini**. Los embeddings se almacenan en la tabla `proceso_embeddings` con índices **IVFFlat** para búsquedas de similitud coseno de alta eficiencia.

4. **Recomendaciones Inteligentes por IA**  
   Cada proceso es analizado mediante prompts especializados a Gemini para generar tres entregables estratégicos:  
   - **MVP**: Alcance mínimo viable, módulos core, tecnologías base, estimación de esfuerzo y riesgos.  
   - **Sprint 1**: Plan incremental de 2 semanas con historias de usuario, tareas técnicas, criterios de aceptación y hitos.  
   - **Stack Tecnológico**: Arquitectura propuesta, lenguajes, frameworks, bases de datos, patrones de diseño y cumplimiento normativo.

5. **Búsqueda y Recuperación Semántica (RAG)**  
   El chatbot procesa consultas en lenguaje natural, valida pertenencia al dominio de contratación pública, ejecuta búsquedas vectoriales sobre embeddings, recupera los 5 procesos más relevantes y construye contexto enriquecido para generar respuestas conversacionales con citas verificables.

6. **Agregación Analítica en Tiempo Real**  
   El dashboard consolida métricas actualizadas: distribución por estado, análisis geográfico, tendencias temporales, ranking de rubros y monitoreo de actividad ETL.

---

## Componentes Clave del Stack Tecnológico

### Backend (Node.js + Express)
- **Enrutamiento y middlewares**: Express.js, CORS, Helmet, Morgan  
- **ORM**: Sequelize con 11 entidades relacionales  
- **Autenticación**: JWT stateless + bcryptjs  
- **Validación**: express-validator  
- **Scraping**: Puppeteer con manejo de paginación y reintentos  
- **IA Generativa**: Google Generative AI SDK (Gemini 1.5 Flash)  
- **Logging**: Winston con rotación de archivos  
- **Documentación API**: Swagger OpenAPI 3.0  

### Frontend (React 18 + Vite)
- **Navegación**: React Router  
- **Estilos**: TailwindCSS (diseño responsivo)  
- **Comunicación HTTP**: Axios  
- **Visualización de datos**: Recharts  
- **Gestión de estado**: Hooks personalizados (useAuth, usePreferences)  
- **Protección de rutas**: ProtectedRoute con validación de roles  

### Base de Datos (PostgreSQL 15)
- 11 tablas con relaciones normalizadas  
- Índices optimizados para búsquedas full-text y vectoriales  
- Políticas de retención y auditoría de logs  

---

## Funcionalidades Principales

### Autenticación y Autorización Multi-Rol
- Registro con validación de email único  
- Login con JWT (24h vigencia) y refresh tokens  
- Roles: **admin** (acceso total) y **usuario regular** (lectura)  
- Gestión de perfil y cambio seguro de contraseña  

### Catálogo Inteligente de Procesos
- Búsqueda avanzada con filtros combinados (estado, departamento, entidad, categoría, monto, fechas)  
- Tabla responsiva con ordenamiento y paginación server-side  
- Vista detallada con metadatos OCDS completos  
- Exportación a CSV/JSON  
- Estadísticas agregadas por búsqueda  

### Recomendaciones Automáticas por IA
- Generación de MVP, Sprint 1 y Stack Tecnológico  
- Asignación algorítmica de scores de relevancia  
- Actualización en tiempo real  
- Limpieza selectiva de recomendaciones obsoletas  

### Chatbot Conversacional con RAG
- Procesamiento de lenguaje natural  
- Validación de dominio (SEACE, licitación, software, etc.)  
- Búsqueda semántica sobre embeddings  
- Respuestas con citas a procesos originales  
- Registro de interacciones por `session_id`  
- Soporte a consultas complejas con filtros implícitos  

### Orquestador ETL Robusto
- Tareas parametrizables y programables  
- Manejo de paginación, reintentos exponenciales y timeouts  
- Logging detallado (duración, errores, procesos extraídos)  
- Generación batch de embeddings respetando rate limits  
- Estados de tarea: pending, running, completed, failed  

### Dashboard Analítico Interactivo
- KPIs principales: total procesos, monto acumulado, tasa de actualización  
- Gráficos: dona (estados), barras (departamentos), líneas (tendencias)  
- Ranking de rubros más demandados  
- Monitoreo de scraping en tiempo real  

### Panel de Administración (Solo Admin)
- Gestión completa de usuarios (CRUD, activación, reset de contraseña)  
- Configuración del sistema (key-value store persistente)  
- Estadísticas de salud de BD y API  
- Tareas de mantenimiento (limpieza de logs, optimización de índices)  

---

## Funcionalidades Secundarias

- **Logging estructurado** con niveles y rotación de archivos  
- **Documentación interactiva** de API en `/api-docs`  
- **Manejo centralizado de errores** con códigos HTTP estándar  
- **Validación estricta de entradas** con sanitización  
- **Health checks** en `/api/v1/health`  
- **CORS configurado**, compresión de respuestas, rate limiting  
- **Soporte multiusuario concurrente** y auditoría completa  

---

## Datos para Ventas

### Público Objetivo
- **Empresas de desarrollo de software y consultoría TI** que participan en licitaciones públicas  
- **Integradores, revendedores y fabricantes de tecnología** que buscan clientes en el sector público  
- **Consultores independientes y pymes tecnológicas** sin equipos de inteligencia comercial  
- **Departamentos de inteligencia de negocios** de corporaciones TI  
- **Gerentes de preventa y comerciales** enfocados en cierre de oportunidades públicas  

### Industrias y Nichos Específicos
- Desarrollo de software a medida para entidades gubernamentales  
- Implementación de ERP/CRM en sector público  
- Transformación digital y gobierno electrónico  
- Business intelligence y analítica de datos  
- Infraestructura TI (servidores, redes, cloud)  
- Ciberseguridad (SOC, SIEM, cumplimiento)  
- Licenciamiento empresarial y consultoría de madurez digital  

### Beneficios Competitivos
- **IA generativa especializada** en contratación pública peruana (sin competidor directo)  
- **Recomendaciones técnicas accionables** (MVP, Sprint 1, Stack) vs. solo listados  
- **Reducción del ciclo de preventa** de semanas a días  
- **Democratización de inteligencia comercial** para pymes  
- **Catálogo actualizado diariamente** sin intervención manual  
- **Búsqueda semántica** que entiende intención, no solo keywords  
- **Arquitectura escalable Docker** (on-premise o cloud)  
- **Cumplimiento de seguridad y auditoría**  

### Casos de Uso Reales
1. **Empresa de software custom**: Monitorea licitaciones diarias, recibe alertas, analiza bases en 5 minutos, genera propuesta técnica con IA → **+40% en tasa de conversión**.  
2. **Integrador cloud**: Identifica entidades con alto gasto en TI, contacta proactivamente → **contrato marco de 2M soles**.  
3. **Consultor independiente**: De 2-3 oportunidades/semana a 10 diarias con fit técnico → **tasa de adjudicación de 5% a 12%**.  
4. **Corporación TI**: Detecta crecimiento 300% en adopción cloud → **pipeline proyectado de 50M soles**.  
5. **Startup de ciberseguridad**: Encuentra 23 procesos con requerimientos SOC/SIEM → adapta propuesta y destaca skills clave.  

### Métricas de Impacto Potencial
| Métrica | Impacto |
|--------|--------|
| Ahorro de tiempo en prospección | **85%** (de 4h a 30min por proceso) |
| Tasa de conversión (oportunidad → propuesta) | **+60%** |
| Tasa de adjudicación final | **+40%** |
| ROI estimado (1er año) | **300%** |
| Payback period | **4 meses** |
| Expansión de mercado direccionable | **+45%** |
| Reducción en onboarding de comerciales | **70%** |
| Precisión en forecasting comercial | **+50%** |

### Argumentos Persuasivos para Cierre de Ventas
- **Única solución integral con IA especializada** en licitaciones TI peruanas  
- **Primer mover** con algoritmos entrenados en regulaciones y lenguaje local  
- **Casos de éxito documentados**: clientes early adopters con **+35% en ingresos públicos**  
- **Prueba gratuita 30 días** + suscripción mensual sin permanencia  
- **Urgencia competitiva**: cada día sin el sistema = oportunidades perdidas  
- **Escalabilidad probada**: desde freelancer hasta corporación con 100+ usuarios  
- **Soporte 5x8 con SLA 4h** y actualizaciones sin downtime  

---

**SEACE ProjectFinder no es solo un buscador. Es tu ventaja competitiva en el mercado de contratación pública TI del Perú.**