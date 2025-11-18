const express = require('express');
const router = express.Router();
const recommendationsController = require('../controllers/recommendationsController');
const { verifyToken } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Recommendations
 *   description: Sistema de recomendaciones personalizadas de procesos
 */

/**
 * @swagger
 * /api/v1/users/me/recommendations:
 *   get:
 *     summary: Obtener recomendaciones personalizadas del usuario
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Cantidad de resultados por página
 *       - in: query
 *         name: only_unseen
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Filtrar solo recomendaciones no vistas
 *     responses:
 *       200:
 *         description: Recomendaciones obtenidas exitosamente
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
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           user_id:
 *                             type: string
 *                             format: uuid
 *                           proceso_id:
 *                             type: integer
 *                           score:
 *                             type: number
 *                           match_tecnologias:
 *                             type: number
 *                           match_region:
 *                             type: number
 *                           match_tipo_proyecto:
 *                             type: number
 *                           match_monto:
 *                             type: number
 *                           seen:
 *                             type: boolean
 *                           notified:
 *                             type: boolean
 *                           recommendation_type:
 *                             type: string
 *                             enum: [MVP, Sprint1, Stack]
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           Proceso:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               numero_proceso:
 *                                 type: string
 *                               descripcion_objeto:
 *                                 type: string
 *                               valor_referencial:
 *                                 type: number
 *                               departamento:
 *                                 type: string
 *                               estado:
 *                                 type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: No autenticado
 */
router.get('/me/recommendations', verifyToken, recommendationsController.getRecommendations);

/**
 * @swagger
 * /api/v1/users/me/recommendations/generate:
 *   post:
 *     summary: Generar nuevas recomendaciones personalizadas
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               force_regenerate:
 *                 type: boolean
 *                 default: false
 *                 description: Si es true, elimina recomendaciones existentes antes de generar nuevas
 *     responses:
 *       200:
 *         description: Recomendaciones generadas exitosamente
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
 *                     generated_count:
 *                       type: integer
 *                     average_score:
 *                       type: number
 *       400:
 *         description: Perfil incompleto
 *       401:
 *         description: No autenticado
 */
router.post('/me/recommendations/generate', verifyToken, recommendationsController.generateRecommendations);

/**
 * @swagger
 * /api/v1/users/me/recommendations/seen:
 *   post:
 *     summary: Marcar recomendaciones como vistas
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recommendation_ids
 *             properties:
 *               recommendation_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *                 description: Array de IDs de recomendaciones a marcar como vistas
 *     responses:
 *       200:
 *         description: Recomendaciones marcadas como vistas exitosamente
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
 *                     marked_count:
 *                       type: integer
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.post('/me/recommendations/seen', verifyToken, recommendationsController.markAsSeen);

/**
 * @swagger
 * /api/v1/users/me/recommendations/stats:
 *   get:
 *     summary: Obtener estadísticas de recomendaciones del usuario
 *     tags: [Recommendations]
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
 *                     total:
 *                       type: integer
 *                     unseen:
 *                       type: integer
 *                     seen:
 *                       type: integer
 *                     average_score:
 *                       type: number
 *       401:
 *         description: No autenticado
 */
router.get('/me/recommendations/stats', verifyToken, recommendationsController.getRecommendationStats);

module.exports = router;
