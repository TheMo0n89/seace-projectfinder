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
   * Extraer patrón de monto de la consulta del usuario
   * NO parsea ni asume unidades, solo extrae el patrón numérico
   * @param {string} query - Consulta del usuario
   * @returns {Object|null} { patron, tipo } o null
   */
  extractMontoFromQuery(query) {
    const lowerQuery = query.toLowerCase();
    
    // Extraer patrón numérico de "monto de X" o "monto X" o "costo X"
    const montoMatch = lowerQuery.match(/(?:monto|costo|valor|precio)\s+(?:de\s+)?(\d+(?:[.,]\d+)?)/i);
    if (montoMatch) {
      const patron = montoMatch[1].replace(',', '.');  // Normalizar comas a puntos
      logger.info(`[CHATBOT] Patrón de monto extraído: "${patron}"`);
      return { 
        patron: patron,
        tipo: 'patron',  // Tipo: buscar por patrón (que COMIENCE con estos dígitos)
        original: montoMatch[1]
      };
    }

    // Patrones para "mayor a X", "menor a X" - estos SÍ necesitan rango
    const mayorQue = lowerQuery.match(/mayor\s+(?:a|que)\s+(\d+(?:[.,]\d+)?)/i);
    if (mayorQue) {
      const valor = parseFloat(mayorQue[1].replace(',', '.'));
      // Determinar escala basada en magnitud
      let monto = valor;
      if (valor < 1000) {
        monto = valor * 1000000; // Asumir millones si es < 1000
      }
      return { 
        patron: null,
        tipo: 'rango',
        rango: { min: monto, max: null },
        original: mayorQue[1]
      };
    }

    const menorQue = lowerQuery.match(/menor\s+(?:a|que)\s+(\d+(?:[.,]\d+)?)/i);
    if (menorQue) {
      const valor = parseFloat(menorQue[1].replace(',', '.'));
      let monto = valor;
      if (valor < 1000) {
        monto = valor * 1000000;
      }
      return { 
        patron: null,
        tipo: 'rango',
        rango: { min: null, max: monto },
        original: menorQue[1]
      };
    }

    return null;
  }

  /**
   * Formatear un proceso para el chatbot
   * @param {Object} p - Proceso de Sequelize
   * @returns {Object} Proceso formateado
   */
  formatProcessForChat(p) {
    return {
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
    };
  }

  /**
   * Buscar procesos cuyo monto COMIENCE con un patrón específico
   * @param {string} patron - Patrón numérico (ej: "12.7", "500", "1.5")
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Array>} Procesos agrupados por escala
   */
  async searchProcessesByMontoPattern(patron, limit = 20) {
    try {
      logger.info(`[CHATBOT] Buscando procesos cuyo monto comience con: "${patron}"`);
      
      // Buscar procesos cuyo monto convertido a string COMIENCE con el patrón
      const procesos = await Proceso.findAll({
        where: {
          monto_referencial: {
            [Op.not]: null
          }
        },
        order: [['monto_referencial', 'DESC']],
        limit: 100,  // Buscar más para filtrar después
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

      // Filtrar procesos cuyo monto COMIENCE con el patrón
      const patronNormalizado = patron.replace('.', '');  // "12.7" -> "127"
      const procesosCoincidentes = procesos.filter(p => {
        if (!p.monto_referencial) return false;
        const montoStr = p.monto_referencial.toString().replace('.', '');
        return montoStr.startsWith(patronNormalizado);
      });

      logger.info(`[CHATBOT] Encontrados ${procesosCoincidentes.length} procesos que coinciden con el patrón "${patron}"`);

      // Agrupar por escala (unidades, miles, millones, etc.)
      const agrupados = {
        millones: [],
        miles: [],
        cientos: [],
        unidades: []
      };

      procesosCoincidentes.forEach(p => {
        const monto = parseFloat(p.monto_referencial);
        if (monto >= 1000000) {
          agrupados.millones.push(p);
        } else if (monto >= 1000) {
          agrupados.miles.push(p);
        } else if (monto >= 100) {
          agrupados.cientos.push(p);
        } else {
          agrupados.unidades.push(p);
        }
      });

      // Limitar resultados por grupo
      const maxPorGrupo = Math.ceil(limit / 4);
      const resultado = {
        millones: agrupados.millones.slice(0, maxPorGrupo),
        miles: agrupados.miles.slice(0, maxPorGrupo),
        cientos: agrupados.cientos.slice(0, maxPorGrupo),
        unidades: agrupados.unidades.slice(0, maxPorGrupo)
      };

      return resultado;

    } catch (error) {
      logger.error(`Error en searchProcessesByMontoPattern: ${error.message}`);
      throw error;
    }
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

      // 1.1. Extraer patrón de monto de la consulta si se menciona explícitamente
      const montoQuery = this.extractMontoFromQuery(query);
      if (montoQuery) {
        logger.info(`[CHATBOT] Patrón de monto extraído: "${montoQuery.patron}" (tipo: ${montoQuery.tipo})`);
      }

      let response = '';
      let processes = [];
      let hasProcesses = false;
      let metadata = { 
        intention: intentions, 
        processCount: 0, 
        personalized: !!userContext,
        usedFallback: false,
        montoExtraido: montoQuery,
        busquedaPorPatron: false
      };

      // 1.2. Si se detectó un PATRÓN de monto, hacer búsqueda especial por patrón
      if (montoQuery && montoQuery.tipo === 'patron') {
        logger.info(`[CHATBOT] Ejecutando búsqueda por patrón de monto: "${montoQuery.patron}"`);
        
        const procesosAgrupados = await this.searchProcessesByMontoPattern(montoQuery.patron, 20);
        
        // Convertir agrupados a lista plana con metadatos de grupo
        const todasLasCoincidencias = [];
        
        if (procesosAgrupados.millones.length > 0) {
          procesosAgrupados.millones.forEach(p => {
            todasLasCoincidencias.push({
              ...this.formatProcessForChat(p),
              escala: 'millones',
              montoFormateado: `${(p.monto_referencial / 1000000).toFixed(2)} millones`
            });
          });
        }
        
        if (procesosAgrupados.miles.length > 0) {
          procesosAgrupados.miles.forEach(p => {
            todasLasCoincidencias.push({
              ...this.formatProcessForChat(p),
              escala: 'miles',
              montoFormateado: `${(p.monto_referencial / 1000).toFixed(2)} mil`
            });
          });
        }
        
        if (procesosAgrupados.cientos.length > 0) {
          procesosAgrupados.cientos.forEach(p => {
            todasLasCoincidencias.push({
              ...this.formatProcessForChat(p),
              escala: 'cientos',
              montoFormateado: `${parseFloat(p.monto_referencial).toFixed(2)}`
            });
          });
        }

        if (procesosAgrupados.unidades.length > 0) {
          procesosAgrupados.unidades.forEach(p => {
            todasLasCoincidencias.push({
              ...this.formatProcessForChat(p),
              escala: 'unidades',
              montoFormateado: `${parseFloat(p.monto_referencial).toFixed(2)}`
            });
          });
        }
        
        processes = todasLasCoincidencias;
        metadata.busquedaPorPatron = true;
        metadata.procesosAgrupados = {
          millones: procesosAgrupados.millones.length,
          miles: procesosAgrupados.miles.length,
          cientos: procesosAgrupados.cientos.length,
          unidades: procesosAgrupados.unidades.length
        };
        metadata.processCount = todasLasCoincidencias.length;
        
        if (todasLasCoincidencias.length > 0) {
          hasProcesses = true;
          // Construir respuesta especial para búsqueda por patrón
          response = `🔍 Encontré ${todasLasCoincidencias.length} procesos cuyo monto comienza con "${montoQuery.patron}":\n\n`;
          
          if (procesosAgrupados.millones.length > 0) {
            response += `💰 **${procesosAgrupados.millones.length} proceso(s) en MILLONES** (${montoQuery.patron}.X millones)\n`;
          }
          if (procesosAgrupados.miles.length > 0) {
            response += `💵 **${procesosAgrupados.miles.length} proceso(s) en MILES** (${montoQuery.patron}.X mil)\n`;
          }
          if (procesosAgrupados.cientos.length > 0) {
            response += `💳 **${procesosAgrupados.cientos.length} proceso(s) en CIENTOS** (${montoQuery.patron}.X)\n`;
          }
          if (procesosAgrupados.unidades.length > 0) {
            response += `🪙 **${procesosAgrupados.unidades.length} proceso(s) en UNIDADES** (${montoQuery.patron}.X)\n`;
          }
          
          response += `\n📊 Los procesos están ordenados por relevancia y escala.`;
        } else {
          response = `❌ No encontré procesos cuyo monto comience con "${montoQuery.patron}". Intenta con otro valor o consulta de manera diferente.`;
        }
        
        // Retornar directamente sin hacer más búsquedas
        return {
          response,
          processes,
          hasProcesses,
          metadata
        };
      }

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

        // 3. Ajustar criterios con monto extraído de la consulta (PRIORIDAD)
        if (montoQuery && montoQuery.rango) {
          if (montoQuery.rango.min !== null) {
            criteria.monto_min = montoQuery.rango.min;
          }
          if (montoQuery.rango.max !== null) {
            criteria.monto_max = montoQuery.rango.max;
          }
          logger.info(`[CHATBOT] Usando monto de la consulta: ${criteria.monto_min} - ${criteria.monto_max}`);
        }
        // Si no hay monto en la consulta, usar el del contexto de usuario
        else if (userContext) {
          // 3.1. Agregar keywords de tipos_proyecto si están disponibles
          if (userContext.proyectos_preferidos && userContext.proyectos_preferidos !== 'todos') {
            const tiposProyecto = userContext.proyectos_preferidos.split(', ').map(t => t.toLowerCase());
            criteria.keywords = criteria.keywords || [];
            criteria.keywords.push(...tiposProyecto);
            logger.info(`[CHATBOT] Agregando tipos de proyecto al criterio: ${tiposProyecto.join(', ')}`);
          }

          // 3.2. Ajustar según monto preferido del usuario
          if (userContext.monto_preferido && userContext.monto_preferido !== 'cualquiera') {
            const montoMatch = userContext.monto_preferido.match(/(\d+)\s*-\s*(\d+)/);
            if (montoMatch) {
              criteria.monto_min = parseInt(montoMatch[1]);
              criteria.monto_max = parseInt(montoMatch[2]);
              logger.info(`[CHATBOT] Filtrando por rango de monto del perfil: ${criteria.monto_min} - ${criteria.monto_max}`);
            }
          }

          // 3.3. Aumentar límite si el usuario busca procesos específicos
          criteria.limit = 8;
        }

        // 4. Buscar procesos con criterios completos
        processes = await this.searchProcesses(criteria);
        logger.info(`[CHATBOT] Búsqueda inicial: ${processes.length} procesos encontrados`);

        // 5. FALLBACK NIVEL 1: Si no hay resultados, eliminar filtro de tipos_proyecto
        //    y buscar solo con keywords de la especialidad + monto
        if (processes.length === 0 && userContext && userContext.especialidad && userContext.especialidad !== 'no especificada') {
          logger.info(`[CHATBOT FALLBACK 1] No se encontraron procesos con criterios completos. Intentando con especialidad + monto: ${userContext.especialidad}`);
          
          // Mapeo de especialidades a keywords relevantes
          const especialidadKeywords = {
            'Ingeniería de Sistemas': ['sistema', 'software', 'tecnología', 'informática', 'aplicación', 'desarrollo'],
            'Ingeniería Informática': ['software', 'sistema', 'informática', 'tecnología', 'aplicación'],
            'Ciencias de la Computación': ['software', 'computación', 'sistema', 'tecnología', 'algoritmo'],
            'Ingeniería de Software': ['software', 'desarrollo', 'aplicación', 'sistema', 'programación'],
            'Ingeniería Civil': ['construcción', 'obra', 'infraestructura', 'vía', 'edificación'],
            'Arquitectura': ['diseño', 'construcción', 'edificación', 'proyecto arquitectónico'],
            'default': ['servicio', 'consultoría', 'proyecto']
          };

          const keywords = especialidadKeywords[userContext.especialidad] || especialidadKeywords['default'];
          
          const fallbackCriteria1 = {
            keywords: keywords,
            limit: 10  // Aumentar límite en fallback
          };

          // Mantener filtro de monto si existe
          if (criteria.monto_min || criteria.monto_max) {
            fallbackCriteria1.monto_min = criteria.monto_min;
            fallbackCriteria1.monto_max = criteria.monto_max;
          }

          processes = await this.searchProcesses(fallbackCriteria1);
          logger.info(`[CHATBOT FALLBACK 1] Resultados: ${processes.length} procesos`);
          
          if (processes.length > 0) {
            metadata.usedFallback = true;
            metadata.fallbackLevel = 1;
            metadata.fallbackMessage = `ℹ️ No encontré procesos con todos tus criterios (tipos de proyecto específicos), pero aquí hay ${processes.length} procesos relevantes para tu especialidad (${userContext.especialidad}):`;
            response = metadata.fallbackMessage;
          }
        }

        // 6. FALLBACK NIVEL 2: Si aún no hay resultados, eliminar TODOS los filtros
        //    y buscar SOLO con keywords de la carrera (sin monto, sin tipos_proyecto)
        if (processes.length === 0 && userContext && userContext.especialidad && userContext.especialidad !== 'no especificada') {
          logger.info(`[CHATBOT FALLBACK 2] Sin resultados en fallback 1. Intentando SOLO con especialidad (sin restricción de monto)`);
          
          const especialidadKeywords = {
            'Ingeniería de Sistemas': ['sistema', 'software', 'tecnología', 'informática', 'aplicación', 'desarrollo'],
            'Ingeniería Informática': ['software', 'sistema', 'informática', 'tecnología', 'aplicación'],
            'Ciencias de la Computación': ['software', 'computación', 'sistema', 'tecnología', 'algoritmo'],
            'Ingeniería de Software': ['software', 'desarrollo', 'aplicación', 'sistema', 'programación'],
            'Ingeniería Civil': ['construcción', 'obra', 'infraestructura', 'vía', 'edificación'],
            'Arquitectura': ['diseño', 'construcción', 'edificación', 'proyecto arquitectónico'],
            'default': ['servicio', 'consultoría', 'proyecto']
          };

          const keywords = especialidadKeywords[userContext.especialidad] || especialidadKeywords['default'];
          
          const fallbackCriteria2 = {
            keywords: keywords,
            limit: 15  // Aumentar aún más el límite
            // SIN filtros de monto, tipos_proyecto, ni regiones
          };

          processes = await this.searchProcesses(fallbackCriteria2);
          logger.info(`[CHATBOT FALLBACK 2] Resultados finales: ${processes.length} procesos`);
          
          if (processes.length > 0) {
            metadata.usedFallback = true;
            metadata.fallbackLevel = 2;
            metadata.fallbackMessage = `ℹ️ Amplié la búsqueda considerando SOLO tu carrera (${userContext.especialidad}). Aquí hay ${processes.length} procesos que podrían interesarte (sin restricción de monto ni tipo específico):`;
            response = metadata.fallbackMessage;
          }
        }

        // 6. Generar respuesta final
        if (processes.length > 0 && !metadata.usedFallback) {
          response = this.generateResponse(intentions[0], processes);
        } else if (processes.length === 0) {
          response = this.generateResponse(intentions[0], processes);
        }

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
