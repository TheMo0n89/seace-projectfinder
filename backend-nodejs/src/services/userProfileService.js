/**
 * Servicio de Perfil de Usuario
 * Maneja la obtención y actualización de preferencias del usuario
 */
const { Preferencia, User } = require('../models');
const logger = require('../config/logger');

class UserProfileService {
  /**
   * Obtener perfil completo de usuario
   */
  async getUserProfile(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ['id', 'username', 'email', 'full_name', 'role', 'profile_completed', 'created_at']
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      let preferencia = await Preferencia.findOne({
        where: { user_id: userId }
      });

      // Si no existe preferencia, crear una vacía
      if (!preferencia) {
        preferencia = await Preferencia.create({
          user_id: userId,
          carrera: null,
          regiones_interes: [],
          monto_min: null,
          monto_max: null,
          tipos_proyecto: [],
          notification_frequency: 'semanal'
        });
      }

      return {
        user: user.toJSON(),
        profile: {
          carrera: preferencia.carrera,
          regiones_interes: preferencia.regiones_interes || [],
          monto_min: preferencia.monto_min ? parseFloat(preferencia.monto_min) : null,
          monto_max: preferencia.monto_max ? parseFloat(preferencia.monto_max) : null,
          tipos_proyecto: preferencia.tipos_proyecto || [],
          notification_frequency: preferencia.notification_frequency || 'semanal'
        }
      };
    } catch (error) {
      logger.error(`Error en getUserProfile: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar perfil de usuario
   */
  async updateUserProfile(userId, profileData) {
    try {
      const {
        carrera,
        regiones_interes,
        monto_min,
        monto_max,
        tipos_proyecto,
        notification_frequency
      } = profileData;

      // Validar que al menos un campo esté presente
      if (!carrera && !regiones_interes && 
          !tipos_proyecto && !notification_frequency && monto_min === undefined && monto_max === undefined) {
        throw new Error('Debe proporcionar al menos un campo para actualizar');
      }

      // Buscar o crear preferencia
      let preferencia = await Preferencia.findOne({
        where: { user_id: userId }
      });

      const updateData = {
        user_id: userId,
        updated_at: new Date()
      };

      if (carrera !== undefined) updateData.carrera = carrera;
      if (regiones_interes !== undefined) updateData.regiones_interes = regiones_interes;
      if (monto_min !== undefined) updateData.monto_min = monto_min;
      if (monto_max !== undefined) updateData.monto_max = monto_max;
      if (tipos_proyecto !== undefined) updateData.tipos_proyecto = tipos_proyecto;
      if (notification_frequency !== undefined) updateData.notification_frequency = notification_frequency;

      if (preferencia) {
        await preferencia.update(updateData);
      } else {
        preferencia = await Preferencia.create(updateData);
      }

      // Verificar si el perfil está completo
      const isProfileComplete = this.checkProfileCompleteness({
        carrera: preferencia.carrera,
        regiones_interes: preferencia.regiones_interes,
        monto_min: preferencia.monto_min,
        monto_max: preferencia.monto_max,
        tipos_proyecto: preferencia.tipos_proyecto
      });

      // Actualizar flag de perfil completo en usuario
      await User.update(
        { profile_completed: isProfileComplete },
        { where: { id: userId } }
      );

      logger.info(`Perfil actualizado para usuario ${userId}`, {
        profile_completed: isProfileComplete
      });

      return {
        success: true,
        profile_completed: isProfileComplete,
        profile: {
          carrera: preferencia.carrera,
          regiones_interes: preferencia.regiones_interes || [],
          monto_min: preferencia.monto_min ? parseFloat(preferencia.monto_min) : null,
          monto_max: preferencia.monto_max ? parseFloat(preferencia.monto_max) : null,
          tipos_proyecto: preferencia.tipos_proyecto || [],
          notification_frequency: preferencia.notification_frequency || 'semanal'
        }
      };
    } catch (error) {
      logger.error(`Error en updateUserProfile: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verificar si el perfil está completo
   * Un perfil se considera completo si tiene al menos:
   * - Carrera o especialidad
   * - Al menos 1 región de interés
   * - Al menos 1 tipo de proyecto
   */
  checkProfileCompleteness(profile) {
    return !!(
      profile.carrera &&
      profile.regiones_interes && profile.regiones_interes.length > 0 &&
      profile.tipos_proyecto && profile.tipos_proyecto.length > 0
    );
  }

  /**
   * Obtener estadísticas del perfil
   */
  async getProfileStats(userId) {
    try {
      const preferencia = await Preferencia.findOne({
        where: { user_id: userId }
      });

      if (!preferencia) {
        return {
          completeness: 0,
          missing_fields: ['carrera', 'regiones_interes', 'tipos_proyecto']
        };
      }

      const fields = {
        carrera: !!preferencia.carrera,
        regiones_interes: preferencia.regiones_interes && preferencia.regiones_interes.length > 0,
        monto_range: !!(preferencia.monto_min && preferencia.monto_max),
        tipos_proyecto: preferencia.tipos_proyecto && preferencia.tipos_proyecto.length > 0,
        notification_frequency: !!preferencia.notification_frequency
      };

      const completedFields = Object.values(fields).filter(v => v).length;
      const totalFields = Object.keys(fields).length;
      const completeness = Math.round((completedFields / totalFields) * 100);

      const missingFields = Object.keys(fields).filter(key => !fields[key]);

      return {
        completeness,
        missing_fields: missingFields,
        completed_fields: completedFields,
        total_fields: totalFields
      };
    } catch (error) {
      logger.error(`Error en getProfileStats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar perfil de usuario (mantener usuario, solo limpiar preferencias)
   */
  async clearUserProfile(userId) {
    try {
      const preferencia = await Preferencia.findOne({
        where: { user_id: userId }
      });

      if (preferencia) {
        await preferencia.update({
          carrera: null,
          regiones_interes: [],
          monto_min: null,
          monto_max: null,
          tipos_proyecto: []
        });
      }

      await User.update(
        { profile_completed: false },
        { where: { id: userId } }
      );

      logger.info(`Perfil limpiado para usuario ${userId}`);

      return {
        success: true,
        message: 'Perfil limpiado exitosamente'
      };
    } catch (error) {
      logger.error(`Error en clearUserProfile: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new UserProfileService();
