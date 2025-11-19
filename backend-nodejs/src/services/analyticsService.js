/**
 * Servicio de Analytics
 * Proporciona estadísticas y métricas del sistema
 */
const { sequelize } = require('../config/database');
const { QueryTypes, Op } = require('sequelize');
const Proceso = require('../models/Proceso');
const User = require('../models/User');
const ETLLog = require('../models/ETLLog');
const UserInteraction = require('../models/UserInteraction');
const UserRecommendation = require('../models/UserRecommendation');
const ChatbotLog = require('../models/ChatbotLog');
const logger = require('../config/logger');

class AnalyticsService {
  /**
   * Obtener estadísticas generales del dashboard
   */
  async getDashboardStats() {
    try {
      // KPIs principales
      const [procesosActivos, montoTotal, usuariosActivos, saludETL] = await Promise.all([
        this.getProcessCount(),
        this.getTotalAmount(),
        this.getActiveUsersCount(),
        this.getETLHealth()
      ]);

      // Tendencias (últimos 6 meses)
      const tendencias = await this.getTendenciasOportunidades();

      // Top regiones
      const topRegiones = await this.getTopRegiones();

      // Estado de carga ETL (últimas 24h)
      const estadoETL = await this.getEstadoCargaETL();

      // Actividad del chatbot
      const actividadChatbot = await this.getActividadChatbot();

      return {
        kpis: {
          procesosActivos,
          montoTotal,
          usuariosActivos,
          saludETL
        },
        tendencias,
        topRegiones,
        estadoETL,
        actividadChatbot
      };
    } catch (error) {
      logger.error(`Error obteniendo dashboard stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de perfil de usuario específico
   */
  async getUserProfileStats(userId) {
    try {
      const [
        completitudPerfil,
        embudoConversion,
        nubeIntereses,
        historialInteracciones,
        statsRecomendaciones,
        radarMetrics,
        activityHeatmap,
        montoTreemap,
        healthScore
      ] = await Promise.all([
        this.getCompletitudPerfil(userId),
        this.getEmbudoConversion(userId),
        this.getNubeIntereses(userId),
        this.getHistorialInteracciones(userId),
        this.getStatsRecomendaciones(userId),
        this.getRadarMetrics(userId),
        this.getActivityHeatmap(userId),
        this.getMontoTreemap(userId),
        this.getUserHealthScore(userId)
      ]);

      return {
        completitudPerfil,
        embudoConversion,
        nubeIntereses,
        historialInteracciones,
        statsRecomendaciones,
        radarMetrics,
        activityHeatmap,
        montoTreemap,
        healthScore
      };
    } catch (error) {
      logger.error(`Error obteniendo user profile stats: ${error.message}`);
      throw error;
    }
  }

  // ====== MÉTODOS PRIVADOS - KPIs PRINCIPALES ======

  async getProcessCount() {
    const count = await Proceso.count({
      where: {
        estado_proceso: {
          [Op.in]: ['Publicado', 'Convocado', 'En evaluación']
        }
      }
    });

    // Calcular variación vs mes anterior
    const fechaAnterior = new Date();
    fechaAnterior.setMonth(fechaAnterior.getMonth() - 1);

    const countAnterior = await Proceso.count({
      where: {
        fecha_publicacion: { [Op.lt]: fechaAnterior },
        estado_proceso: { [Op.in]: ['Publicado', 'Convocado', 'En evaluación'] }
      }
    });

    const variacion = countAnterior > 0 
      ? ((count - countAnterior) / countAnterior) * 100 
      : 0;

    return {
      total: count,
      variacion: parseFloat(variacion.toFixed(1)),
      tendencia: variacion >= 0 ? 'up' : 'down'
    };
  }

  async getTotalAmount() {
    const result = await Proceso.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('monto_referencial')), 'total']
      ],
      where: {
        monto_referencial: { [Op.not]: null }
      },
      raw: true
    });

    // Calcular variación vs mes anterior
    const fechaAnterior = new Date();
    fechaAnterior.setMonth(fechaAnterior.getMonth() - 1);

    const resultAnterior = await Proceso.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('monto_referencial')), 'total']
      ],
      where: {
        monto_referencial: { [Op.not]: null },
        fecha_publicacion: { [Op.lt]: fechaAnterior }
      },
      raw: true
    });

    const total = parseFloat(result?.total || 0);
    const totalAnterior = parseFloat(resultAnterior?.total || 0);
    const variacion = totalAnterior > 0 
      ? ((total - totalAnterior) / totalAnterior) * 100 
      : 0;

    // Convertir a millones
    const totalMillones = (total / 1000000).toFixed(1);

    return {
      total: `${totalMillones}M`,
      totalRaw: total,
      variacion: parseFloat(variacion.toFixed(1)),
      tendencia: variacion >= 0 ? 'up' : 'down'
    };
  }

  async getActiveUsersCount() {
    const count = await User.count({
      where: {
        is_active: true
      }
    });

    // Calcular nuevos usuarios esta semana
    const fechaSemanaAnterior = new Date();
    fechaSemanaAnterior.setDate(fechaSemanaAnterior.getDate() - 7);

    const nuevosUsuarios = await User.count({
      where: {
        created_at: { [Op.gte]: fechaSemanaAnterior }
      }
    });

    return {
      total: count,
      nuevosEstaSemana: nuevosUsuarios
    };
  }

  async getETLHealth() {
    // Obtener última operación ETL
    const ultimaOperacion = await ETLLog.findOne({
      order: [['created_at', 'DESC']],
      attributes: ['status', 'created_at', 'operation_type']
    });

    if (!ultimaOperacion) {
      return {
        porcentaje: 0,
        estado: 'Sin operaciones',
        ultimaCarga: null
      };
    }

    // Calcular porcentaje de éxito últimas 24h
    const fecha24h = new Date();
    fecha24h.setHours(fecha24h.getHours() - 24);

    const [exitosas, total] = await Promise.all([
      ETLLog.count({
        where: {
          created_at: { [Op.gte]: fecha24h },
          status: 'completed'
        }
      }),
      ETLLog.count({
        where: {
          created_at: { [Op.gte]: fecha24h }
        }
      })
    ]);

    const porcentaje = total > 0 ? (exitosas / total) * 100 : 100;

    return {
      porcentaje: parseFloat(porcentaje.toFixed(1)),
      estado: porcentaje >= 90 ? 'Carga diaria completada' : 'Carga con errores',
      ultimaCarga: ultimaOperacion.created_at
    };
  }

  // ====== TENDENCIAS Y GRÁFICOS ======

  async getTendenciasOportunidades() {
    // Obtener datos de los últimos 6 meses agrupados por mes
    const query = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', fecha_publicacion), 'Mon') as mes,
        COUNT(*) as procesos,
        COALESCE(SUM(monto_referencial), 0) / 1000000 as monto_millones
      FROM procesos
      WHERE fecha_publicacion >= NOW() - INTERVAL '6 months'
      AND fecha_publicacion IS NOT NULL
      GROUP BY DATE_TRUNC('month', fecha_publicacion)
      ORDER BY DATE_TRUNC('month', fecha_publicacion) ASC
    `;

    const resultados = await sequelize.query(query, {
      type: QueryTypes.SELECT
    });

    return resultados.map(r => ({
      mes: r.mes,
      procesos: parseInt(r.procesos),
      monto: parseFloat(parseFloat(r.monto_millones).toFixed(1))
    }));
  }

  async getTopRegiones() {
    const query = `
      SELECT 
        COALESCE(departamento, 'Sin especificar') as departamento,
        COUNT(*) as cantidad
      FROM procesos
      WHERE fecha_publicacion >= NOW() - INTERVAL '3 months'
      GROUP BY departamento
      ORDER BY cantidad DESC
      LIMIT 5
    `;

    const resultados = await sequelize.query(query, {
      type: QueryTypes.SELECT
    });

    return resultados.map(r => ({
      nombre: r.departamento,
      cantidad: parseInt(r.cantidad)
    }));
  }

  async getEstadoCargaETL() {
    const fecha24h = new Date();
    fecha24h.setHours(fecha24h.getHours() - 24);

    const [exitosos, fallidos, pendientes] = await Promise.all([
      ETLLog.count({
        where: {
          created_at: { [Op.gte]: fecha24h },
          status: 'completed'
        }
      }),
      ETLLog.count({
        where: {
          created_at: { [Op.gte]: fecha24h },
          status: 'failed'
        }
      }),
      ETLLog.count({
        where: {
          created_at: { [Op.gte]: fecha24h },
          status: { [Op.in]: ['running', 'pending'] }
        }
      })
    ]);

    return {
      exitosos,
      fallidos,
      pendientes
    };
  }

  async getActividadChatbot() {
    const fecha24h = new Date();
    fecha24h.setHours(fecha24h.getHours() - 24);

    // Total de consultas
    const totalConsultas = await ChatbotLog.count({
      where: {
        created_at: { [Op.gte]: fecha24h }
      }
    });

    // Tiempo promedio de respuesta
    const tiempoPromedio = await ChatbotLog.findOne({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('response_time_ms')), 'promedio']
      ],
      where: {
        created_at: { [Op.gte]: fecha24h },
        response_time_ms: { [Op.not]: null }
      },
      raw: true
    });

