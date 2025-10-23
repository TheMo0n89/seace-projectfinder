/**
 * Rutas de recomendaciones
 */
const express = require('express');
const router = express.Router();
const recomendacionesController = require('../controllers/recomendacionesController');
const { verifyToken } = require('../middlewares/auth');

/**
 * @swagger
 * /api/v1/recomendaciones/{proceso_id}:
 *   get:
 *     summary: Obtener recomendaciones de un proceso
 *     tags: [💡 Recomendaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proceso_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lista de recomendaciones
 *       404:
 *         description: Proceso no encontrado
 */
router.get('/:proceso_id', verifyToken, recomendacionesController.getProcesoRecomendaciones);

/**
 * @swagger
 * /api/v1/recomendaciones/{proceso_id}/generate:
 *   post:
 *     summary: Generar recomendaciones para un proceso
 *     tags: [💡 Recomendaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proceso_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               force_regenerate:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Generación iniciada
 */
router.post('/:proceso_id/generate', verifyToken, recomendacionesController.generateRecomendaciones);

/**
 * @swagger
 * /api/v1/recomendaciones/{proceso_id}/clear:
 *   delete:
 *     summary: Eliminar recomendaciones de un proceso
 *     tags: [💡 Recomendaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proceso_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Recomendaciones eliminadas
 */
router.delete('/:proceso_id/clear', verifyToken, recomendacionesController.clearProcesoRecomendaciones);

/**
 * @swagger
 * /api/v1/recomendaciones/user/me:
 *   get:
 *     summary: Obtener recomendaciones del usuario actual
 *     tags: [💡 Recomendaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: visible
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Recomendaciones del usuario
 */
router.get('/user/me', verifyToken, recomendacionesController.getUserRecomendaciones);

/**
 * @swagger
 * /api/v1/recomendaciones/{recomendacion_id}/visibility:
 *   put:
 *     summary: Actualizar visibilidad de una recomendación
 *     tags: [💡 Recomendaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recomendacion_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - visible
 *             properties:
 *               visible:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Visibilidad actualizada
 */
router.put('/:recomendacion_id/visibility', verifyToken, recomendacionesController.updateRecomendacionVisibility);

module.exports = router;