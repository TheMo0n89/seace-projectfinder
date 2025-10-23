/**
 * Índice de middlewares para la aplicación
 */

const { verifyToken, isAdmin } = require('./auth');
const { notFoundHandler, errorHandler, validationErrorHandler } = require('./error');

module.exports = {
  verifyToken,
  isAdmin,
  notFoundHandler,
  errorHandler,
  validationErrorHandler
};