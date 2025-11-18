/**
 * Servicio de procesos
 */
const { Proceso, Anexo, ProcesoEmbedding, Recomendacion } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

class ProcesosService {
  /**
   * Obtener procesos con filtros y paginación
   */
  async getProcesos(filters = {}) {
    try {
      const {
        page = 1,
        size = 20,
        estado_proceso,
        tipo_proceso,
        objeto_contratacion,
        rubro,
        departamento,
        entidad_nombre,
        monto_min,
        monto_max,
        fecha_desde,
        fecha_hasta,
        search_text,
        sort_by = 'fecha_publicacion',
        sort_order = 'DESC'
      } = filters;

      const whereClause = {};

      // Aplicar filtros
      if (estado_proceso) {
        whereClause.estado_proceso = estado_proceso;
      }

      if (tipo_proceso) {
        whereClause.tipo_proceso = {
          [Op.iLike]: `%${tipo_proceso}%`
        };
      }

      // Filtro de Objeto de Contratación (Servicio, Bien, Consultoría de Obra, Obra)
      if (objeto_contratacion) {
        whereClause.objeto_contratacion = objeto_contratacion;
      }

      if (rubro) {
        whereClause.rubro = {
          [Op.iLike]: `%${rubro}%`
        };
      }

      if (departamento) {
        whereClause.departamento = {
          [Op.iLike]: `%${departamento}%`
        };
      }

      // Filtro de Entidad
      if (entidad_nombre) {
        whereClause[Op.or] = [
          { nombre_entidad: { [Op.iLike]: `%${entidad_nombre}%` } },
          { entidad_nombre: { [Op.iLike]: `%${entidad_nombre}%` } }
        ];
      }

      // Filtros de Monto
      if (monto_min) {
        whereClause.monto_referencial = {
          ...whereClause.monto_referencial,
          [Op.gte]: parseFloat(monto_min)
        };
      }

      if (monto_max) {
        whereClause.monto_referencial = {
          ...whereClause.monto_referencial,
          [Op.lte]: parseFloat(monto_max)
        };
      }

      // Filtros de Fecha
      if (fecha_desde) {
        whereClause.fecha_publicacion = {
          ...whereClause.fecha_publicacion,
          [Op.gte]: new Date(fecha_desde)
        };
      }

      if (fecha_hasta) {
        whereClause.fecha_publicacion = {
          ...whereClause.fecha_publicacion,
          [Op.lte]: new Date(fecha_hasta + 'T23:59:59')
        };
      }

      if (search_text) {
        whereClause[Op.or] = [
          { descripcion_objeto: { [Op.iLike]: `%${search_text}%` } },
          { objeto_contratacion: { [Op.iLike]: `%${search_text}%` } },
          { nombre_entidad: { [Op.iLike]: `%${search_text}%` } },
          { entidad_nombre: { [Op.iLike]: `%${search_text}%` } },
          { nomenclatura: { [Op.iLike]: `%${search_text}%` } },
          { rubro: { [Op.iLike]: `%${search_text}%` } }
        ];
      }

      // Calcular offset
      const offset = (page - 1) * size;

      // Ejecutar query
      const { count, rows } = await Proceso.findAndCountAll({
        where: whereClause,
        offset: offset,
        limit: size,
        order: [[sort_by, sort_order.toUpperCase()]],
        include: [
          {
            model: Anexo,
            as: 'anexos',
            required: false
          }
        ]
      });

      // Calcular total de páginas
      const pages = Math.ceil(count / size);

      return {
        items: rows,
        total: count,
        page: parseInt(page),
        size: parseInt(size),
        pages: pages
      };
    } catch (error) {
      console.error('Error en getProcesos:', error);
      throw error;
    }
  }

  /**
   * Obtener proceso por ID
   */
  async getProcesoById(procesoId) {
    try {
      const proceso = await Proceso.findByPk(procesoId, {
        include: [
          {
            model: Anexo,
            as: 'anexos',
            required: false
          }
          // ProcesoEmbedding removido para evitar error en LEFT JOIN
          // Las embeddings se pueden cargar por separado si es necesario
        ]
      });

      return proceso;
    } catch (error) {
      console.error('Error en getProcesoById:', error);
      throw error;
    }
  }

