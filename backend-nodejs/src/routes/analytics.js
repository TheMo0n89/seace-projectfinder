const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Tracking de interacciones y analytics
 */

/**
 * @swagger
 * /api/v1/analytics/recommendation-click:
 *   post:
 *     summary: Registrar click en recomendación
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recommendation_id
 *               - proceso_id
 *             properties:
 *               recommendation_id:
 *                 type: integer
 *               proceso_id:
 *                 type: integer
 *               session_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Click registrado exitosamente
 *       401:
 *         description: No autenticado
 */
router.post('/recommendation-click', verifyToken, analyticsController.trackRecommendationClick);

/**
 * @swagger
 * /api/v1/analytics/me/stats:
 *   get:
 *     summary: Obtener estadísticas de clicks del usuario
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *       401:
 *         description: No autenticado
 */
router.get('/me/stats', verifyToken, analyticsController.getUserClickStats);

/**
 * @swagger
 * /api/v1/analytics/top-processes:
 *   get:
 *     summary: Obtener procesos más clickeados
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top procesos obtenidos exitosamente
 *       401:
 *         description: No autenticado
 */
router.get('/top-processes', verifyToken, analyticsController.getTopClickedProcesses);

module.exports = router;
