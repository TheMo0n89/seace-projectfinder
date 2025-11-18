/**
 * Servicio de ETL
 */
const { ScrapingTask, ETLLog, Proceso } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

class ETLService {
  /**
   * Mapea datos del scraper a schema exacto de tabla procesos
   * Esto asegura que SOLO se envíen campos válidos a PostgreSQL
   */
  mapScrapeDataToProcesoSchema(procesoData) {
    // Definir exactamente qué campos acepta la tabla procesos
    const camposValidos = {
      // Requeridos
      id_proceso: procesoData.id_proceso,
      
      // Principales (mappeo directo)
      nombre_entidad: procesoData.nombre_entidad || null,
      entidad_nombre: procesoData.entidad_nombre || null,
      fecha_publicacion: procesoData.fecha_publicacion || null,
      nomenclatura: procesoData.nomenclatura || null,
      reiniciado_desde: procesoData.reiniciado_desde || null,
      objeto_contratacion: procesoData.objeto_contratacion || null,
      descripcion_objeto: procesoData.descripcion_objeto || null,
      
      // Estado y tipo
      estado_proceso: procesoData.estado_proceso || 'Publicado',
      tipo_proceso: procesoData.tipo_proceso || null,
      
      // URLs y referencias
      url_proceso: procesoData.url_proceso || null,
      source_url: procesoData.source_url || null,
      pagina_scraping: procesoData.pagina_scraping || null,
      
      // Identificadores
      numero_convocatoria: procesoData.numero_convocatoria || null,
      entidad_ruc: procesoData.entidad_ruc || null,
      codigo_snip: procesoData.codigo_snip || null,
      codigo_cui: procesoData.codigo_cui || null,
      
      // Ubicación
      departamento: procesoData.departamento || null,
      provincia: procesoData.provincia || null,
      distrito: procesoData.distrito || null,
      
      // Económicos
      monto_referencial: procesoData.monto_referencial || null,
      moneda: procesoData.moneda || 'Soles',
      rubro: procesoData.rubro || null,
      
      // Fechas
      fecha_scraping: procesoData.fecha_scraping || new Date().toISOString(),
      fecha_limite_presentacion: procesoData.fecha_limite_presentacion || null,
      
      // Versión
      version_seace: procesoData.version_seace || '3',
      
      // Booleanos
      requiere_visita_previa: procesoData.requiere_visita_previa || false,
      
      // JSON
      datos_ocds: procesoData.datos_ocds || null
      
      // Campos auto-gestionados por BD (no se incluyen aquí):
      // - id: UUID auto-generado
      // - fecha_extraccion: CURRENT_TIMESTAMP
      // - fecha_actualizacion: trigger
      // - procesado_nlp: false por defecto
      // - complejidad_estimada: NULL
      // - categoria_proyecto: NULL
    };
    
    return camposValidos;
  }

  async createScrapingTask(params, userId = null) {
    try {
      const task = await ScrapingTask.create({
        task_type: 'search',
        status: 'pending',
        params: params
      });

      logger.info(`Tarea de scraping creada: ${task.id}`);
      return task;
    } catch (error) {
      logger.error(`Error en createScrapingTask: ${error.message}`);
      throw error;
    }
  }

  async getScrapingTask(taskId) {
    try {
      const task = await ScrapingTask.findByPk(taskId);
      if (!task) throw new Error('Tarea no encontrada');
      return task;
    } catch (error) {
      logger.error(`Error en getScrapingTask: ${error.message}`);
      throw error;
    }
  }

  async updateScrapingTask(taskId, updateData) {
    try {
      const task = await ScrapingTask.findByPk(taskId);
      if (!task) throw new Error('Tarea no encontrada');

      await task.update({
        ...updateData,
        updated_at: new Date()
      });

      return task;
    } catch (error) {
      logger.error(`Error en updateScrapingTask: ${error.message}`);
      throw error;
    }
  }

  async getScrapingTasks(filters = {}) {
    try {
      const { page = 1, size = 20, status, type } = filters;
      const whereClause = {};

      if (status) whereClause.status = status;
      if (type) whereClause.task_type = type;

      const offset = (page - 1) * size;
      const { count, rows } = await ScrapingTask.findAndCountAll({
        where: whereClause,
        offset,
        limit: size,
        order: [['created_at', 'DESC']]
      });

      return {
        items: rows,
        total: count,
        page: parseInt(page),
        size: parseInt(size),
        pages: Math.ceil(count / size)
      };
    } catch (error) {
      logger.error(`Error en getScrapingTasks: ${error.message}`);
      throw error;
    }
  }

