/**
 * Controlador de ETL
 */
const etlService = require('../services/etlService');
const logger = require('../config/logger');

class ETLController {
  async startScraping(req, res, next) {
    try {
      const params = req.body;
      const result = await etlService.startScraping(params);
      
      // Evitar cache
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      // Retornar directamente
      res.json(result);
    } catch (error) {
      logger.error(`Error en startScraping: ${error.message}`);
      next(error);
    }
  }

  async createScrapingTask(req, res, next) {
    try {
      const params = req.body;
      const userId = req.user?.id;
      
      const task = await etlService.createScrapingTask(params, userId);
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  }

  async getScrapingTask(req, res, next) {
    try {
      const { task_id } = req.params;
      const task = await etlService.getScrapingTask(task_id);
      res.json(task);
    } catch (error) {
      if (error.message.includes('no encontrada')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  async getScrapingTasks(req, res, next) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        size: parseInt(req.query.size) || 20,
        estado: req.query.estado,
        user_id: req.query.user_id
      };

      const result = await etlService.getScrapingTasks(filters);
      
      // Evitar cache
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      // Retornar directamente
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateScrapingTask(req, res, next) {
    try {
      const { task_id } = req.params;
      const updateData = req.body;
      
      const task = await etlService.updateScrapingTask(task_id, updateData);
      res.json(task);
    } catch (error) {
      if (error.message.includes('no encontrada')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  async getETLLogs(req, res, next) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        size: parseInt(req.query.size) || 50,
        operation_type: req.query.operation_type,
        status: req.query.status,
        operation_id: req.query.operation_id
      };

      const result = await etlService.getETLLogs(filters);
      
      // Evitar cache
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      // Retornar directamente
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getETLStats(req, res, next) {
    try {
      const stats = await etlService.getETLStats();
      
      // Evitar cache
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      // Retornar directamente
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async syncProcesses(req, res, next) {
    try {
      const params = req.body;
      const result = await etlService.syncProcesses(params);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async generateEmbeddings(req, res, next) {
    try {
      const { proceso_id } = req.body;
      const result = await etlService.generateEmbeddings(proceso_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener detalles de una operación ETL específica
   */
  async getOperationDetails(req, res, next) {
    try {
      const { operation_id } = req.params;
      const details = await etlService.getOperationDetails(operation_id);
      
      if (!details) {
        return res.status(404).json({ 
          success: false, 
          message: 'Operación no encontrada' 
        });
      }

      // Evitar cache
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      res.json({
        success: true,
        data: details
      });
    } catch (error) {
      logger.error(`Error en getOperationDetails: ${error.message}`);
      next(error);
    }
  }

  /**
   * Obtener progreso en tiempo real de una operación ETL
   */
  async getOperationProgress(req, res, next) {
    try {
      const { operation_id } = req.params;
      const progress = await etlService.getOperationProgress(operation_id);
      
      // Evitar cache
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      logger.error(`Error en getOperationProgress: ${error.message}`);
      next(error);
    }
  }

  /**
   * Listar archivos de exportación
   */
  async listExportedFiles(req, res, next) {
    try {
      const exportService = require('../services/exportService');
      const filter = req.query.filter || null;
      
      const files = await exportService.listExportedFiles(filter);
      res.json({ success: true, data: files });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Descargar archivo de exportación
   */
  async downloadExportedFile(req, res, next) {
    try {
      const exportService = require('../services/exportService');
      const { fileName } = req.params;
      
      const file = await exportService.getExportedFile(fileName);
      if (!file) {
        return res.status(404).json({ success: false, message: 'Archivo no encontrado' });
      }

      // Determinar tipo de contenido
      let contentType = 'text/plain; charset=utf-8';
      if (fileName.endsWith('.json')) {
        contentType = 'application/json';
      } else if (fileName.endsWith('.csv')) {
        contentType = 'text/csv; charset=utf-8';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(file.content);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ETLController();