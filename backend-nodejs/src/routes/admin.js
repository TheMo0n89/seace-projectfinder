/**
 * Rutas de Administración
 */
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middlewares/auth');

// Todas las rutas requieren autenticación y rol de administrador
router.use(verifyToken);
router.use(isAdmin);

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Obtener lista de usuarios (admin)
 *     tags: [⚙️ Admin]
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
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */
router.get('/users', adminController.getAllUsers);

/**
 * @swagger
 * /api/v1/admin/users/{user_id}:
 *   put:
 *     summary: Actualizar usuario (admin)
 *     tags: [⚙️ Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
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
 *             properties:
 *               email:
 *                 type: string
 *               full_name:
 *                 type: string
 *               role:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Usuario actualizado
 */
router.put('/users/:user_id', adminController.updateUser);

/**
 * @swagger
 * /api/v1/admin/users/{user_id}:
 *   delete:
 *     summary: Eliminar usuario (admin)
 *     tags: [⚙️ Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Usuario eliminado
 */
router.delete('/users/:user_id', adminController.deleteUser);

/**
 * @swagger
 * /api/v1/admin/config:
 *   get:
 *     summary: Obtener toda la configuración
 *     tags: [⚙️ Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de configuraciones
 */
router.get('/config', adminController.getAllConfig);

/**
 * @swagger
 * /api/v1/admin/config/{clave}:
 *   get:
 *     summary: Obtener configuración específica
 *     tags: [⚙️ Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clave
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Configuración
 */
router.get('/config/:clave', adminController.getConfig);

/**
 * @swagger
 * /api/v1/admin/config:
 *   post:
 *     summary: Crear o actualizar configuración
 *     tags: [⚙️ Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clave
 *               - valor
 *             properties:
 *               clave:
 *                 type: string
 *               valor:
 *                 type: string
 *               descripcion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Configuración guardada
 */
router.post('/config', adminController.setConfig);

/**
 * @swagger
 * /api/v1/admin/config/{clave}:
 *   delete:
 *     summary: Eliminar configuración
 *     tags: [⚙️ Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clave
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Configuración eliminada
 */
router.delete('/config/:clave', adminController.deleteConfig);

/**
 * @swagger
 * /api/v1/admin/stats/system:
 *   get:
 *     summary: Obtener estadísticas del sistema
 *     tags: [⚙️ Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas del sistema
 */
router.get('/stats/system', adminController.getSystemStats);

/**
 * @swagger
 * /api/v1/admin/maintenance/clean:
 *   post:
 *     summary: Limpiar datos antiguos
 *     tags: [⚙️ Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 90
 *     responses:
 *       200:
 *         description: Limpieza completada
 */
router.post('/maintenance/clean', adminController.cleanOldData);

module.exports = router;