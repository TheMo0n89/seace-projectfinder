/**
 * Rutas de Dashboard
 */
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middlewares/auth');

/**
 * @swagger
 * /api/v1/dashboard/overview:
 *   get:
 *     summary: Obtener resumen general del dashboard
 *     tags: [📊 Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen general
 */
router.get('/overview', verifyToken, dashboardController.getOverview);

/**
 * @swagger
 * /api/v1/dashboard/procesos/estado:
 *   get:
 *     summary: Obtener procesos agrupados por estado
 *     tags: [📊 Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Procesos por estado
 */
router.get('/procesos/estado', verifyToken, dashboardController.getProcesosByEstado);

/**
 * @swagger
 * /api/v1/dashboard/procesos/departamento:
 *   get:
 *     summary: Obtener procesos agrupados por departamento
 *     tags: [📊 Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Procesos por departamento
 */
router.get('/procesos/departamento', verifyToken, dashboardController.getProcesosByDepartamento);

/**
 * @swagger
 * /api/v1/dashboard/trends/monthly:
 *   get:
 *     summary: Obtener tendencias mensuales
 *     tags: [📊 Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tendencias mensuales
 */
router.get('/trends/monthly', verifyToken, dashboardController.getMonthlyTrends);

/**
 * @swagger
 * /api/v1/dashboard/rubros/top:
 *   get:
 *     summary: Obtener top rubros
 *     tags: [📊 Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top rubros
 */
router.get('/rubros/top', verifyToken, dashboardController.getTopRubros);

/**
 * @swagger
 * /api/v1/dashboard/users/activity:
 *   get:
 *     summary: Obtener actividad de usuarios
 *     tags: [📊 Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Actividad de usuarios
 */
router.get('/users/activity', verifyToken, dashboardController.getUserActivity);

/**
 * @swagger
 * /api/v1/dashboard/etl/activity:
 *   get:
 *     summary: Obtener actividad de ETL
 *     tags: [📊 Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Actividad de ETL
 */
router.get('/etl/activity', verifyToken, dashboardController.getETLActivity);

module.exports = router;