  async startScraping(params) {
    try {
      const operationId = require('uuid').v4();
      const startTime = Date.now();

      // Crear log de ETL
      const etlLog = await ETLLog.create({
        operation_type: 'scraping',
        operation_id: operationId,
        status: 'running',
        message: 'Iniciando proceso de scraping',
        search_params: params
      });

      logger.info(`Scraping iniciado: ${operationId}`, { params });

      // Ejecutar scraping en background
      this.performScraping(operationId, params, startTime).catch(err => {
        logger.error(`Error en scraping background: ${err.message}`);
      });

      return {
        operation_id: operationId,
        status: 'started',
        message: 'Proceso de scraping iniciado. Puede monitorear el progreso en los logs de ETL.'
      };
    } catch (error) {
      logger.error(`Error en startScraping: ${error.message}`);
      throw error;
    }
  }

  async performScraping(operationId, params, startTime) {
    const SeaceScraper = require('../scraper/SeaceScraper');
    const exportService = require('./exportService');
    const scraper = new SeaceScraper();
    
    try {
      // Inicializar scraper
      await scraper.initialize();
      logger.info(`Scraper inicializado para operación ${operationId}`);

      // Ejecutar búsqueda
      const results = await scraper.searchProcesses({
        keywords: params.keywords || ['software'],
        objetoContratacion: params.objetoContratacion || 'Servicio',
        anio: params.anio || new Date().getFullYear().toString(),
        maxProcesses: params.maxProcesses || 100,
        departamento: params.departamento,
        estadoProceso: params.estadoProceso,
        entidad: params.entidad,
        tipoProceso: params.tipoProceso
      });

      logger.info(`Scraping completado: ${results.length} procesos encontrados`);

      // ✅ LOGGING: Mostrar procesos extraídos
      logger.info('═══ PROCESOS EXTRAÍDOS DEL SCRAPING ═══');
      results.forEach((proceso, index) => {
        logger.info(`Proceso ${index + 1}/${results.length}:`, {
          id_proceso: proceso.id_proceso,
          nombre_entidad: proceso.nombre_entidad,
          fecha_publicacion: proceso.fecha_publicacion,
          monto_referencial: proceso.monto_referencial,
          estado_proceso: proceso.estado_proceso,
          objeto_contratacion: proceso.objeto_contratacion?.substring(0, 50) || 'N/A'
        });
      });

      // ✅ EXPORTAR DATOS ANTES DE GUARDAR EN BD
      if (results.length > 0) {
        // Exportar a TXT (legible)
        const txtExport = await exportService.exportProcessesToTxt(results, operationId);
        if (txtExport.success) {
          logger.info(`✅ Datos extraídos exportados a TXT: ${txtExport.fileName}`);
        }

        // Exportar a JSON (para análisis)
        const jsonExport = await exportService.exportProcessesToJson(results, operationId);
        if (jsonExport.success) {
          logger.info(`✅ Datos extraídos exportados a JSON: ${jsonExport.fileName}`);
        }

        // Exportar a CSV (para Excel)
        const csvExport = await exportService.exportProcessesToCsv(results, operationId);
        if (csvExport.success) {
          logger.info(`✅ Datos extraídos exportados a CSV: ${csvExport.fileName}`);
        }
      }

      // ✅ GUARDAR PROCESOS EN LA BASE DE DATOS CON LOGGING MEJORADO
      // NUEVA LÓGICA: Si maxProcesses está definido, solo contar inserciones nuevas hacia el límite
      logger.info('═══ INICIANDO GUARDADO EN BD ═══');
      let savedCount = 0;
      let updateCount = 0;
      let errorCount = 0;
      const errorDetails = [];
      const maxNewProcesses = params.maxProcesses || null;
      let newProcessesInserted = 0;

      for (const procesoData of results) {
        try {
          // Si hay límite de maxProcesses y ya alcanzamos el número de NUEVOS, solo actualizar
          if (maxNewProcesses && newProcessesInserted >= maxNewProcesses) {
            // Verificar si existe
            const existingProceso = await Proceso.findOne({
              where: { id_proceso: procesoData.id_proceso }
            });
            
            if (existingProceso) {
              // Solo actualizar procesos existentes
              const procesoMapeado = this.mapScrapeDataToProcesoSchema(procesoData);
              await existingProceso.update(procesoMapeado);
              updateCount++;
              logger.debug(`🔄 Proceso ACTUALIZADO (límite alcanzado): ${procesoData.id_proceso}`);
            }
            // Si no existe y ya alcanzamos el límite, no hacer nada
            continue;
          }

          // MAPEO EXPLÍCITO: Solo campos válidos de la tabla procesos
          const procesoMapeado = this.mapScrapeDataToProcesoSchema(procesoData);

          // Validar que id_proceso existe
          if (!procesoMapeado.id_proceso) {
            throw new Error('id_proceso es requerido');
          }

          // findOrCreate: Si existe actualiza, si no crea
          const [proceso, created] = await Proceso.findOrCreate({
            where: { id_proceso: procesoMapeado.id_proceso },
            defaults: procesoMapeado
          });

          if (created) {
            savedCount++;
            newProcessesInserted++;
            logger.debug(`✅ Proceso INSERTADO: ${procesoMapeado.id_proceso} (${newProcessesInserted}/${maxNewProcesses || 'sin límite'})`);
          } else {
            // Si ya existe, actualizar si hay cambios
            await proceso.update(procesoMapeado);
            updateCount++;
            logger.debug(`🔄 Proceso ACTUALIZADO: ${procesoMapeado.id_proceso}`);
          }
        } catch (err) {
          errorCount++;
          errorDetails.push({
            id_proceso: procesoData.id_proceso,
            error: err.message
          });
          logger.error(`❌ Error guardando proceso ${procesoData.id_proceso}: ${err.message}`);
        }
      }

      // ✅ RESUMEN DE GUARDADO
      logger.info('═══ RESUMEN DE GUARDADO EN BD ═══');
      logger.info(`Total procesado: ${results.length}`);
      logger.info(`Nuevos (INSERT): ${savedCount}`);
      logger.info(`Actualizados (UPDATE): ${updateCount}`);
      logger.info(`Errores: ${errorCount}`);
      
      if (errorDetails.length > 0) {
        logger.warn('Detalles de errores:', errorDetails);
      }

      // Actualizar log de ETL con contadores separados
      const duration = Date.now() - startTime;
      await ETLLog.update(
        {
          status: 'completed',
          message: `Scraping completado: ${savedCount} NUEVOS, ${updateCount} actualizados, ${errorCount} errores (Total procesado: ${results.length})`,
          process_count: savedCount + updateCount,
          inserted_count: savedCount,
          updated_count: updateCount,
          error_count: errorCount,
          duration_ms: duration
        },
        {
          where: { operation_id: operationId }
        }
      );

      logger.info(`✅ Operación ${operationId} completada exitosamente en ${duration}ms`);

    } catch (error) {
      logger.error(`Error durante scraping: ${error.message}`);
      
      // Actualizar log con error
      const duration = Date.now() - startTime;
      await ETLLog.update(
        {
          status: 'failed',
          message: `Error en scraping: ${error.message}`,
          error_count: 1,
          duration_ms: duration
        },
        {
          where: { operation_id: operationId }
        }
      );
    } finally {
      // Cerrar scraper
      try {
        await scraper.close();
      } catch (err) {
        logger.error(`Error cerrando scraper: ${err.message}`);
      }
    }
  }