    const tiempoPromedioSeg = tiempoPromedio?.promedio 
      ? (parseFloat(tiempoPromedio.promedio) / 1000).toFixed(1)
      : 0;

    return {
      totalConsultas,
      tiempoRespuesta: `${tiempoPromedioSeg}s`
    };
  }

  // ====== ESTADÍSTICAS DE PERFIL DE USUARIO ======

  async getCompletitudPerfil(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['full_name', 'email', 'role', 'profile_completed']
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar preferencias detalladas
    const query = `
      SELECT 
        tipos_proyecto,
        monto_min,
        monto_max
      FROM preferencias
      WHERE user_id = :userId
    `;

    const [preferencias] = await sequelize.query(query, {
      replacements: { userId },
      type: QueryTypes.SELECT
    });

    // Calcular campos completados
    const datosPersonales = user.full_name && user.full_name.trim() !== '';
    const tieneEmail = user.email && user.email.trim() !== '';
    const tieneRubros = preferencias && preferencias.tipos_proyecto && preferencias.tipos_proyecto.length > 0;
    const tieneRangoMontos = preferencias && preferencias.monto_min && preferencias.monto_max;

    const campos = [
      datosPersonales ? 1 : 0,
      tieneEmail ? 1 : 0,
      tieneRubros ? 1 : 0,
      tieneRangoMontos ? 1 : 0
    ];

    const completado = campos.reduce((a, b) => a + b, 0);
    const total = 4;
    const porcentaje = Math.round((completado / total) * 100);

    return {
      porcentaje,
      campos: {
        datosPersonales,
        rubrosInteres: tieneRubros,
        rangoMontos: tieneRangoMontos
      }
    };
  }

  async getEmbudoConversion(userId) {
    const [enviadas, vistas, clicks] = await Promise.all([
      // Recomendaciones enviadas
      UserRecommendation.count({
        where: { user_id: userId }
      }),
      // Recomendaciones vistas (seen)
      UserRecommendation.count({
        where: { 
          user_id: userId,
          seen: true
        }
      }),
      // Interacciones de click
      UserInteraction.count({
        where: {
          user_id: userId,
          tipo_interaccion: 'click'
        }
      })
    ]);

    return {
      enviadas,
      vistas,
      clicks
    };
  }

  async getNubeIntereses(userId) {
    // Buscar por interacciones del usuario con procesos
    const query = `
      SELECT 
        pr.rubro as interes,
        COUNT(ui.id) as frecuencia,
        COALESCE(SUM(pr.monto_referencial), 0) as monto_total
      FROM user_interactions ui
      JOIN procesos pr ON pr.id = ui.proceso_id
      WHERE ui.user_id = :userId
      AND pr.rubro IS NOT NULL
      AND ui.tipo_interaccion IN ('click', 'view')
      GROUP BY pr.rubro
      ORDER BY frecuencia DESC
      LIMIT 5
    `;

    const resultados = await sequelize.query(query, {
      replacements: { userId },
      type: QueryTypes.SELECT
    });

    if (resultados.length === 0) {
      // Si no hay interacciones, obtener desde preferencias
      const queryPreferencias = `
        SELECT 
          UNNEST(tipos_proyecto) as interes,
          1 as frecuencia,
          COALESCE(monto_max, 0) as monto_total
        FROM preferencias
        WHERE user_id = :userId
        AND tipos_proyecto IS NOT NULL
        LIMIT 5
      `;

      const resultadosPreferencias = await sequelize.query(queryPreferencias, {
        replacements: { userId },
        type: QueryTypes.SELECT
      });

      return resultadosPreferencias.map(r => ({
        interes: r.interes,
        frecuencia: parseInt(r.frecuencia),
        monto: parseFloat(r.monto_total) || 0 // Monto real, sin conversión
      }));
    }

    return resultados.map(r => ({
      interes: r.interes,
      frecuencia: parseInt(r.frecuencia),
      monto: parseFloat(r.monto_total) || 0 // Monto real, sin conversión
    }));
  }

  async getHistorialInteracciones(userId) {
    const query = `
      SELECT 
        ui.tipo_interaccion as accion,
        CASE 
          WHEN ui.tipo_interaccion = 'click' THEN pr.nombre_entidad
          WHEN ui.tipo_interaccion = 'chatbot' THEN ui.metadatos->>'pregunta'
          ELSE 'Inicio de sesión exitoso'
        END as detalle,
        ui.timestamp as fecha
      FROM user_interactions ui
      LEFT JOIN procesos pr ON pr.id = ui.proceso_id
      WHERE ui.user_id = :userId
      ORDER BY ui.timestamp DESC
      LIMIT 10
    `;

    const resultados = await sequelize.query(query, {
      replacements: { userId },
      type: QueryTypes.SELECT
    });

    return resultados.map(r => ({
      accion: this.mapTipoInteraccion(r.accion),
      detalle: r.detalle || 'N/A',
      fecha: r.fecha
    }));
  }

  async getStatsRecomendaciones(userId) {
    const query = `
      SELECT 
        COUNT(*) as enviadas,
        COUNT(CASE WHEN seen = true THEN 1 END) as vistas,
        AVG(score) as score_promedio
      FROM user_recommendations
      WHERE user_id = :userId
    `;

    const [result] = await sequelize.query(query, {
      replacements: { userId },
      type: QueryTypes.SELECT
    });

    const enviadas = parseInt(result.enviadas) || 0;
    const vistas = parseInt(result.vistas) || 0;
    const scorePromedio = parseFloat(result.score_promedio) || 0;
    const tasaVista = enviadas > 0 ? ((vistas / enviadas) * 100).toFixed(1) : 0;

    return {
      enviadas,
      vistas,
      tasaVista: parseFloat(tasaVista),
      scorePromedio: parseFloat(scorePromedio.toFixed(1))
    };
  }

  // ====== GRÁFICOS AVANZADOS ======

  async getRadarMetrics(userId) {
    const [actividad, chatbot, clicks, perfil, diversificacion] = await Promise.all([
      this.calcularActividadGeneral(userId),
      this.calcularUsoChatbot(userId),
      this.calcularClicksScore(userId),
      this.getCompletitudPerfil(userId),
      this.calcularDiversificacion(userId)
    ]);

    return {
      actividadGeneral: actividad,
      usoChatbot: chatbot,
      clicksRecomendaciones: clicks,
      completitudPerfil: perfil.porcentaje,
      diversificacionIntereses: diversificacion
    };
  }

  async calcularActividadGeneral(userId) {
    const query = `
      SELECT COUNT(*) as total
      FROM user_interactions
      WHERE user_id = :userId
        AND timestamp >= NOW() - INTERVAL '1 day'
    `;

    const [result] = await sequelize.query(query, {
      replacements: { userId },
      type: QueryTypes.SELECT
    });

    const total = parseInt(result.total) || 0;
    // Normalizar a 0-100 (asumiendo 20 interacciones por día = 100%)
    return Math.min(100, (total / 20) * 100);
  }

  async calcularUsoChatbot(userId) {
    const query = `
      SELECT COUNT(*) as total
      FROM user_interactions
      WHERE user_id = :userId
        AND tipo_interaccion = 'chatbot'
        AND timestamp >= NOW() - INTERVAL '1 day'
    `;

    const [result] = await sequelize.query(query, {
      replacements: { userId },
      type: QueryTypes.SELECT
    });

    const total = parseInt(result.total) || 0;
    // Normalizar a 0-100 (asumiendo 10 consultas por día = 100%)
    return Math.min(100, (total / 10) * 100);
  }

  async calcularClicksScore(userId) {
    const query = `
      SELECT COUNT(*) as total
      FROM user_interactions
      WHERE user_id = :userId
        AND tipo_interaccion = 'click'
        AND timestamp >= NOW() - INTERVAL '1 day'
    `;

    const [result] = await sequelize.query(query, {
      replacements: { userId },
      type: QueryTypes.SELECT
    });

    const clicks = parseInt(result.total) || 0;
    // Normalizar a 0-100 (asumiendo 10 clicks por día = 100%)
    return Math.min(100, (clicks / 10) * 100);
  }

  async calcularDiversificacion(userId) {
    const query = `
      SELECT COUNT(DISTINCT p.rubro) as rubros_unicos
      FROM user_interactions ui
      JOIN procesos p ON p.id = ui.proceso_id
      WHERE ui.user_id = :userId
        AND p.rubro IS NOT NULL
    `;

    const [result] = await sequelize.query(query, {
      replacements: { userId },
      type: QueryTypes.SELECT
    });

    const rubrosUnicos = parseInt(result.rubros_unicos) || 0;
    // Normalizar a 0-100 (asumiendo 10 rubros diferentes = 100%)
    return Math.min(100, (rubrosUnicos / 10) * 100);
  }

  async getActivityHeatmap(userId) {
    const query = `
      SELECT 
        EXTRACT(DOW FROM timestamp) as dia_semana,
        EXTRACT(HOUR FROM timestamp) as hora,
        COUNT(*) as intensidad
      FROM user_interactions
      WHERE user_id = :userId
        AND timestamp >= NOW() - INTERVAL '90 days'
      GROUP BY dia_semana, hora
      ORDER BY dia_semana, hora
    `;

    const resultados = await sequelize.query(query, {
      replacements: { userId },
      type: QueryTypes.SELECT
    });

    return resultados.map(r => ({
      diaSemana: parseInt(r.dia_semana),
      hora: parseInt(r.hora),
      intensidad: parseInt(r.intensidad)
    }));
  }

  async getMontoTreemap(userId) {
    // Obtener procesos de recomendaciones e interacciones
    const query = `
      SELECT DISTINCT
        p.id,
        p.rubro,
        p.tipo_proceso,
        p.nombre_entidad,
        p.objeto_contratacion,
        p.monto_referencial,
        'recommendation' as fuente
      FROM user_recommendations ur
      JOIN procesos p ON p.id = ur.proceso_id
      WHERE ur.user_id = :userId
        AND p.monto_referencial IS NOT NULL
        AND p.monto_referencial > 0
      UNION
      SELECT DISTINCT
        p.id,
        p.rubro,
        p.tipo_proceso,
        p.nombre_entidad,
        p.objeto_contratacion,
        p.monto_referencial,
        'interaction' as fuente
      FROM user_interactions ui
      JOIN procesos p ON p.id = ui.proceso_id
      WHERE ui.user_id = :userId
        AND p.monto_referencial IS NOT NULL
        AND p.monto_referencial > 0
      ORDER BY monto_referencial DESC
      LIMIT 50
    `;

    const procesos = await sequelize.query(query, {
      replacements: { userId },
      type: QueryTypes.SELECT
    });

    if (procesos.length === 0) {
      return [];
    }

    // Agrupar por rubro y tipo
    const grouped = {};
    procesos.forEach(p => {
      const rubro = p.rubro || 'Sin especificar';
      if (!grouped[rubro]) {
        grouped[rubro] = {
          rubro,
          montoTotal: 0,
          subcategorias: {},
          procesos: []
        };
      }
      
      const tipo = p.tipo_proceso || 'Sin especificar';
      if (!grouped[rubro].subcategorias[tipo]) {
        grouped[rubro].subcategorias[tipo] = {
          nombre: tipo,
          monto: 0,
          cantidad: 0,
          procesos: []
        };
      }

      const monto = parseFloat(p.monto_referencial);
      grouped[rubro].montoTotal += monto;
      grouped[rubro].subcategorias[tipo].monto += monto;
      grouped[rubro].subcategorias[tipo].cantidad += 1;
      grouped[rubro].subcategorias[tipo].procesos.push({
        nombre_entidad: p.nombre_entidad,
        objeto_contratacion: p.objeto_contratacion,
        monto: monto
      });
    });

    // Convertir a array y ordenar
    return Object.values(grouped).map(g => ({
      rubro: g.rubro,
      montoTotal: g.montoTotal,
      subcategorias: Object.values(g.subcategorias).sort((a, b) => b.monto - a.monto)
    })).sort((a, b) => b.montoTotal - a.montoTotal);
  }

  async getUserHealthScore(userId) {
    const [actividad, perfil, engagement] = await Promise.all([
      this.calcularActividadUltimos30Dias(userId),
      this.getCompletitudPerfil(userId),
      this.calcularEngagement(userId)
    ]);

    // Fórmula: 40% actividad + 30% perfil + 30% engagement
    const score = (actividad * 0.4) + (perfil.porcentaje * 0.3) + (engagement * 0.3);
    const roundedScore = Math.round(score);

    return {
      score: roundedScore,
      nivel: roundedScore >= 80 ? 'Muy activo' : roundedScore >= 50 ? 'Moderado' : 'Inactivo',
      color: roundedScore >= 80 ? '#10b981' : roundedScore >= 50 ? '#f59e0b' : '#ef4444',
      desglose: {
        actividad,
        completitudPerfil: perfil.porcentaje,
        engagement
      }
    };
  }

  async calcularActividadUltimos30Dias(userId) {
    const query = `
      SELECT COUNT(*) as total
      FROM user_interactions
      WHERE user_id = :userId
        AND timestamp >= NOW() - INTERVAL '30 days'
    `;

    const [result] = await sequelize.query(query, {
      replacements: { userId },
      type: QueryTypes.SELECT
    });

    const total = parseInt(result.total) || 0;
    // Normalizar: 50 interacciones en 30 días = 100%
    return Math.min(100, (total / 50) * 100);
  }

  async calcularEngagement(userId) {
    const [enviadas, vistas, clicks] = await Promise.all([
      UserRecommendation.count({ where: { user_id: userId } }),
      UserRecommendation.count({ where: { user_id: userId, seen: true } }),
      UserInteraction.count({ where: { user_id: userId, tipo_interaccion: 'click' } })
    ]);

    if (enviadas === 0) return 0;

    const tasaVista = (vistas / enviadas) * 100;
    const tasaClick = (clicks / enviadas) * 100;
    
    // 50% peso a tasa de vista, 50% a tasa de click
    const engagement = (tasaVista * 0.5) + (tasaClick * 0.5);
    return Math.min(100, engagement);
  }

  // ====== HELPERS ======

  mapTipoInteraccion(tipo) {
    const map = {
      'click': 'Click',
      'view': 'Vista',
      'chatbot': 'Chatbot',
      'login': 'Login',
      'search': 'Búsqueda'
    };
    return map[tipo] || tipo;
  }
}

module.exports = new AnalyticsService();
