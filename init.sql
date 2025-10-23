-- Inicialización completa de la base de datos para SEACE ProjectFinder
-- Fecha: 22 de octubre de 2025
-- ÚNICA FUENTE DE VERDAD para el esquema de la base de datos
-- Este script crea TODAS las tablas con todas las columnas necesarias desde el inicio
-- NO usar archivos migrate-*.sql; modificar este archivo directamente si hay cambios

-- Instalación de extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Tabla para usuarios del sistema
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(128) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'guest',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Insertar usuarios iniciales con contraseñas hasheadas
-- Contraseña: admin123 -> hash generado con bcrypt
INSERT INTO users (username, email, hashed_password, full_name, role) VALUES
('admin', 'admin@seaceprojectfinder.com', '$2a$10$IAmBGWJ3mVMKXkIUbvTmQexURArb.mm2kd6ZdKDJV.Vx9o7M6VBQa', 'Administrador del Sistema', 'admin'),
('guest', 'user@seaceprojectfinder.com', '$2a$10$IAmBGWJ3mVMKXkIUbvTmQeR9b37zMersIFWtGNgofB1qYxnoE.VLa', 'Usuario Invitado', 'guest')
ON CONFLICT (username) DO NOTHING;

-- Tabla para almacenar procesos SEACE (con todas las columnas del modelo Sequelize)
CREATE TABLE IF NOT EXISTS procesos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_proceso VARCHAR(255) UNIQUE NOT NULL,
    url_proceso TEXT,
    numero_convocatoria VARCHAR(255),
    entidad_nombre VARCHAR(500),
    entidad_ruc VARCHAR(11),
    objeto_contratacion TEXT,
    descripcion_objeto TEXT,
    nomenclatura VARCHAR(255),
    nombre_entidad VARCHAR(500),
    reiniciado_desde VARCHAR(255),
    codigo_snip VARCHAR(50),
    codigo_cui VARCHAR(50),
    version_seace VARCHAR(10) DEFAULT '3',
    source_url TEXT,
    pagina_scraping TEXT,
    fecha_scraping TIMESTAMP,
    tipo_proceso VARCHAR(100),
    estado_proceso VARCHAR(100),
    fecha_publicacion TIMESTAMP,
    fecha_limite_presentacion TIMESTAMP,
    monto_referencial DECIMAL(15,2),
    moneda VARCHAR(10),
    rubro VARCHAR(200),
    departamento VARCHAR(100),
    provincia VARCHAR(100),
    distrito VARCHAR(100),
    requiere_visita_previa BOOLEAN DEFAULT FALSE,
    datos_ocds JSONB,
    fecha_extraccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    procesado_nlp BOOLEAN DEFAULT FALSE,
    complejidad_estimada VARCHAR(50),
    categoria_proyecto VARCHAR(100)
);

-- Tabla para almacenar embeddings vectoriales para RAG
CREATE TABLE IF NOT EXISTS proceso_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proceso_id UUID REFERENCES procesos(id) ON DELETE CASCADE,
    embedding_titulo FLOAT[],
    embedding_descripcion FLOAT[],
    embedding_combined FLOAT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para almacenar anexos y documentos
CREATE TABLE IF NOT EXISTS anexos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proceso_id UUID REFERENCES procesos(id) ON DELETE CASCADE,
    nombre_archivo VARCHAR(255),
    url_descarga TEXT,
    tipo_documento VARCHAR(100),
    tamaño_kb INTEGER,
    fecha_subida TIMESTAMP,
    procesado BOOLEAN DEFAULT FALSE,
    contenido_extraido TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para almacenar recomendaciones generadas por IA
CREATE TABLE IF NOT EXISTS recomendaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    proceso_id UUID NOT NULL REFERENCES procesos(id) ON DELETE CASCADE,
    score FLOAT,
    visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, proceso_id)
);

-- Tabla para almacenar preferencias de usuario
CREATE TABLE IF NOT EXISTS preferencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    keywords TEXT[],
    embedding FLOAT[],
    profile_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Tabla para almacenar interacciones usuario-proceso
CREATE TABLE IF NOT EXISTS user_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    proceso_id UUID NOT NULL REFERENCES procesos(id) ON DELETE CASCADE,
    tipo_interaccion VARCHAR(50) NOT NULL,
    valor FLOAT,
    metadatos JSONB DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para almacenar tareas de scraping