  async getETLLogs(filters = {}) {
    try {
      const { page = 1, size = 50, operation_type, status, operation_id } = filters;
      const whereClause = {};

      if (operation_type) whereClause.operation_type = operation_type;
      if (status) whereClause.status = status;
      if (operation_id) whereClause.operation_id = operation_id;

      const offset = (page - 1) * size;
      const { count, rows } = await ETLLog.findAndCountAll({
        where: whereClause,
        offset,
        limit: size,
        order: [['created_at', 'DESC']]
      });

      return {
        items: rows,
        total: count,
        page: parseInt(page),
        size: parseInt(size),
        pages: Math.ceil(count / size)
      };
    } catch (error) {
      logger.error(`Error en getETLLogs: ${error.message}`);
      throw error;
    }
  }

  async getETLStats() {
    try {
      const totalOperations = await ETLLog.count();
      const completedOperations = await ETLLog.count({ where: { status: 'completed' } });
      const failedOperations = await ETLLog.count({ where: { status: 'failed' } });
      const runningOperations = await ETLLog.count({ where: { status: 'running' } });

      const avgDuration = await ETLLog.average('duration_ms', {
        where: { status: 'completed' }
      });

      return {
        total_operations: totalOperations,
        completed: completedOperations,
        failed: failedOperations,
        running: runningOperations,
        avg_duration_ms: Math.round(avgDuration || 0)
      };
    } catch (error) {
      logger.error(`Error en getETLStats: ${error.message}`);
      throw error;
    }
  }

  async syncProcesses(params) {
    try {
      const operationId = require('uuid').v4();
      
      const etlLog = await ETLLog.create({
        operation_type: 'sync',
        operation_id: operationId,
        status: 'running',
        message: 'Sincronizando procesos'
      });

      logger.info(`Sincronización iniciada: ${operationId}`);

      return {
        operation_id: operationId,
        status: 'started',
        message: 'Sincronización iniciada'
      };
    } catch (error) {
      logger.error(`Error en syncProcesses: ${error.message}`);
      throw error;
    }
  }

  async generateEmbeddings(procesoId = null) {
    try {
      const operationId = require('uuid').v4();
      
      const etlLog = await ETLLog.create({
        operation_type: 'embedding',
        operation_id: operationId,
        status: 'running',
        message: procesoId ? `Generando embedding para proceso ${procesoId}` : 'Generando embeddings para todos los procesos'
      });

      logger.info(`Generación de embeddings iniciada: ${operationId}`);

      return {
        operation_id: operationId,
        status: 'started',
        message: 'Generación de embeddings iniciada'
      };
    } catch (error) {
      logger.error(`Error en generateEmbeddings: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ETLService();