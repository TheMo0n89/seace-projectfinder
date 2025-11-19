/**
 * Rutas de ETL
 */
const express = require('express');
const router = express.Router();
const etlController = require('../controllers/etlController');
const { verifyToken, isAdmin } = require('../middlewares/auth');

/**
 * @swagger
 * /api/v1/etl/scraping/start:
 *   post:
 *     summary: Iniciar proceso de scraping
 *     tags: [🔄 ETL]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *               max_processes:
 *                 type: integer
 *               departamento:
 *                 type: string
 *     responses:
 *       200:
 *         description: Scraping iniciado
 */
router.post('/scraping/start', verifyToken, isAdmin, etlController.startScraping);

/**
 * @swagger
 * /api/v1/etl/scraping/tasks:
 *   get:
 *     summary: Obtener lista de tareas de scraping
 *     tags: [🔄 ETL]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de tareas
 */
router.get('/scraping/tasks', verifyToken, etlController.getScrapingTasks);

/**
 * @swagger
 * /api/v1/etl/scraping/tasks:
 *   post:
 *     summary: Crear nueva tarea de scraping
 *     tags: [🔄 ETL]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Tarea creada
 */
router.post('/scraping/tasks', verifyToken, etlController.createScrapingTask);

/**
 * @swagger
 * /api/v1/etl/scraping/tasks/{task_id}:
 *   get:
 *     summary: Obtener detalles de tarea de scraping
 *     tags: [🔄 ETL]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: task_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalles de la tarea
 */
router.get('/scraping/tasks/:task_id', verifyToken, etlController.getScrapingTask);

/**
 * @swagger
 * /api/v1/etl/scraping/tasks/{task_id}:
 *   put:
 *     summary: Actualizar tarea de scraping
 *     tags: [🔄 ETL]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: task_id
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
 *     responses:
 *       200:
 *         description: Tarea actualizada
 */
router.put('/scraping/tasks/:task_id', verifyToken, isAdmin, etlController.updateScrapingTask);

/**
 * @swagger
 * /api/v1/etl/logs:
 *   get:
 *     summary: Obtener logs de ETL
 *     tags: [🔄 ETL]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *       - in: query
 *         name: operation_type
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Logs de ETL
 */
router.get('/logs', verifyToken, isAdmin, etlController.getETLLogs);

/**
 * @swagger
 * /api/v1/etl/stats:
 *   get:
 *     summary: Obtener estadísticas de ETL
 *     tags: [🔄 ETL]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de ETL
 */
router.get('/stats', verifyToken, isAdmin, etlController.getETLStats);

/**
 * @swagger
 * /api/v1/etl/operations/{operation_id}/details:
 *   get:
 *     summary: Obtener detalles de una operación ETL específica
 *     tags: [🔄 ETL]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: operation_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalles de la operación
 */
router.get('/operations/:operation_id/details', verifyToken, etlController.getOperationDetails);

/**
 * @swagger
 * /api/v1/etl/operations/{operation_id}/progress:
 *   get:
 *     summary: Obtener progreso en tiempo real de una operación ETL
 *     tags: [🔄 ETL]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: operation_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Progreso de la operación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 operation_id:
 *                   type: string
 *                 status:
 *                   type: string
 *                 paso_actual:
 *                   type: integer
 *                 paso_total:
 *                   type: integer
 *                 porcentaje:
 *                   type: integer
 *                 mensaje_actual:
 *                   type: string
 */
router.get('/operations/:operation_id/progress', verifyToken, etlController.getOperationProgress);

/**
 * @swagger
 * /api/v1/etl/sync:
 *   post:
 *     summary: Sincronizar procesos
 *     tags: [🔄 ETL]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Sincronización iniciada
 */
router.post('/sync', verifyToken, isAdmin, etlController.syncProcesses);

/**
 * @swagger
 * /api/v1/etl/embeddings/generate:
 *   post:
 *     summary: Generar embeddings
 *     tags: [🔄 ETL]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               proceso_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Generación iniciada
 */
router.post('/embeddings/generate', verifyToken, isAdmin, etlController.generateEmbeddings);

/**
 * @swagger
 * /api/v1/etl/exports:
 *   get:
 *     summary: Listar archivos de exportación
 *     tags: [📥 Exportación]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *         description: Filtro por nombre de archivo
 *     responses:
 *       200:
 *         description: Lista de archivos exportados
 */
router.get('/exports', verifyToken, isAdmin, etlController.listExportedFiles);

/**
 * @swagger
 * /api/v1/etl/exports/download/{fileName}:
 *   get:
 *     summary: Descargar archivo de exportación
 *     tags: [📥 Exportación]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del archivo a descargar
 *     responses:
 *       200:
 *         description: Archivo descargado
 *       404:
 *         description: Archivo no encontrado
 */
router.get('/exports/download/:fileName', verifyToken, isAdmin, etlController.downloadExportedFile);

module.exports = router;