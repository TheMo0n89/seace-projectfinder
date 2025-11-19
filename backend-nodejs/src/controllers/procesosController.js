/**
 * Controlador de procesos
 */
const procesosService = require('../services/procesosService');
const interactionService = require('../services/interactionService');
const logger = require('../config/logger');

class ProcesosController {
  /**
   * Obtener lista de procesos con filtros
   */
  async getProcesos(req, res, next) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        size: parseInt(req.query.size) || 20,
        estado_proceso: req.query.estado_proceso,
        tipo_proceso: req.query.tipo_proceso,
        objeto_contratacion: req.query.objeto_contratacion,
        rubro: req.query.rubro,
        departamento: req.query.departamento,
        entidad_nombre: req.query.entidad_nombre,
        monto_min: req.query.monto_min ? parseFloat(req.query.monto_min) : null,
        monto_max: req.query.monto_max ? parseFloat(req.query.monto_max) : null,
        fecha_desde: req.query.fecha_desde,
        fecha_hasta: req.query.fecha_hasta,
        search_text: req.query.search_text,
        sort_by: req.query.sort_by || 'fecha_publicacion',
        sort_order: req.query.sort_order || 'desc'
      };

      const result = await procesosService.getProcesos(filters);

      // Evitar cache 304 - siempre retornar fresh data
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      // Retornar directamente el resultado (con items, total, page, size, pages)
      res.json(result);
    } catch (error) {
      logger.error(`Error en getProcesos: ${error.message}`);
      next(error);
    }
  }

  /**
   * Obtener detalle de un proceso
   */
  async getProcesoDetail(req, res, next) {
    try {
      const { proceso_id } = req.params;
      const userId = req.user ? req.user.id : null;

      const proceso = await procesosService.getProcesoById(proceso_id);

      if (!proceso) {
        return res.status(404).json({
          success: false,
          message: 'Proceso no encontrado'
        });
      }

      // Registrar interacción de click si el usuario está autenticado
      if (userId) {
        interactionService.registrarClickProceso(userId, proceso.id, proceso.nombre_entidad).catch(err => {
          logger.error(`Error registrando interacción de click: ${err.message}`);
        });
      }

      // Evitar cache 304 - siempre retornar fresh data
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      // Retornar directamente el proceso sin wrapping (igual que getProcesos)
      res.json(proceso);
    } catch (error) {
      logger.error(`Error en getProcesoDetail: ${error.message}`);
      next(error);
    }
  }

  /**
   * Buscar procesos por texto
   */
  async searchProcesosByText(req, res, next) {
    try {
      const { q } = req.query;
      const page = parseInt(req.query.page) || 1;
      const size = parseInt(req.query.size) || 20;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'El parámetro "q" es requerido para la búsqueda'
        });
      }

      const result = await procesosService.searchProcesosByText(q, page, size);

      // Evitar cache
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      // Retornar directamente el resultado (con items, total, page, size, pages)
      res.json(result);
    } catch (error) {
      logger.error(`Error en searchProcesosByText: ${error.message}`);
      next(error);
    }
  }

  /**
   * Obtener estadísticas generales
   */
  async getGeneralStats(req, res, next) {
    try {
      const stats = await procesosService.getGeneralStats();

      // Evitar cache
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      // Retornar directamente el objeto stats
      res.json(stats);
    } catch (error) {
      logger.error(`Error en getGeneralStats: ${error.message}`);
      next(error);
    }
  }

  /**
   * Obtener estadísticas detalladas
   */
  async getDetailedStats(req, res, next) {
    try {
      const stats = await procesosService.getDetailedStats();

      // Evitar cache
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      // Retornar directamente el objeto stats
      res.json(stats);
    } catch (error) {
      logger.error(`Error en getDetailedStats: ${error.message}`);
      next(error);
    }
  }

  /**
   * Crear nuevo proceso
   */
  async createProceso(req, res, next) {
    try {
      const procesoData = req.body;

      const proceso = await procesosService.createProceso(procesoData);

      logger.info(`Proceso creado: ${proceso.id_proceso}`);

      res.status(201).json({
        success: true,
        data: proceso
      });
    } catch (error) {
      logger.error(`Error en createProceso: ${error.message}`);
      next(error);
    }
  }

  /**
   * Actualizar proceso
   */
  async updateProceso(req, res, next) {
    try {
      const { proceso_id } = req.params;
      const procesoData = req.body;

      const proceso = await procesosService.updateProceso(proceso_id, procesoData);

      logger.info(`Proceso actualizado: ${proceso.id_proceso}`);

      res.json({
        success: true,
        data: proceso
      });
    } catch (error) {
      logger.error(`Error en updateProceso: ${error.message}`);
      
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Eliminar proceso
   */
  async deleteProceso(req, res, next) {
    try {
      const { proceso_id } = req.params;

      await procesosService.deleteProceso(proceso_id);

      logger.info(`Proceso eliminado: ${proceso_id}`);

      res.json({
        success: true,
        message: 'Proceso eliminado exitosamente'
      });
    } catch (error) {
      logger.error(`Error en deleteProceso: ${error.message}`);
      
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      next(error);
    }
  }
}

module.exports = new ProcesosController();