CREATE TABLE IF NOT EXISTS scraping_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    params JSONB,
    result JSONB,
    error TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para logs de consultas al chatbot
CREATE TABLE IF NOT EXISTS chatbot_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255),
    user_query TEXT,
    ai_response TEXT,
    relevant_processes UUID[], -- Array de IDs de procesos relacionados
    response_time_ms INTEGER,
    model_used VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para configuración del sistema
CREATE TABLE IF NOT EXISTS configuracion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descripcion TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para logs de operaciones ETL
CREATE TABLE IF NOT EXISTS etl_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_type VARCHAR(50) NOT NULL,
    operation_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'running',
    message TEXT,
    details JSONB,
    process_count INTEGER,
    error_count INTEGER,
    duration_ms INTEGER,
    search_params JSONB,
    max_processes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar configuraciones iniciales
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('last_osce_sync', '2024-01-01 00:00:00', 'Última sincronización con datos OSCE'),
('etl_batch_size', '100', 'Tamaño de lote para procesamiento ETL'),
('gemini_model', 'gemini-2.5-flash', 'Modelo Gemini utilizado'),
('embedding_model', 'text-embedding-004', 'Modelo para generar embeddings'),
('scraping_timeout', '60000', 'Timeout para operaciones de scraping (ms)'),
('scraping_max_retries', '3', 'Número máximo de reintentos para scraping'),
('default_search_year', '2025', 'Año por defecto para búsquedas'),
('default_search_object', 'bien', 'Objeto de contratación por defecto')
ON CONFLICT (clave) DO NOTHING;

-- Índices para tabla users
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Índices para optimizar consultas (todos los índices del modelo Sequelize)
CREATE INDEX IF NOT EXISTS idx_procesos_estado ON procesos(estado_proceso);
CREATE INDEX IF NOT EXISTS idx_procesos_fecha_pub ON procesos(fecha_publicacion);
CREATE INDEX IF NOT EXISTS idx_procesos_rubro ON procesos(rubro);
CREATE INDEX IF NOT EXISTS idx_procesos_monto ON procesos(monto_referencial);
CREATE INDEX IF NOT EXISTS idx_procesos_id_proceso ON procesos(id_proceso);
CREATE INDEX IF NOT EXISTS idx_proceso_nomenclatura ON procesos(nomenclatura);
CREATE INDEX IF NOT EXISTS idx_proceso_nombre_entidad ON procesos(nombre_entidad);
CREATE INDEX IF NOT EXISTS idx_proceso_codigo_snip ON procesos(codigo_snip);
CREATE INDEX IF NOT EXISTS idx_proceso_codigo_cui ON procesos(codigo_cui);
CREATE INDEX IF NOT EXISTS idx_proceso_fecha_scraping ON procesos(fecha_scraping);
CREATE INDEX IF NOT EXISTS idx_proceso_tipo ON procesos(tipo_proceso);
CREATE INDEX IF NOT EXISTS idx_proceso_departamento ON procesos(departamento);
CREATE INDEX IF NOT EXISTS idx_proceso_provincia ON procesos(provincia);
CREATE INDEX IF NOT EXISTS idx_proceso_distrito ON procesos(distrito);

