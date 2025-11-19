/**
 * Servicio de Recomendaciones Personalizadas
 * Implementa algoritmo de scoring basado en perfil de usuario
 * Pesos: Tecnologías 40%, Región 25%, Tipo Proyecto 20%, Monto 15%
 */
const { UserRecommendation, Preferencia, Proceso, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

class RecommendationsService {
  /**
   * Generar recomendaciones personalizadas para un usuario
   */
  async generateRecommendations(userId, options = {}) {
    try {
      const { forceRegenerate = false, limit = 10 } = options;

      // Obtener usuario con preferencias
      const user = await User.findByPk(userId);
      if (!user) {
        logger.warn(`Usuario ${userId} no encontrado`);
        return {
          message: 'Usuario no encontrado',
          recommendations_generated: 0
        };
      }

      // Obtener preferencias del usuario
      const preferencia = await Preferencia.findOne({
        where: { user_id: userId }
      });

      if (!preferencia) {
        logger.warn(`Usuario ${userId} no tiene preferencias configuradas`);
        return {
          message: 'El usuario debe completar su perfil para recibir recomendaciones',
          recommendations_generated: 0,
          recommendation: 'Complete su perfil en la sección de Perfil para recibir recomendaciones personalizadas'
        };
      }

      // Validar que tenga al menos algunos campos del perfil completados para mejores recomendaciones
      const warnings = [];
      if (!preferencia.regiones_interes || preferencia.regiones_interes.length === 0) {
        warnings.push('Agregue regiones de interés para recomendaciones más relevantes (peso 40%)');
      }
      if (!preferencia.tipos_proyecto || preferencia.tipos_proyecto.length === 0) {
        warnings.push('Seleccione tipos de proyecto para filtrar mejor (peso 40%)');
      }
      if (!preferencia.monto_min && !preferencia.monto_max) {
        warnings.push('Configure rango de monto para recomendaciones ajustadas a su presupuesto (peso 20%)');
      }

      if (warnings.length > 0) {
        logger.info(`Usuario ${userId} tiene ${warnings.length} campos opcionales sin completar`);
      }

      // Si no es regeneración forzada, verificar según frecuencia del usuario
      if (!forceRegenerate) {
        const lastGenerated = user.last_recommendations_generated_at;
        const frequency = preferencia.notification_frequency || 'semanal';
        
        if (lastGenerated && !this.shouldGenerateRecommendations(frequency, lastGenerated)) {
          const nextDate = this.calculateNextGeneration(frequency, lastGenerated);
          const existingCount = await UserRecommendation.count({ where: { user_id: userId } });
          
          logger.info(`Usuario ${userId}: No es tiempo de generar (frecuencia: ${frequency})`);
          return {
            message: `Ya tienes ${existingCount} recomendaciones activas. La próxima generación automática será el ${nextDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}`,
            existing_recommendations: existingCount,
            next_generation: nextDate,
            generated_count: 0,
            recommendations_generated: 0,
            info: 'Usa el botón "Buscar Nuevas" para forzar una búsqueda inmediata (ignorando la frecuencia configurada)'
          };
        }
      } else {
        logger.info(`Usuario ${userId}: Generación forzada manual (ignorando frecuencia)`);
      }

      // Obtener procesos activos (publicados, no adjudicados)
      const procesos = await Proceso.findAll({
        where: {
          estado_proceso: {
            [Op.in]: ['Publicado', 'En Evaluación', 'Convocado']
          }
        },
        limit: 500 // Limitar cantidad de procesos a evaluar
      });

      if (procesos.length === 0) {
        return {
          message: 'No hay procesos activos disponibles en este momento',
          recommendations_generated: 0,
          generated_count: 0,
          info: 'El sistema actualiza los procesos periódicamente. Intenta de nuevo más tarde.'
        };
      }

      logger.info(`Generando recomendaciones para usuario ${userId} con ${procesos.length} procesos`);

      // Calcular score para cada proceso
      const scoredProcesses = [];
      let maxScore = 0;
      let minScore = 100;
      
      for (const proceso of procesos) {
        const score = await this.calculateScore(preferencia, proceso);
        
        // Tracking de scores para debugging
        if (score.total > maxScore) maxScore = score.total;
        if (score.total < minScore) minScore = score.total;
        
        // Threshold más bajo para capturar más procesos (30 en lugar de 50)
        if (score.total >= 30) {
          scoredProcesses.push({
            proceso_id: proceso.id,
            score: score.total,
            match_region: score.region,
            match_tipo_proyecto: score.tipo_proyecto,
            match_monto: score.monto,
            match_carrera: score.carrera || 0
          });
        }
      }

      logger.info(`Score range: min=${minScore.toFixed(1)}, max=${maxScore.toFixed(1)}, matches con score>=30: ${scoredProcesses.length}`);

      // Ordenar por score descendente y tomar top N
      scoredProcesses.sort((a, b) => b.score - a.score);
      const topProcesses = scoredProcesses.slice(0, limit);

      // Si no hay procesos que cumplan el threshold
      if (topProcesses.length === 0) {
        logger.warn(`No se encontraron procesos con score >= 30 para usuario ${userId}`);
        return {
          message: 'No se encontraron procesos que coincidan suficientemente con tu perfil',
          recommendations_generated: 0,
          generated_count: 0,
          info: 'Intenta ampliar tus preferencias o ajustar los filtros en tu perfil',
          debug: {
            processes_evaluated: procesos.length,
            min_score: minScore.toFixed(1),
            max_score: maxScore.toFixed(1),
            threshold: 30
          }
        };
      }

      // Obtener recomendaciones existentes para no duplicar
      const existingRecommendations = await UserRecommendation.findAll({
        where: { user_id: userId },
        attributes: ['proceso_id', 'seen', 'notified', 'id']
      });

      const existingProcesoIds = new Set(existingRecommendations.map(r => r.proceso_id));
      const seenProcesoIds = new Set(
        existingRecommendations.filter(r => r.seen).map(r => r.proceso_id)
      );

      // Filtrar procesos que ya están en recomendaciones
      const newProcesses = topProcesses.filter(item => !existingProcesoIds.has(item.proceso_id));

      logger.info(`Procesos evaluados: ${topProcesses.length}, Ya existentes: ${existingProcesoIds.size}, Nuevos a agregar: ${newProcesses.length}`);

      // Si no hay nuevos procesos que agregar
      if (newProcesses.length === 0) {
        const existingCount = existingRecommendations.length;
        const seenCount = seenProcesoIds.size;
        const unseenCount = existingCount - seenCount;

        logger.info(`Usuario ${userId}: No hay nuevas recomendaciones. Existentes: ${existingCount} (${seenCount} vistas, ${unseenCount} no vistas)`);
        
        return {
          message: `Ya tienes todas las mejores recomendaciones disponibles (${existingCount} total)`,
          recommendations_generated: 0,
          generated_count: 0,
          existing_recommendations: existingCount,
          seen_count: seenCount,
          unseen_count: unseenCount,
          info: existingCount > 0 
            ? `Mantienes ${seenCount} recomendaciones vistas y ${unseenCount} pendientes. No hay nuevos procesos que cumplan con tu perfil en este momento.`
            : 'No hay procesos disponibles que coincidan con tu perfil. Intenta ajustar tus preferencias.'
        };
      }

      // Insertar solo nuevas recomendaciones (sin eliminar las existentes)
      const recommendations = await Promise.all(
        newProcesses.map((item, index) => 
          UserRecommendation.create({
            user_id: userId,
            proceso_id: item.proceso_id,
            score: item.score,
            match_region: item.match_region,
            match_tipo_proyecto: item.match_tipo_proyecto,
            match_monto: item.match_monto,
            match_carrera: item.match_carrera || 0,
            seen: false,
            notified: false,
            recommendation_type: index === 0 ? 'MVP' : (index === 1 ? 'Sprint1' : 'Stack')
          })
        )
      );

      // Actualizar fecha de última generación
      await User.update(
        { last_recommendations_generated_at: new Date() },
        { where: { id: userId } }
      );

      const totalRecommendations = existingRecommendations.length + recommendations.length;
      const seenCount = seenProcesoIds.size;
      const unseenCount = totalRecommendations - seenCount;

      logger.info(`Agregadas ${recommendations.length} nuevas recomendaciones para usuario ${userId}. Total: ${totalRecommendations}`);

      const response = {
        message: `Se agregaron ${recommendations.length} nuevas recomendaciones`,
        recommendations_generated: recommendations.length,
        generated_count: recommendations.length,
        total_recommendations: totalRecommendations,
        seen_count: seenCount,
        unseen_count: unseenCount,
        average_score: recommendations.length > 0 
          ? recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length 
          : 0,
        info: `Total de recomendaciones: ${totalRecommendations} (${seenCount} vistas, ${unseenCount} pendientes)`
      };

      // Agregar warnings si hay campos opcionales sin completar
      if (warnings.length > 0) {
        response.warnings = warnings;
        response.profile_completion_tips = 'Complete estos campos en su perfil para obtener recomendaciones más precisas';
      }

      return response;
    } catch (error) {
      logger.error(`Error en generateRecommendations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calcular si debe generar recomendaciones según la frecuencia
   */
  shouldGenerateRecommendations(frequency, lastGenerated) {
    if (!lastGenerated) return true;

    const now = new Date();
    const lastGeneratedDate = new Date(lastGenerated);
    const daysSinceLastGeneration = Math.floor((now - lastGeneratedDate) / (1000 * 60 * 60 * 24));

    switch (frequency) {
      case 'diaria':
        return daysSinceLastGeneration >= 1;
      case 'cada_3_dias':
        return daysSinceLastGeneration >= 3;
      case 'semanal':
        return daysSinceLastGeneration >= 7;
      case 'mensual':
        return daysSinceLastGeneration >= 30;
      default:
        return false;
    }
  }

  /**
   * Calcular fecha de próxima generación
   */
  calculateNextGeneration(frequency, lastGenerated) {
    const lastDate = new Date(lastGenerated);
    const days = {
      'diaria': 1,
      'cada_3_dias': 3,
      'semanal': 7,
      'mensual': 30
    };

    const daysToAdd = days[frequency] || 7;
    return new Date(lastDate.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
  }

  /**
   * Calcular score de un proceso según perfil de usuario
   * Pesos dinámicos:
   * - Con monto: Región 40%, Tipo Proyecto 40%, Monto 20%
   * - Sin monto: Región 35%, Tipo Proyecto 35%, Carrera 30%
   */
  async calculateScore(preferencia, proceso) {
    // Verificar si hay monto disponible
    const hasAmount = proceso.monto_referencial && parseFloat(proceso.monto_referencial) > 0;

    // Pesos dinámicos según disponibilidad de monto
    const weights = hasAmount 
      ? {
          region: 0.40,
          tipo_proyecto: 0.40,
          monto: 0.20,
          carrera: 0.0
        }
      : {
          region: 0.35,
          tipo_proyecto: 0.35,
          monto: 0.0,
          carrera: 0.30
        };

    // Score de región
    const scoreRegion = this.calculateRegionMatch(
      preferencia.regiones_interes || [],
      proceso.departamento,
      proceso.provincia
    );

    // Score de tipo de proyecto
    const scoreTipoProyecto = this.calculateProjectTypeMatch(
      preferencia.tipos_proyecto || [],
      proceso.objeto_contratacion || '',
      proceso.descripcion_objeto || ''
    );

    // Score de monto (solo si está disponible)
    const scoreMonto = hasAmount 
      ? this.calculateAmountMatch(
          preferencia.monto_min,
          preferencia.monto_max,
          proceso.monto_referencial
        )
      : 0;

    // Score de carrera (como compensación cuando no hay monto)
    const scoreCarrera = !hasAmount && preferencia.carrera
      ? this.calculateCareerMatch(
          preferencia.carrera,
          proceso.objeto_contratacion || '',
          proceso.descripcion_objeto || '',
          proceso.entidad_nombre || ''
        )
      : 0;

    // Score total ponderado
    const total = 
      (scoreRegion * weights.region * 100) +
      (scoreTipoProyecto * weights.tipo_proyecto * 100) +
      (scoreMonto * weights.monto * 100) +
      (scoreCarrera * weights.carrera * 100);

    return {
      total: Math.round(total * 10) / 10,
      region: Math.round(scoreRegion * 100),
      tipo_proyecto: Math.round(scoreTipoProyecto * 100),
      monto: Math.round(scoreMonto * 100),
      carrera: Math.round(scoreCarrera * 100),
      has_amount: hasAmount
    };
  }

  /**
   * Calcular coincidencia de tecnologías
   */
  calculateTechnologyMatch(userTechs, descripcion, objetoContratacion) {
    if (!userTechs || userTechs.length === 0) return 0;

    const text = `${descripcion} ${objetoContratacion}`.toLowerCase();
    let matches = 0;

    for (const tech of userTechs) {
      const techLower = tech.toLowerCase();
      if (text.includes(techLower)) {
        matches++;
      }
    }

    return matches / userTechs.length; // 0 a 1
  }

  /**
   * Calcular coincidencia de región
   */
  calculateRegionMatch(userRegions, procesoDepartamento, procesoProvincia) {
    if (!userRegions || userRegions.length === 0) return 0.5; // Neutral si no especifica
    if (!procesoDepartamento) return 0;

    // Coincidencia exacta de departamento
    const departamentoMatch = userRegions.some(region => 
      procesoDepartamento.toLowerCase().includes(region.toLowerCase()) ||
      region.toLowerCase().includes(procesoDepartamento.toLowerCase())
    );

    if (departamentoMatch) return 1.0;

    // Coincidencia parcial de provincia
    if (procesoProvincia) {
      const provinciaMatch = userRegions.some(region =>
        procesoProvincia.toLowerCase().includes(region.toLowerCase()) ||
        region.toLowerCase().includes(procesoProvincia.toLowerCase())
      );
      if (provinciaMatch) return 0.7;
    }

    return 0;
  }

  /**
   * Calcular coincidencia de tipo de proyecto
   */
  calculateProjectTypeMatch(userTypes, objetoContratacion, descripcion) {
    if (!userTypes || userTypes.length === 0) return 0.5; // Neutral si no especifica

    const text = `${objetoContratacion} ${descripcion}`.toLowerCase();
    let maxMatch = 0;

    // Keywords expandidos y más flexibles para Ingeniería de Software
    const typeKeywords = {
      'Mantenimiento de Software': ['mantenimiento', 'soporte', 'actualización', 'operación', 'administración', 'gestión', 'software', 'sistema', 'aplicación', 'plataforma'],
      'Desarrollo Web': ['desarrollo', 'web', 'portal', 'sitio', 'página', 'internet', 'online', 'digital', 'sistema', 'plataforma', 'aplicación'],
      'Desarrollo Móvil': ['móvil', 'mobile', 'app', 'android', 'ios', 'aplicación', 'celular', 'smartphone'],
      'DevOps': ['devops', 'ci/cd', 'jenkins', 'docker', 'kubernetes', 'automatización', 'deploy', 'integración continua'],
      'Testing QA': ['testing', 'pruebas', 'qa', 'calidad', 'test', 'validación', 'verificación'],
      'Arquitectura de Software': ['arquitectura', 'diseño', 'modelado', 'infraestructura', 'plataforma', 'sistema'],
      'Software a medida': ['desarrollo', 'software', 'aplicación', 'sistema', 'plataforma', 'web', 'móvil', 'personalizado', 'medida'],
      'Infraestructura': ['servidor', 'hardware', 'red', 'infraestructura', 'equipamiento', 'datacenter', 'ti', 'tecnología'],
      'Ciberseguridad': ['seguridad', 'firewall', 'antivirus', 'cifrado', 'protección', 'vulnerabilidad', 'ciberseguridad'],
      'Cloud': ['nube', 'cloud', 'aws', 'azure', 'google cloud', 'saas', 'iaas', 'paas'],
      'Business Intelligence': ['bi', 'business intelligence', 'análisis', 'reportes', 'dashboard', 'analytics', 'datos', 'data'],
      'Consultoría': ['consultoría', 'asesoría', 'evaluación', 'auditoría', 'diagnóstico', 'servicio'],
      'Licenciamiento': ['licencia', 'software', 'microsoft', 'oracle', 'sap', 'renovación', 'adquisición'],
      'Soporte y Mantenimiento': ['soporte', 'mantenimiento', 'operación', 'administración', 'gestión', 'servicio', 'técnico']
    };

    for (const userType of userTypes) {
      const keywords = typeKeywords[userType] || [userType.toLowerCase()];
      let typeMatch = 0;
      
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          typeMatch++;
        }
      }

      // Scoring más generoso: si encuentra al menos 1 keyword de 10, ya es 10%
      const matchScore = typeMatch > 0 ? Math.min(typeMatch / Math.max(keywords.length * 0.3, 1), 1) : 0;
      maxMatch = Math.max(maxMatch, matchScore);
    }

    // Si no hay match exacto pero el texto contiene palabras genéricas de TI, dar score mínimo
    if (maxMatch === 0) {
      const genericTIWords = ['sistema', 'software', 'tecnología', 'informática', 'digital', 'electrónico', 'automatización'];
      for (const word of genericTIWords) {
        if (text.includes(word)) {
          return 0.3; // 30% por match genérico
        }
      }
    }

    return maxMatch;
  }

  /**
   * Calcular coincidencia de monto
   */
  calculateAmountMatch(userMin, userMax, procesoMonto) {
    if (!userMin && !userMax) return 0.5; // Neutral si no especifica
    if (!procesoMonto || procesoMonto <= 0) return 0;

    const monto = parseFloat(procesoMonto);
    const min = userMin ? parseFloat(userMin) : 0;
    const max = userMax ? parseFloat(userMax) : Infinity;

    // Dentro del rango exacto
    if (monto >= min && monto <= max) return 1.0;

    // Fuera del rango pero cercano (±30%)
    const tolerance = 0.3;
    if (monto < min) {
      const diff = (min - monto) / min;
      if (diff <= tolerance) return 1.0 - (diff / tolerance) * 0.5; // 0.5 a 1.0
    } else {
      const diff = (monto - max) / max;
      if (diff <= tolerance) return 1.0 - (diff / tolerance) * 0.5;
    }

    return 0;
  }

  /**
   * Calcular coincidencia de carrera (usado cuando no hay monto disponible)
   * Evalúa la relevancia del proceso según la carrera del usuario
   */
  calculateCareerMatch(userCarrera, objetoContratacion, descripcion, entidadNombre) {
    if (!userCarrera) return 0.5; // Neutral si no especifica

    const text = `${objetoContratacion} ${descripcion} ${entidadNombre}`.toLowerCase();
    const carreraLower = userCarrera.toLowerCase();

    // Palabras clave por carrera que indican alta relevancia
    const careerKeywords = {
      'ingeniería de sistemas': {
        high: ['sistema', 'informático', 'tecnología', 'ti', 'software', 'desarrollo', 'base de datos', 'red'],
        medium: ['digital', 'automatización', 'integración', 'plataforma', 'aplicación']
      },
      'ingeniería de software': {
        high: ['software', 'desarrollo', 'aplicación', 'programación', 'web', 'móvil', 'app'],
        medium: ['sistema', 'plataforma', 'digital', 'tecnología', 'solución']
      },
      'ciencias de la computación': {
        high: ['inteligencia artificial', 'machine learning', 'ia', 'algoritmo', 'data', 'análisis'],
        medium: ['sistema', 'software', 'tecnología', 'investigación', 'innovación']
      },
      'ingeniería informática': {
        high: ['red', 'infraestructura', 'servidor', 'hardware', 'datacenter', 'telecomunicaciones'],
        medium: ['sistema', 'tecnología', 'seguridad', 'soporte', 'mantenimiento']
      },
      'ingeniería electrónica': {
        high: ['electrónico', 'hardware', 'equipo', 'dispositivo', 'telecomunicaciones', 'iot'],
        medium: ['sistema', 'automatización', 'control', 'infraestructura']
      },
      'ingeniería industrial': {
        high: ['erp', 'gestión', 'proceso', 'producción', 'logística', 'supply chain', 'optimización'],
        medium: ['sistema', 'mejora', 'control', 'calidad', 'recursos']
      },
      'administración': {
        high: ['gestión', 'administración', 'gerencia', 'recursos', 'proyecto', 'planificación'],
        medium: ['sistema', 'organización', 'control', 'supervisión', 'coordinación']
      },
      'contabilidad': {
        high: ['contable', 'financiero', 'tributario', 'facturación', 'siga', 'siaf'],
        medium: ['sistema', 'gestión', 'control', 'auditoría', 'registro']
      },
      'arquitectura': {
        high: ['arquitectura', 'diseño', 'plano', 'construcción', 'obra', 'edificación', 'bim'],
        medium: ['proyecto', 'planificación', 'supervisión', 'infraestructura']
      },
      'ingeniería civil': {
        high: ['civil', 'construcción', 'obra', 'infraestructura', 'vial', 'saneamiento'],
        medium: ['proyecto', 'supervisión', 'control', 'gestión']
      }
    };

    // Buscar keywords de la carrera
    let keywords = null;
    for (const [career, kw] of Object.entries(careerKeywords)) {
      if (carreraLower.includes(career) || career.includes(carreraLower)) {
        keywords = kw;
        break;
      }
    }

    // Si no se encuentra keywords específicas, buscar coincidencia directa
    if (!keywords) {
      // Coincidencia directa de la carrera en el texto
      if (text.includes(carreraLower)) return 0.8;
      
      // Buscar palabras clave genéricas de TI
      const genericTechKeywords = ['sistema', 'software', 'tecnología', 'informático', 'digital'];
      let techMatches = 0;
      for (const keyword of genericTechKeywords) {
        if (text.includes(keyword)) techMatches++;
      }
      
      return techMatches > 0 ? 0.5 + (techMatches / genericTechKeywords.length) * 0.3 : 0.3;
    }

    // Calcular score basado en coincidencias
    let highMatches = 0;
    let mediumMatches = 0;

    for (const keyword of keywords.high) {
      if (text.includes(keyword)) highMatches++;
    }

    for (const keyword of keywords.medium) {
      if (text.includes(keyword)) mediumMatches++;
    }

    // Score ponderado: high keywords valen más
    if (highMatches > 0) {
      return 0.7 + Math.min(highMatches / keywords.high.length, 1.0) * 0.3; // 0.7 a 1.0
    } else if (mediumMatches > 0) {
      return 0.4 + Math.min(mediumMatches / keywords.medium.length, 1.0) * 0.3; // 0.4 a 0.7
    }

    return 0.3; // Score mínimo por relevancia general
  }

  /**
   * Obtener recomendaciones de un usuario
   */
  async getUserRecommendations(userId, options = {}) {
    try {
      const { page = 1, limit = 20, onlyUnseen = false } = options;
      const offset = (page - 1) * limit;

      const whereClause = { user_id: userId };
      if (onlyUnseen) {
        whereClause.seen = false;
      }

      const { count, rows } = await UserRecommendation.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Proceso,
            as: 'proceso',
            attributes: [
              'id', 'nomenclatura', 'entidad_nombre', 'objeto_contratacion',
              'descripcion_objeto', 'monto_referencial', 'moneda', 'departamento',
              'estado_proceso', 'fecha_publicacion', 'url_proceso'
            ]
          }
        ],
        order: [['score', 'DESC'], ['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      return {
        items: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
        unseen_count: await UserRecommendation.count({
          where: { user_id: userId, seen: false }
        })
      };
    } catch (error) {
      logger.error(`Error en getUserRecommendations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Marcar recomendaciones como vistas
   */
  async markAsSeen(userId, recommendationIds) {
    try {
      const updated = await UserRecommendation.update(
        { seen: true },
        {
          where: {
            user_id: userId,
            id: {
              [Op.in]: recommendationIds
            }
          }
        }
      );

      logger.info(`Marcadas ${updated[0]} recomendaciones como vistas para usuario ${userId}`);

      return {
        success: true,
        updated_count: updated[0]
      };
    } catch (error) {
      logger.error(`Error en markAsSeen: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de recomendaciones del usuario
   */
  async getRecommendationStats(userId) {
    try {
      const total = await UserRecommendation.count({
        where: { user_id: userId }
      });

      const unseen = await UserRecommendation.count({
        where: { user_id: userId, seen: false }
      });

      const avgScore = await UserRecommendation.findOne({
        where: { user_id: userId },
        attributes: [
          [require('sequelize').fn('AVG', require('sequelize').col('score')), 'avg_score']
        ],
        raw: true
      });

      return {
        total: total,
        unseen: unseen,
        seen: total - unseen,
        average_score: avgScore?.avg_score ? Math.round(avgScore.avg_score * 10) / 10 : 0
      };
    } catch (error) {
      logger.error(`Error en getRecommendationStats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Limpiar recomendaciones antiguas (más de 30 días)
   */
  async cleanOldRecommendations() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const deleted = await UserRecommendation.destroy({
        where: {
          created_at: {
            [Op.lt]: thirtyDaysAgo
          }
        }
      });

      logger.info(`Eliminadas ${deleted} recomendaciones antiguas`);

      return {
        success: true,
        deleted_count: deleted
      };
    } catch (error) {
      logger.error(`Error en cleanOldRecommendations: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new RecommendationsService();
