const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController');
const { verifyToken } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: User Profile
 *   description: Gestión del perfil de usuario y preferencias
 */

/**
 * @swagger
 * /api/v1/users/me/profile:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                         profile_completed:
 *                           type: boolean
 *                     preferencia:
 *                       type: object
 *                       properties:
 *                         carrera:
 *                           type: string
 *                         tecnologias:
 *                           type: array
 *                           items:
 *                             type: string
 *                         tamano_empresa:
 *                           type: string
 *                         regiones_interes:
 *                           type: array
 *                           items:
 *                             type: string
 *                         monto_min:
 *                           type: number
 *                         monto_max:
 *                           type: number
 *                         tipos_proyecto:
 *                           type: array
 *                           items:
 *                             type: string
 *                         notification_frequency:
 *                           type: string
 *       401:
 *         description: No autenticado
 */
router.get('/me/profile', verifyToken, userProfileController.getProfile);

/**
 * @swagger
 * /api/v1/users/me/profile:
 *   patch:
 *     summary: Actualizar perfil del usuario autenticado
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               carrera:
 *                 type: string
 *                 example: Ingeniería de Sistemas
 *               tecnologias:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["JavaScript", "Python", "React"]
 *               tamano_empresa:
 *                 type: string
 *                 enum: [Pequeña, Mediana, Grande, No especificado]
 *                 example: Mediana
 *               regiones_interes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Lima", "Arequipa"]
 *               monto_min:
 *                 type: number
 *                 example: 50000
 *               monto_max:
 *                 type: number
 *                 example: 500000
 *               tipos_proyecto:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["desarrollo_software", "consultoria"]
 *               notification_frequency:
 *                 type: string
 *                 enum: [diaria, cada_3_dias, semanal, mensual]
 *                 example: semanal
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.patch('/me/profile', verifyToken, userProfileController.updateProfile);

/**
 * @swagger
 * /api/v1/users/me/profile/stats:
 *   get:
 *     summary: Obtener estadísticas de completitud del perfil
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile_completed:
 *                       type: boolean
 *                     completion_percentage:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *                     missing_fields:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: No autenticado
 */
router.get('/me/profile/stats', verifyToken, userProfileController.getProfileStats);

/**
 * @swagger
 * /api/v1/users/me/profile:
 *   delete:
 *     summary: Limpiar perfil del usuario (restablecer valores por defecto)
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil limpiado exitosamente
 *       401:
 *         description: No autenticado
 */
router.delete('/me/profile', verifyToken, userProfileController.clearProfile);

module.exports = router;
