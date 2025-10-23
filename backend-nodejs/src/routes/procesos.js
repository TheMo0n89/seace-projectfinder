/**
 * Rutas de procesos
 */
const express = require('express');
const router = express.Router();
const procesosController = require('../controllers/procesosController');
const { verifyToken, isAdmin } = require('../middlewares/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Proceso:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         id_proceso:
 *           type: string
 *         url_proceso:
 *           type: string
 *         numero_convocatoria:
 *           type: string
 *         entidad_nombre:
 *           type: string
 *         entidad_ruc:
 *           type: string
 *         objeto_contratacion:
 *           type: string
 *         tipo_proceso:
 *           type: string
 *         estado_proceso:
 *           type: string
 *         fecha_publicacion:
 *           type: string
 *           format: date-time
 *         fecha_limite_presentacion:
 *           type: string
 *           format: date-time
 *         monto_referencial:
 *           type: number
 *         moneda:
 *           type: string
 *         rubro:
 *           type: string
 *         departamento:
 *           type: string
 *         provincia:
 *           type: string
 *         distrito:
 *           type: string
 *         requiere_visita_previa:
 *           type: boolean
 *         datos_ocds:
 *           type: object
 *         complejidad_estimada:
 *           type: string
 *         categoria_proyecto:
 *           type: string
 */

/**
 * @swagger
 * /api/v1/procesos:
 *   get:
 *     summary: Obtener lista de procesos con filtros
 *     tags: [📋 Procesos]
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
 *         name: estado_proceso
 *         schema:
 *           type: string
 *       - in: query
 *         name: tipo_proceso
 *         schema:
 *           type: string
 *       - in: query
 *         name: rubro
 *         schema:
 *           type: string
 *       - in: query
 *         name: departamento
 *         schema:
 *           type: string
 *       - in: query
 *         name: monto_min
 *         schema:
 *           type: number
 *       - in: query
 *         name: monto_max
 *         schema:
 *           type: number
 *       - in: query
 *         name: search_text
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: fecha_publicacion
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Lista de procesos
 */
router.get('/', verifyToken, procesosController.getProcesos);

/**
 * @swagger
 * /api/v1/procesos/search/text:
 *   get:
 *     summary: Búsqueda de texto completo en procesos
 *     tags: [📋 Procesos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 */
router.get('/search/text', verifyToken, procesosController.searchProcesosByText);

/**
 * @swagger
 * /api/v1/procesos/stats/general:
 *   get:
 *     summary: Obtener estadísticas generales de procesos
 *     tags: [📋 Procesos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas generales
 */
router.get('/stats/general', verifyToken, procesosController.getGeneralStats);

/**
 * @swagger
 * /api/v1/procesos/stats/overview:
 *   get:
 *     summary: Obtener estadísticas detalladas de procesos
 *     tags: [📋 Procesos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas detalladas
 */
router.get('/stats/overview', verifyToken, procesosController.getDetailedStats);

/**
 * @swagger
 * /api/v1/procesos/{proceso_id}:
 *   get:
 *     summary: Obtener detalle de un proceso específico
 *     tags: [📋 Procesos]
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
 *         description: Detalle del proceso
 *       404:
 *         description: Proceso no encontrado
 */
router.get('/:proceso_id', verifyToken, procesosController.getProcesoDetail);

/**
 * @swagger
 * /api/v1/procesos:
 *   post:
 *     summary: Crear nuevo proceso (solo administradores)
 *     tags: [📋 Procesos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Proceso'
 *     responses:
 *       201:
 *         description: Proceso creado exitosamente
 */
router.post('/', verifyToken, isAdmin, procesosController.createProceso);

/**
 * @swagger
 * /api/v1/procesos/{proceso_id}:
 *   put:
 *     summary: Actualizar proceso (solo administradores)
 *     tags: [📋 Procesos]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Proceso'
 *     responses:
 *       200:
 *         description: Proceso actualizado exitosamente
 *       404:
 *         description: Proceso no encontrado
 */
router.put('/:proceso_id', verifyToken, isAdmin, procesosController.updateProceso);

/**
 * @swagger
 * /api/v1/procesos/{proceso_id}:
 *   delete:
 *     summary: Eliminar proceso (solo administradores)
 *     tags: [📋 Procesos]
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
 *         description: Proceso eliminado exitosamente
 *       404:
 *         description: Proceso no encontrado
 */
router.delete('/:proceso_id', verifyToken, isAdmin, procesosController.deleteProceso);

module.exports = router;