 /**
 * Rutas de Sesiones de Chat
 */
const express = require('express');
const router = express.Router();
const chatSessionController = require('../controllers/chatSessionController');
const { verifyToken } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(verifyToken);

/**
 * @route   GET /api/v1/chat/sessions
 * @desc    Obtener todas las sesiones de chat del usuario
 * @access  Private
 */
router.get('/sessions', chatSessionController.getUserSessions);

/**
 * @route   POST /api/v1/chat/sessions
 * @desc    Crear nueva sesión de chat (máximo 5 activas)
 * @access  Private
 */
router.post('/sessions', chatSessionController.createSession);

/**
 * @route   GET /api/v1/chat/sessions/:sessionId
 * @desc    Obtener sesión específica con todos sus mensajes
 * @access  Private
 */
router.get('/sessions/:sessionId', chatSessionController.getSession);

/**
 * @route   POST /api/v1/chat/sessions/:sessionId/messages
 * @desc    Agregar mensaje a una sesión
 * @access  Private
 */
router.post('/sessions/:sessionId/messages', chatSessionController.addMessage);

/**
 * @route   DELETE /api/v1/chat/sessions/:sessionId
 * @desc    Eliminar sesión de chat (soft delete)
 * @access  Private
 */
router.delete('/sessions/:sessionId', chatSessionController.deleteSession);

/**
 * @route   PATCH /api/v1/chat/sessions/:sessionId/title
 * @desc    Actualizar título de la sesión
 * @access  Private
 */
router.patch('/sessions/:sessionId/title', chatSessionController.updateTitle);

/**
 * @route   GET /api/v1/chat/stats
 * @desc    Obtener estadísticas de uso de chats del usuario
 * @access  Private
 */
router.get('/stats', chatSessionController.getUserStats);

module.exports = router;
