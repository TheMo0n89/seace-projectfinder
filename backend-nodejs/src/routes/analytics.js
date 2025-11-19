const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, isAdmin } = require('../middlewares/auth');

/**
 * @route GET /api/v1/analytics/dashboard
 * @desc Obtener estadísticas generales del dashboard
 * @access Admin only
 */
router.get('/dashboard', verifyToken, isAdmin, analyticsController.getDashboardStats);

/**
 * @route GET /api/v1/analytics/users/me/stats
 * @desc Obtener estadísticas del usuario autenticado
 * @access Authenticated
 */
router.get('/users/me/stats', verifyToken, analyticsController.getMyStats);

/**
 * @route GET /api/v1/analytics/users/:userId
 * @desc Obtener estadísticas de un usuario específico
 * @access Admin o el mismo usuario
 */
router.get('/users/:userId', verifyToken, analyticsController.getUserProfileStats);

/**
 * @route POST /api/v1/analytics/track/click
 * @desc Registrar click en recomendación
 * @access Authenticated
 */
router.post('/track/click', verifyToken, analyticsController.trackRecommendationClick);

/**
 * @route GET /api/v1/analytics/clicks/stats
 * @desc Obtener estadísticas de clicks del usuario
 * @access Authenticated
 */
router.get('/clicks/stats', verifyToken, analyticsController.getUserClickStats);

/**
 * @route GET /api/v1/analytics/clicks/top
 * @desc Obtener procesos más clickeados
 * @access Admin
 */
router.get('/clicks/top', verifyToken, isAdmin, analyticsController.getTopClickedProcesses);

module.exports = router;
