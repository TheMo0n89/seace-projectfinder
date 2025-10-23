/**
 * Middleware para manejar errores en la aplicación
 */

/**
 * Middleware para capturar errores en rutas que no existen
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.url}`
  });
};

/**
 * Middleware para manejar errores generales
 * @param {Error} err - Objeto de error
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const errorHandler = (err, req, res, next) => {
  // Log del error para depuración
  console.error('Error:', err.message);
  console.error(err.stack);

  // Determinar el código de estado apropiado
  const statusCode = err.statusCode || 500;

  // Respuesta al cliente
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Error interno del servidor' : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Middleware para manejar errores de validación
 */
const validationErrorHandler = (err, req, res, next) => {
  // Verificar si es un error de validación de Sequelize
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors
    });
  }
  
  // Pasar a otros manejadores de error si no es de validación
  next(err);
};

module.exports = {
  notFoundHandler,
  errorHandler,
  validationErrorHandler
};