  /**
   * Buscar procesos por texto
   */
  async searchProcesosByText(query, page = 1, size = 20) {
    try {
      const whereClause = {
        [Op.or]: [
          { descripcion_objeto: { [Op.iLike]: `%${query}%` } },
          { objeto_contratacion: { [Op.iLike]: `%${query}%` } },
          { entidad_nombre: { [Op.iLike]: `%${query}%` } },
          { nombre_entidad: { [Op.iLike]: `%${query}%` } },
          { tipo_proceso: { [Op.iLike]: `%${query}%` } },
          { nomenclatura: { [Op.iLike]: `%${query}%` } },
          { rubro: { [Op.iLike]: `%${query}%` } },
          { departamento: { [Op.iLike]: `%${query}%` } }
        ]
      };

      const offset = (page - 1) * size;

      const { count, rows } = await Proceso.findAndCountAll({
        where: whereClause,
        offset: offset,
        limit: size,
        order: [['fecha_publicacion', 'DESC']]
      });

      return {
        query: query,
        total: count,
        page: parseInt(page),
        size: parseInt(size),
        pages: Math.ceil(count / size),
        items: rows
      };
    } catch (error) {
      console.error('Error en searchProcesosByText:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas generales
   */
  async getGeneralStats() {
    try {
      const totalProcesos = await Proceso.count();
      
      const procesosActivos = await Proceso.count({
        where: { estado_proceso: 'En proceso' }
      });

      const procesosAdjudicados = await Proceso.count({
        where: { estado_proceso: 'Adjudicado' }
      });

      const totalValorResult = await Proceso.sum('monto_referencial', {
        where: {
          monto_referencial: { [Op.ne]: null }
        }
      });

      const totalValor = totalValorResult || 0;

      return {
        total_procesos: totalProcesos,
        procesos_activos: procesosActivos,
        procesos_adjudicados: procesosAdjudicados,
        valor_total: parseFloat(totalValor)
      };
    } catch (error) {
      console.error('Error en getGeneralStats:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas detalladas
   */
  async getDetailedStats() {
    try {
      const totalProcesos = await Proceso.count();
      
      const totalTI = await Proceso.count({
        where: { categoria_proyecto: 'TI' }
      });

      // Procesos por estado
      const procesosPorEstado = await sequelize.query(
        `SELECT estado_proceso, COUNT(*) as cantidad 
         FROM procesos 
         WHERE estado_proceso IS NOT NULL 
         GROUP BY estado_proceso 
         ORDER BY cantidad DESC`,
        { type: sequelize.QueryTypes.SELECT }
      );

      // Procesos por tipo
      const procesosPorTipo = await sequelize.query(
        `SELECT tipo_proceso, COUNT(*) as cantidad 
         FROM procesos 
         WHERE tipo_proceso IS NOT NULL 
         GROUP BY tipo_proceso 
         ORDER BY cantidad DESC 
         LIMIT 10`,
        { type: sequelize.QueryTypes.SELECT }
      );

      // Procesos por departamento
      const procesosPorDepartamento = await sequelize.query(
        `SELECT departamento, COUNT(*) as cantidad 
         FROM procesos 
         WHERE departamento IS NOT NULL 
         GROUP BY departamento 
         ORDER BY cantidad DESC 
         LIMIT 10`,
        { type: sequelize.QueryTypes.SELECT }
      );

      // Monto total
      const montoTotal = await Proceso.sum('monto_referencial', {
        where: {
          monto_referencial: { [Op.ne]: null }
        }
      });

      return {
        total_procesos: totalProcesos,
        total_ti: totalTI,
        monto_total: parseFloat(montoTotal || 0),
        por_estado: procesosPorEstado,
        por_tipo: procesosPorTipo,
        por_departamento: procesosPorDepartamento
      };
    } catch (error) {
      console.error('Error en getDetailedStats:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo proceso
   */
  async createProceso(procesoData) {
    try {
      const proceso = await Proceso.create(procesoData);
      return proceso;
    } catch (error) {
      console.error('Error en createProceso:', error);
      throw error;
    }
  }

  /**
   * Actualizar proceso
   */
  async updateProceso(procesoId, procesoData) {
    try {
      const proceso = await Proceso.findByPk(procesoId);
      
      if (!proceso) {
        throw new Error('Proceso no encontrado');
      }

      await proceso.update(procesoData);
      await proceso.reload();

      return proceso;
    } catch (error) {
      console.error('Error en updateProceso:', error);
      throw error;
    }
  }

  /**
   * Eliminar proceso
   */
  async deleteProceso(procesoId) {
    try {
      const proceso = await Proceso.findByPk(procesoId);
      
      if (!proceso) {
        throw new Error('Proceso no encontrado');
      }

      await proceso.destroy();
      
      return true;
    } catch (error) {
      console.error('Error en deleteProceso:', error);
      throw error;
    }
  }
}

module.exports = new ProcesosService();