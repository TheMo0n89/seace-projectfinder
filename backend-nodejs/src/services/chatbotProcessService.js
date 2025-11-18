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
        objeto_contratacion: p.objeto_contratacion || 'No especificado',
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
        'prestación de servicio',
        'prestación'
      ],
      bien: [
        'bien',
        'bienes',
        'compra',
        'compras',
        'adquisición',
        'bienes y servicios',
        'suministro'
      ],
      consultoria: [
        'consultoría',
        'consultoria',
        'consultor',
        'asesoría',
        'asesoria',
        'estudio',
        'diseño'
      ],
      obra: [
        'obra',
        'obras',
        'ejecución de obra',
        'construcción de obra'
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
        objeto_contratacion: 'Servicio',  // Exacto como en BD
        limit: 5
      },
      bien: {
        objeto_contratacion: 'Bien',  // Exacto como en BD
        limit: 5
      },
      consultoria: {
        objeto_contratacion: 'Consultoría de Obra',  // Exacto como en BD
        limit: 5
      },
      obra: {
        objeto_contratacion: 'Obra',  // Para cuando se implemente
        limit: 5
      },
      ti: {
        keywords: ['software', 'sistema', 'tecnología', 'informática', 'desarrollo', 'aplicación', 'digital'],
        objeto_contratacion: 'Servicio',  // TI suele ser servicio
        limit: 8
      },
      salud: {
        keywords: ['salud', 'hospital', 'médico', 'sanidad', 'clínica', 'equipo médico'],
        limit: 5
      },
      infraestructura: {
        keywords: ['infraestructura', 'construcción', 'obra', 'vía', 'carretera', 'puente'],
        objeto_contratacion: 'Consultoría de Obra',
        limit: 5
      },
      educacion: {
        keywords: ['educación', 'escuela', 'colegio', 'universidad', 'educativo'],
        limit: 5
      },
      transporte: {
        keywords: ['transporte', 'vehículo', 'buses', 'logística', 'movilidad'],
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
      consultoria: {
        found: `Hay ${processes.length} procesos de consultoría de obra disponibles:`,
        empty: 'No hay procesos de consultoría de obra en este momento.'
      },
      obra: {
        found: `Se encontraron ${processes.length} proyectos de obra:`,
        empty: 'No hay proyectos de obra registrados actualmente.'
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
   * @param {Object} userContext - Contexto del perfil de usuario (si está disponible)
   * @returns {Promise<Object>} { response, processes, hasProcesses, metadata }
   */
  async processQuery(query, userContext = null) {
    try {
      // 1. Extraer intención
      const intentions = this.extractIntention(query);

      let response = '';
      let processes = [];
      let hasProcesses = false;
      let metadata = { intention: intentions, processCount: 0, personalized: !!userContext };

      // Si el usuario tiene perfil completado, priorizar según sus preferencias
      if (userContext && userContext.regiones_foco && userContext.regiones_foco !== 'todas') {
        metadata.userPreferences = {
          regiones: userContext.regiones_foco,
          especialidad: userContext.especialidad,
          monto: userContext.monto_preferido
        };
      }

      if (intentions.length > 0) {
        // 2. Construir criterios de búsqueda
        let criteria = this.buildSearchCriteria(intentions[0]);

        // 3. Si hay contexto de usuario, ajustar criterios
        if (userContext) {
          // Ajustar según monto preferido del usuario
          if (userContext.monto_preferido && userContext.monto_preferido !== 'cualquiera') {
            const montoMatch = userContext.monto_preferido.match(/(\d+)\s*-\s*(\d+)/);
            if (montoMatch) {
              criteria.monto_min = parseInt(montoMatch[1]);
              criteria.monto_max = parseInt(montoMatch[2]);
            }
          }

          // Aumentar límite si el usuario busca procesos específicos
          criteria.limit = 8;
        }

        // 4. Buscar procesos
        processes = await this.searchProcesses(criteria);

        // 5. Generar respuesta
        response = this.generateResponse(intentions[0], processes);

        hasProcesses = processes.length > 0;
        metadata.processCount = processes.length;
        metadata.searchCriteria = criteria;
      } else {
        // Sin intención clara - mostrar ayuda contextualizada
        if (userContext && userContext.especialidad !== 'no especificada') {
          response = `¡Hola! Como especialista en ${userContext.especialidad}, puedo ayudarte a encontrar procesos SEACE relevantes.\n\n` +
            'Prueba con:\n' +
            '• "Procesos de servicios"\n' +
            '• "Bienes tecnológicos"\n' +
            '• "Consultoría de obra"\n' +
            '• "Procesos en ' + (userContext.regiones_foco || 'mi región') + '"\n\n' +
            '¿Qué buscas?';
        } else {
          response =
            '¡Hola! Te ayudaré a encontrar procesos SEACE. Prueba con:\n' +
            '• "Procesos de servicios"\n' +
            '• "Bienes a contratar"\n' +
            '• "Consultoría de obra"\n' +
            '• "Procesos de infraestructura"\n\n' +
            '¿Qué buscas?';
        }
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
