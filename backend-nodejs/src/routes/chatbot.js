/**
 * Rutas de Chatbot
 */
const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { verifyToken } = require('../middlewares/auth');

/**
 * @swagger
 * /api/v1/chatbot/health:
 *   get:
 *     summary: Health check del servicio de chatbot
 *     tags: [🤖 Chatbot]
 *     responses:
 *       200:
 *         description: Estado del servicio
 */
router.get('/health', chatbotController.health);

/**
 * @swagger
 * /api/v1/chatbot/query:
 *   post:
 *     summary: Procesar consulta del chatbot
 *     tags: [🤖 Chatbot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *               session_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Respuesta del chatbot
 */
router.post('/query', verifyToken, chatbotController.query);

/**
 * @swagger
 * /api/v1/chatbot/suggestions:
 *   get:
 *     summary: Obtener sugerencias de consultas
 *     tags: [🤖 Chatbot]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sugerencias
 */
router.get('/suggestions', verifyToken, chatbotController.getSuggestions);

/**
 * @swagger
 * /api/v1/chatbot/history/{session_id}:
 *   get:
 *     summary: Obtener historial de chat
 *     tags: [🤖 Chatbot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Historial del chat
 */
router.get('/history/:session_id', verifyToken, chatbotController.getChatHistory);

/**
 * @swagger
 * /api/v1/chatbot/stats:
 *   get:
 *     summary: Obtener estadísticas del chatbot
 *     tags: [🤖 Chatbot]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas del chatbot
 */
router.get('/stats', verifyToken, chatbotController.getStats);

module.exports = router;