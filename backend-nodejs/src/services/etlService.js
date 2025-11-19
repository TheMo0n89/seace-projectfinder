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
        search_params: params,
        paso_actual: 0,
        paso_total: 0,
        porcentaje: 0,
        mensaje_actual: 'Inicializando scraper...'
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

  // Método para actualizar progreso en tiempo real
  async updateProgress(operationId, pasoActual, pasoTotal, mensajeActual) {
    try {
      const porcentaje = pasoTotal > 0 ? Math.round((pasoActual / pasoTotal) * 100) : 0;
      
      await ETLLog.update({
        paso_actual: pasoActual,
        paso_total: pasoTotal,
        porcentaje: porcentaje,
        mensaje_actual: mensajeActual,
        updated_at: new Date()
      }, {
        where: { operation_id: operationId }
      });
    } catch (error) {
      logger.error(`Error al actualizar progreso: ${error.message}`);
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

      // Ejecutar búsqueda - SOLO pasar parámetros que el usuario especificó
      const searchParams = {
        anio: params.anio || new Date().getFullYear().toString(),
        maxProcesses: params.maxProcesses || 100
      };
      
      // Solo agregar parámetros si fueron especificados
      if (params.keywords && params.keywords.length > 0) {
        searchParams.keywords = params.keywords;
      }
      if (params.objetoContratacion) {
        searchParams.objetoContratacion = params.objetoContratacion;
      }
      if (params.departamento) {
        searchParams.departamento = params.departamento;
      }
      if (params.estadoProceso) {
        searchParams.estadoProceso = params.estadoProceso;
      }
      if (params.entidad) {
        searchParams.entidad = params.entidad;
      }
      if (params.tipoProceso) {
        searchParams.tipoProceso = params.tipoProceso;
      }

      // Log de diagnóstico: qué parámetros se envían al scraper
      logger.info('═══════════════════════════════════════════════════════');
      logger.info('🔍 PARÁMETROS ENVIADOS AL SCRAPER:');
      logger.info(`   • objetoContratacion: "${searchParams.objetoContratacion || 'NO ESPECIFICADO'}"`);
      logger.info(`   • anio: "${searchParams.anio}"`);
      logger.info(`   • keywords: ${searchParams.keywords?.join(', ') || 'Sin keywords'}`);
      logger.info(`   • maxProcesses: ${searchParams.maxProcesses}`);
      logger.info('═══════════════════════════════════════════════════════');
      
      const results = await scraper.searchProcesses(searchParams);

      logger.info(`Scraping inicial completado: ${results.length} procesos encontrados`);
      
      // Actualizar progreso: Extracción completada
      await this.updateProgress(operationId, 1, 2, `Extracción completada: ${results.length} procesos encontrados`);

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
      const insertedProcesses = [];
      const updatedProcesses = [];
      const maxNewProcesses = params.maxProcesses || null;
      let newProcessesInserted = 0;

      for (let idx = 0; idx < results.length; idx++) {
        const procesoData = results[idx];
        
        // Actualizar progreso cada 5 procesos
        // Sistema 2 pasos: paso 1 (scraping) = 0-50%, paso 2 (guardado) = 50-100%
        if (idx % 5 === 0) {
          const subProgress = idx / results.length; // 0.0 a 1.0
          const pasoActual = 1 + subProgress; // 1.0 a 2.0
          await this.updateProgress(
            operationId, 
            pasoActual, 
            2, 
            `Guardando procesos: ${idx}/${results.length}`
          );
          // Actualizar contadores en BD
          await ETLLog.update({
            inserted_count: savedCount,
            updated_count: updateCount,
            error_count: errorCount
          }, { where: { operation_id: operationId } });
          logger.info(`📊 Progreso guardado: ${Math.round(subProgress * 100)}% - Insertados: ${savedCount}, Actualizados: ${updateCount}, Errores: ${errorCount}`);
        }
        
        try {
          // Si hay límite de maxProcesses y ya alcanzamos el número de NUEVOS, solo actualizar existentes
          if (maxNewProcesses && newProcessesInserted >= maxNewProcesses) {
            // Verificar si existe
            const existingProceso = await Proceso.findOne({
              where: { id_proceso: procesoData.id_proceso }
            });
            
            if (existingProceso) {
              // Solo actualizar procesos existentes, no crear nuevos
              const procesoMapeado = this.mapScrapeDataToProcesoSchema(procesoData);
              await existingProceso.update(procesoMapeado);
              updateCount++;
              updatedProcesses.push({
                id_proceso: procesoData.id_proceso,
                objeto_contratacion: procesoData.objeto_contratacion,
                nombre_entidad: procesoData.nombre_entidad,
                monto_referencial: procesoData.monto_referencial,
                departamento: procesoData.departamento,
                estado_proceso: procesoData.estado_proceso
              });
              logger.debug(`🔄 Proceso ACTUALIZADO (límite de nuevos alcanzado): ${procesoData.id_proceso}`);
            } else {
              // No existe y ya alcanzamos límite de nuevos: OMITIR
              logger.debug(`⏭️  Proceso OMITIDO (límite alcanzado, no existe en BD): ${procesoData.id_proceso}`);
            }
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
            insertedProcesses.push({
              id_proceso: procesoData.id_proceso,
              objeto_contratacion: procesoData.objeto_contratacion,
              nombre_entidad: procesoData.nombre_entidad,
              monto_referencial: procesoData.monto_referencial,
              departamento: procesoData.departamento,
              estado_proceso: procesoData.estado_proceso
            });
            logger.debug(`✅ Proceso INSERTADO: ${procesoMapeado.id_proceso} (${newProcessesInserted}/${maxNewProcesses || 'sin límite'})`);
          } else {
            // Si ya existe, actualizar si hay cambios
            await proceso.update(procesoMapeado);
            updateCount++;
            updatedProcesses.push({
              id_proceso: procesoData.id_proceso,
              objeto_contratacion: procesoData.objeto_contratacion,
              nombre_entidad: procesoData.nombre_entidad,
              monto_referencial: procesoData.monto_referencial,
              departamento: procesoData.departamento,
              estado_proceso: procesoData.estado_proceso
            });
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

      // Actualizar log de ETL con contadores separados y detalles
      const duration = Date.now() - startTime;
      await ETLLog.update(
        {
          status: 'completed',
          message: `Scraping completado: ${savedCount} NUEVOS, ${updateCount} actualizados, ${errorCount} errores (Total procesado: ${results.length})`,
          process_count: savedCount + updateCount,
          inserted_count: savedCount,
          updated_count: updateCount,
          error_count: errorCount,
          duration_ms: duration,
          details: {
            inserted_processes: insertedProcesses,
            updated_processes: updatedProcesses,
            error_processes: errorDetails.map(err => ({
              id_proceso: err.id_proceso,
              error_message: err.error
            }))
          }
        },
        {
          where: { operation_id: operationId }
        }
      );

      logger.info(`✅ Operación ${operationId} completada exitosamente en ${duration}ms`);
      
      // Actualizar progreso final: 100%
      await this.updateProgress(operationId, results.length, results.length, '✅ Scraping completado');

    } catch (error) {
      logger.error(`Error durante scraping: ${error.message}`);
      
      // Actualizar log con error
      const duration = Date.now() - startTime;
      await ETLLog.update(
        {
          status: 'failed',
          message: `Error en scraping: ${error.message}`,
          error_count: 1,
          duration_ms: duration,
          porcentaje: 100,
          mensaje_actual: `❌ Error: ${error.message}`
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

  async getOperationDetails(operationId) {
    try {
      const etlLog = await ETLLog.findOne({
        where: { operation_id: operationId }
      });

      if (!etlLog) {
        return null;
      }

      // Extraer detalles del JSONB
      const details = etlLog.details || {};
      
      return {
        operation_id: operationId,
        operation_type: etlLog.operation_type,
        status: etlLog.status,
        message: etlLog.message,
        inserted_count: etlLog.inserted_count || 0,
        updated_count: etlLog.updated_count || 0,
        error_count: etlLog.error_count || 0,
        duration_ms: etlLog.duration_ms,
        created_at: etlLog.created_at,
        search_params: etlLog.search_params || {},
        inserted_processes: details.inserted_processes || [],
        updated_processes: details.updated_processes || [],
        error_processes: details.error_processes || []
      };
    } catch (error) {
      logger.error(`Error en getOperationDetails: ${error.message}`);
      throw error;
    }
  }

  async getOperationProgress(operationId) {
    try {
      const etlLog = await ETLLog.findOne({
        where: { operation_id: operationId }
      });

      if (!etlLog) {
        return {
          status: 'not_found',
          paso_actual: 0,
          paso_total: 0,
          porcentaje: 0,
          mensaje_actual: 'Operación no encontrada'
        };
      }

      return {
        operation_id: operationId,
        status: etlLog.status,
        paso_actual: etlLog.paso_actual || 0,
        paso_total: etlLog.paso_total || 0,
        porcentaje: etlLog.porcentaje || 0,
        mensaje_actual: etlLog.mensaje_actual || '',
        inserted_count: etlLog.inserted_count || 0,
        updated_count: etlLog.updated_count || 0,
        error_count: etlLog.error_count || 0
      };
    } catch (error) {
      logger.error(`Error en getOperationProgress: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ETLService();