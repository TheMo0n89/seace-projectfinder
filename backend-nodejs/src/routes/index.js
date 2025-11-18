/**
 * Índice principal de rutas
 */
const express = require('express');
const router = express.Router();

console.log('=== MAIN ROUTES LOADING ===');

// Importar todas las rutas
const authRoutes = require('./auth');
console.log('Auth routes loaded:', typeof authRoutes);

const procesosRoutes = require('./procesos');
const recomendacionesRoutes = require('./recomendaciones');
const chatbotRoutes = require('./chatbot');
const chatSessionRoutes = require('./chatSessionRoutes');
const dashboardRoutes = require('./dashboard');
const adminRoutes = require('./admin');
const etlRoutes = require('./etl');
const userProfileRoutes = require('./userProfile');
const recommendationsRoutes = require('./recommendations');
const analyticsRoutes = require('./analytics');

// Registrar rutas con sus prefijos
console.log('Registering auth routes...');
router.use('/auth', authRoutes);
router.use('/procesos', procesosRoutes);
router.use('/recomendaciones', recomendacionesRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/chat', chatSessionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/admin', adminRoutes);
router.use('/etl', etlRoutes);
router.use('/users', userProfileRoutes);
router.use('/users', recommendationsRoutes);
router.use('/analytics', analyticsRoutes);

// Ruta de salud general
router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'SEACE ProjectFinder API - Node.js Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;