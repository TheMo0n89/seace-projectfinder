/**
 * Servicio de Chatbot con acceso directo a procesos SEACE
 * Responsable de:
 * - Buscar procesos según intención
 * - Extraer criterios de búsqueda
 * - Construir respuestas contextualizadas
 */

const { Proceso } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

class ChatbotProcessService {
  /**
   * Buscar procesos según criterios extraídos de la consulta del usuario
   * @param {Object} searchCriteria - { entidad_nombre, objeto_contratacion, keywords, monto_min, monto_max, limit }
   * @returns {Promise<Array>} Procesos encontrados con formato de chatbot
   */
  async searchProcesses(searchCriteria) {
    try {
      const {
        entidad_nombre,
        objeto_contratacion,
        keywords = [],
        monto_min,
        monto_max,
        limit = 5
      } = searchCriteria;

      const whereClause = {};

      // 1. Filtro por entidad (municipalidad, empresa, etc)
      if (entidad_nombre) {
        whereClause.nombre_entidad = {
          [Op.iLike]: `%${entidad_nombre}%`
        };
      }

      // 2. Filtro por tipo de objeto (servicio, bien, consultoría)
      if (objeto_contratacion) {
        whereClause.objeto_contratacion = {
          [Op.iLike]: `%${objeto_contratacion}%`
        };
      }

      // 3. Búsqueda por keywords en descripción/nomenclatura
      if (keywords && keywords.length > 0) {
        const orConditions = keywords.map(keyword => ({
          [Op.or]: [
            { descripcion_objeto: { [Op.iLike]: `%${keyword}%` } },
            { nomenclatura: { [Op.iLike]: `%${keyword}%` } }
          ]
        }));
        whereClause[Op.or] = orConditions;
      }

      // 4. Filtro por rango de monto
      if (monto_min !== undefined || monto_max !== undefined) {
        whereClause.monto_referencial = whereClause.monto_referencial || {};
        if (monto_min !== undefined) {
          whereClause.monto_referencial[Op.gte] = monto_min;
        }
        if (monto_max !== undefined) {
          whereClause.monto_referencial[Op.lte] = monto_max;
        }
      }

      // Ejecutar búsqueda en BD
      const procesos = await Proceso.findAll({
        where: whereClause,
        limit: limit,
        order: [['fecha_publicacion', 'DESC']],
        attributes: [
          'id',
          'nomenclatura',
          'nombre_entidad',
          'descripcion_objeto',
          'objeto_contratacion',
          'monto_referencial',
          'moneda',
          'fecha_publicacion'
        ]
      });

      // Transformar para chatbot
      return procesos.map(p => ({
        id: p.id,
        nomenclatura: p.nomenclatura || 'Sin nombre',
        entidad: p.nombre_entidad || 'No especificado',
        descripcion: (p.descripcion_objeto || '').substring(0, 150) + 
                     (p.descripcion_objeto?.length > 150 ? '...' : ''),
        monto: p.monto_referencial,
        moneda: p.moneda || 'PEN',
        tipo: p.objeto_contratacion || 'No especificado',
        fecha: p.fecha_publicacion,
        url: `/procesos/${p.id}`
      }));

    } catch (error) {
      logger.error(`Error en searchProcesses: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extraer intención (municipalidad, empresa, servicio, etc) de la consulta
   * @param {string} query - Consulta del usuario
   * @returns {Array<string>} Intenciones encontradas
   */
  extractIntention(query) {
    const lowerQuery = query.toLowerCase();

    // Mapa de intenciones con keywords
    const intentions = {
      municipalidad: [
        'municipalidad',
        'municipio',
        'local',
        'alcaldía',
        'gobierno local',
        'distrito',
        'provinc'  // provincia
      ],
      empresa: [
        'empresa',
        'empresa privada',
        'sociedad',
        'privado',
        'corporación',
        'institución privada'
      ],
      servicio: [
        'servicio',
        'servicios',
        'contratar servicio',
        'prestación de servicio'
      ],
      bien: [
        'bien',
        'bienes',
        'compra',
        'compras',
        'adquisición',
        'bienes y servicios'
      ],
      ti: [
        'software',
        'sistemas',
        'ti',
        'informática',
        'tecnología',
        'digital',
        'programación',
        'desarrollo',
        'aplicación'
      ],
      salud: [
        'salud',
        'hospital',
        'médico',
        'medico',
        'sanidad',
        'salud pública',
        'clínica'
      ],
      infraestructura: [
        'carretera',
        'puente',
        'infraestructura',
        'construcción',
        'obra',
        'proyecto de obra',
        'vía'
      ],
      educacion: [
        'educación',
        'educativo',
        'escuela',
        'colegio',
        'universidad',
        'enseñanza'
      ],
      transporte: [
        'transporte',
        'vehículo',
        'vehiculo',
        'buses',
        'taxi',
        'logística'
      ]
    };

    const foundIntentions = [];

    for (const [key, values] of Object.entries(intentions)) {
      // Si al menos uno de los keywords está en la query
      if (values.some(val => lowerQuery.includes(val))) {
        foundIntentions.push(key);
      }
    }

    return foundIntentions;
  }

  /**
   * Construir criterios de búsqueda basados en la intención identificada
   * @param {string} intention - Intención extraída
   * @returns {Object} Criterios para searchProcesses
   */
  buildSearchCriteria(intention) {
    const criteriaMap = {
      municipalidad: {
        entidad_nombre: 'municipalidad',
        limit: 5
      },
      empresa: {
        entidad_nombre: 'empresa',
        limit: 5
      },
      servicio: {
        objeto_contratacion: 'servicio',
        limit: 5
      },
      bien: {
        objeto_contratacion: 'bien',
        limit: 5
      },
      ti: {
        keywords: ['software', 'sistema', 'tecnología', 'informática', 'desarrollo'],
        limit: 5
      },
      salud: {
        keywords: ['salud', 'hospital', 'médico', 'sanidad'],
        limit: 5
      },
      infraestructura: {
        keywords: ['infraestructura', 'construcción', 'obra', 'vía', 'carretera'],
        limit: 5
      },
      educacion: {
        keywords: ['educación', 'escuela', 'colegio', 'universidad'],
        limit: 5
      },
      transporte: {
        keywords: ['transporte', 'vehículo', 'buses', 'logística'],
        limit: 5
      }
    };

    return criteriaMap[intention] || { limit: 5 };
  }

  /**
   * Generar respuesta del chatbot contextualizada según procesos encontrados
   * @param {string} intention - Intención identificada
   * @param {Array} processes - Procesos encontrados
   * @returns {string} Respuesta generada
   */
  generateResponse(intention, processes = []) {
    const responseMap = {
      municipalidad: {
        found: `Encontré ${processes.length} procesos en municipalidades que podrían interesarte:`,
        empty: 'No encontré procesos en municipalidades en este momento. ¿Quieres buscar en otra categoría?'
      },
      empresa: {
        found: `Tenemos ${processes.length} procesos de empresas disponibles:`,
        empty: 'No hay procesos de empresas registrados actualmente.'
      },
      servicio: {
        found: `Hay ${processes.length} servicios a contratar:`,
        empty: 'No hay servicios disponibles por el momento.'
      },
      bien: {
        found: `Se encontraron ${processes.length} procesos para compra de bienes:`,
        empty: 'No hay procesos de compra de bienes registrados.'
      },
      ti: {
        found: `Encontré ${processes.length} procesos relacionados con tecnología e informática:`,
        empty: 'No hay procesos de TI disponibles actualmente.'
      },
      salud: {
        found: `Se encontraron ${processes.length} procesos en el sector salud:`,
        empty: 'No hay procesos en el sector salud registrados.'
      },
      infraestructura: {
        found: `Hay ${processes.length} proyectos de infraestructura disponibles:`,
        empty: 'No hay proyectos de infraestructura en este momento.'
      },
      educacion: {
        found: `Se encontraron ${processes.length} procesos en educación:`,
        empty: 'No hay procesos en el sector educación.'
      },
      transporte: {
        found: `Hay ${processes.length} procesos en transporte y logística:`,
        empty: 'No hay procesos de transporte disponibles.'
      }
    };

    const messages = responseMap[intention] || {
      found: `Encontré ${processes.length} procesos que podrían interesarte:`,
      empty: 'No encontré procesos en esa categoría.'
    };

    return processes.length > 0 ? messages.found : messages.empty;
  }

  /**
   * Procesar una consulta completa del chatbot
   * @param {string} query - Consulta del usuario
   * @returns {Promise<Object>} { response, processes, hasProcesses, metadata }
   */
  async processQuery(query) {
    try {
      // 1. Extraer intención
      const intentions = this.extractIntention(query);

      let response = '';
      let processes = [];
      let hasProcesses = false;
      let metadata = { intention: intentions, processCount: 0 };

      if (intentions.length > 0) {
        // 2. Construir criterios de búsqueda
        const criteria = this.buildSearchCriteria(intentions[0]);

        // 3. Buscar procesos
        processes = await this.searchProcesses(criteria);

        // 4. Generar respuesta
        response = this.generateResponse(intentions[0], processes);

        hasProcesses = processes.length > 0;
        metadata.processCount = processes.length;
        metadata.searchCriteria = criteria;
      } else {
        // Sin intención clara
        response =
          '¡Hola! Te ayudaré a encontrar procesos SEACE. Prueba con:\n' +
          '• "Procesos para municipalidades"\n' +
          '• "Servicios de software"\n' +
          '• "Bienes a contratar"\n' +
          '• "Procesos de infraestructura"\n' +
          '¿Qué buscas?';
      }

      return {
        response,
        processes,
        hasProcesses,
        metadata
      };

    } catch (error) {
      logger.error(`Error en processQuery: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ChatbotProcessService();