-- Índices para tablas relacionadas
CREATE INDEX IF NOT EXISTS idx_embeddings_proceso_id ON proceso_embeddings(proceso_id);
CREATE INDEX IF NOT EXISTS idx_anexos_proceso_id ON anexos(proceso_id);
CREATE INDEX IF NOT EXISTS idx_anexos_tipo ON anexos(tipo_documento);
CREATE INDEX IF NOT EXISTS idx_recomendaciones_user ON recomendaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_recomendaciones_proceso ON recomendaciones(proceso_id);
CREATE INDEX IF NOT EXISTS idx_recomendaciones_unique ON recomendaciones(user_id, proceso_id);
CREATE INDEX IF NOT EXISTS idx_preferencia_user ON preferencias(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_proceso ON user_interactions(proceso_id);
CREATE INDEX IF NOT EXISTS idx_interactions_tipo ON user_interactions(tipo_interaccion);
CREATE INDEX IF NOT EXISTS idx_scraping_tasks_status ON scraping_tasks(status);
CREATE INDEX IF NOT EXISTS idx_scraping_tasks_type ON scraping_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_session ON chatbot_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_etl_logs_operation ON etl_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_etl_logs_status ON etl_logs(status);

-- Índice vectorial para búsquedas de similitud
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON proceso_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Función para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION update_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en users
CREATE TRIGGER trigger_update_users_fecha
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_actualizacion();

CREATE TRIGGER trigger_update_procesos_fecha
    BEFORE UPDATE ON procesos
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_actualizacion();

-- Trigger para actualizar updated_at en configuracion
CREATE TRIGGER trigger_update_configuracion_fecha
    BEFORE UPDATE ON configuracion
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_actualizacion();

-- Trigger para actualizar updated_at en etl_logs
CREATE TRIGGER trigger_update_etl_logs_fecha
    BEFORE UPDATE ON etl_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_actualizacion();

-- Función para logging automático de operaciones ETL
CREATE OR REPLACE FUNCTION log_etl_operation(
    op_type VARCHAR(50),
    op_id VARCHAR(255),
    msg TEXT DEFAULT NULL,
    det JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO etl_logs (operation_type, operation_id, message, details)
    VALUES (op_type, op_id, msg, det)
    RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar estado de ETL
CREATE OR REPLACE FUNCTION update_etl_status(
    log_id UUID,
    new_status VARCHAR(20),
    msg TEXT DEFAULT NULL,
    proc_count INTEGER DEFAULT NULL,
    err_count INTEGER DEFAULT NULL,
    duration INTEGER DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE etl_logs
    SET
        status = new_status,
        message = COALESCE(msg, message),
        process_count = COALESCE(proc_count, process_count),
        error_count = COALESCE(err_count, error_count),
        duration_ms = COALESCE(duration, duration_ms),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = log_id;
END;
$$ LANGUAGE plpgsql;

-- Vista para estadísticas de procesos
CREATE OR REPLACE VIEW procesos_estadisticas AS
SELECT
    COUNT(*) as total_procesos,
    COUNT(CASE WHEN estado_proceso = 'Publicado' THEN 1 END) as procesos_publicados,
    COUNT(CASE WHEN estado_proceso = 'Cerrado' THEN 1 END) as procesos_cerrados,
    COUNT(CASE WHEN procesado_nlp = true THEN 1 END) as procesos_procesados_nlp,
    AVG(monto_referencial) as monto_promedio,
    MIN(fecha_publicacion) as fecha_primera_publicacion,
    MAX(fecha_publicacion) as fecha_ultima_publicacion,
    COUNT(DISTINCT departamento) as departamentos_cubiertos,
    COUNT(DISTINCT rubro) as rubros_diferentes
FROM procesos;

-- Vista para procesos recientes (últimos 30 días)
CREATE OR REPLACE VIEW procesos_recientes AS
SELECT
    id,
    id_proceso,
    nombre_entidad,
    objeto_contratacion,
    descripcion_objeto,
    monto_referencial,
    moneda,
    fecha_publicacion,
    estado_proceso,
    fecha_scraping
FROM procesos
WHERE fecha_publicacion >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY fecha_publicacion DESC;

-- Comentarios en las tablas para documentación
COMMENT ON TABLE users IS 'Usuarios del sistema con roles de autenticación';
COMMENT ON TABLE procesos IS 'Tabla principal que almacena todos los procesos de contratación pública del SEACE';
COMMENT ON TABLE proceso_embeddings IS 'Embeddings vectoriales para búsquedas semánticas y RAG';
COMMENT ON TABLE anexos IS 'Documentos y anexos asociados a los procesos de contratación';
COMMENT ON TABLE recomendaciones IS 'Recomendaciones de procesos por usuario basadas en preferencias';
COMMENT ON TABLE preferencias IS 'Preferencias de búsqueda y perfil de cada usuario';
COMMENT ON TABLE user_interactions IS 'Registro de todas las interacciones usuario-proceso';
COMMENT ON TABLE scraping_tasks IS 'Gestión de tareas de extracción de datos del SEACE';
COMMENT ON TABLE chatbot_logs IS 'Historial de interacciones con el chatbot de IA';
COMMENT ON TABLE configuracion IS 'Configuraciones del sistema';
COMMENT ON TABLE etl_logs IS 'Logs de operaciones de extracción, transformación y carga de datos';
