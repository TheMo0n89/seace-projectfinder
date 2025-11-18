/**
 * Controlador de Perfil de Usuario
 */
const userProfileService = require('../services/userProfileService');
const recommendationsService = require('../services/recommendationsService');
const logger = require('../config/logger');

class UserProfileController {
  /**
   * GET /api/v1/users/me/profile
   * Obtener perfil del usuario autenticado
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      
      const profile = await userProfileService.getUserProfile(userId);
      
      return res.status(200).json({
        status: 'success',
        data: profile
      });
    } catch (error) {
      logger.error(`Error en getProfile: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Error al obtener el perfil del usuario',
        error: error.message
      });
    }
  }

  /**
   * PATCH /api/v1/users/me/profile
   * Actualizar perfil del usuario autenticado
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const profileData = req.body;

      const result = await userProfileService.updateUserProfile(userId, profileData);

      // Si el perfil se completó, generar recomendaciones automáticamente
      if (result.profile_completed) {
        try {
          await recommendationsService.generateRecommendations(userId, { forceRegenerate: true });
          logger.info(`Recomendaciones generadas automáticamente para usuario ${userId}`);
        } catch (recError) {
          logger.error(`Error al generar recomendaciones: ${recError.message}`);
          // No fallar la actualización del perfil por error en recomendaciones
        }
      }

      return res.status(200).json({
        status: 'success',
        message: result.profile_completed 
          ? 'Perfil actualizado y recomendaciones generadas'
          : 'Perfil actualizado exitosamente',
        data: result
      });
    } catch (error) {
      logger.error(`Error en updateProfile: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Error al actualizar el perfil',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/users/me/profile/stats
   * Obtener estadísticas del perfil
   */
  async getProfileStats(req, res) {
    try {
      const userId = req.user.id;
      
      const stats = await userProfileService.getProfileStats(userId);
      
      return res.status(200).json({
        status: 'success',
        data: stats
      });
    } catch (error) {
      logger.error(`Error en getProfileStats: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Error al obtener estadísticas del perfil',
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/v1/users/me/profile
   * Limpiar perfil del usuario
   */
  async clearProfile(req, res) {
    try {
      const userId = req.user.id;
      
      const result = await userProfileService.clearUserProfile(userId);
      
      return res.status(200).json({
        status: 'success',
        message: result.message
      });
    } catch (error) {
      logger.error(`Error en clearProfile: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Error al limpiar el perfil',
        error: error.message
      });
    }
  }
}

module.exports = new UserProfileController();
