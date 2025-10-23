/**
 * Rutas de autenticación
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middlewares/auth');

console.log('=== AUTH ROUTES LOADING ===');
console.log('Router created:', typeof router);
console.log('Auth controller loaded:', typeof authController);

/**
 * @swagger
 * components:
 *   schemas:
 *     UserRegister:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *         full_name:
 *           type: string
 *     UserLogin:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *         password:
 *           type: string
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         full_name:
 *           type: string
 *         role:
 *           type: string
 *           enum: [admin, guest]
 *         is_active:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         last_login:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [🔐 Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegister'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Datos inválidos o usuario ya existe
 */
router.post('/register', (req, res, next) => {
  console.log('=== AUTH ROUTE HIT ===');
  console.log('Route: /register');
  console.log('Method: POST');
  next();
}, authController.register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [🔐 Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Login exitoso
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
 *                     access_token:
 *                       type: string
 *                     token_type:
 *                       type: string
 *                     expires_in:
 *                       type: integer
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Credenciales incorrectas
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [🔐 Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 */
router.post('/logout', verifyToken, authController.logout);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Obtener información del usuario actual
 *     tags: [🔐 Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 */
router.get('/me', verifyToken, authController.getCurrentUser);

/**
 * @swagger
 * /api/v1/auth/me:
 *   put:
 *     summary: Actualizar información del usuario actual
 *     tags: [🔐 Autenticación]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               full_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 */
router.put('/me', verifyToken, authController.updateCurrentUser);

/**
 * @swagger
 * /api/v1/auth/me/password:
 *   put:
 *     summary: Cambiar contraseña del usuario actual
 *     tags: [🔐 Autenticación]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 */
router.put('/me/password', verifyToken, authController.changePassword);

/**
 * @swagger
 * /api/v1/auth/users:
 *   get:
 *     summary: Obtener lista de usuarios (solo administradores)
 *     tags: [🔐 Autenticación]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */
router.get('/users', verifyToken, isAdmin, authController.getAllUsers);

/**
 * @swagger
 * /api/v1/auth/test:
 *   post:
 *     summary: Endpoint de prueba para verificar parsing JSON
 *     tags: [🔐 Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Datos recibidos correctamente
 */
router.post('/test', (req, res) => {
  console.log('=== TEST ENDPOINT HIT ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Body type:', typeof req.body);
  
  res.json({
    success: true,
    received: req.body,
    type: typeof req.body
  });
});

console.log('=== AUTH ROUTES REGISTERED ===');
console.log('Test route registered');

module.exports = router;