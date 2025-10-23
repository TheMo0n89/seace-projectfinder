/**
 * Middleware de autenticación para proteger rutas
 */
const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');

/**
 * Middleware para verificar el token JWT
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const verifyToken = async (req, res, next) => {
  try {
    // Verificar si hay un token en el encabezado
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación'
      });
    }

    // Obtener el token sin la parte "Bearer"
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido'
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Buscar el usuario en la base de datos
    // El token contiene user_id, no id
    const user = await User.findOne({ where: { id: decoded.user_id } });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Añadir el usuario al objeto de solicitud
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false, 
        message: 'Token expirado'
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    console.error('Error en la autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno de servidor'
    });
  }
};

/**
 * Middleware para verificar rol de administrador
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de administrador'
    });
  }
  next();
};

module.exports = {
  verifyToken,
  isAdmin
};