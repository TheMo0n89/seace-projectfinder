/**
 * Archivo principal del servidor Express
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Importar configuración (NO destructurar, importar objeto completo)
const config = require('./config/index');
const { sequelize } = require('./config/database');

// Importar middlewares
const {
  notFoundHandler,
  errorHandler,
  validationErrorHandler
} = require('./middlewares');

// Importar rutas
const routes = require('./routes');

// Crear aplicación Express
const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Middleware de logging para verificar parsing JSON
app.use('/api/v1/auth/register', (req, res, next) => {
  console.log('=== JSON PARSING CHECK ===');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Body after parsing:', req.body);
  console.log('Body type:', typeof req.body);
  if (req.body && typeof req.body === 'object') {
    console.log('Body keys:', Object.keys(req.body));
  }
  next();
});

// Configurar Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API SEACE ProjectFinder',
      version: '1.0.0',
      description: 'API para el sistema SEACE ProjectFinder - Transformando procesos públicos en oportunidades de software'
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}`,
        description: 'Servidor de desarrollo'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/models/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Ruta base
app.get('/', (req, res) => {
  res.json({
    message: 'API SEACE ProjectFinder v1.0.0',
    documentation: '/api-docs'
  });
});

// Implementar rutas
app.use('/api/v1', routes);

// Middleware para manejar rutas no encontradas
app.use(notFoundHandler);

// Middlewares para manejo de errores
app.use(validationErrorHandler);
app.use(errorHandler);

// Iniciar servidor
const PORT = process.env.PORT || config.server?.port || 8000;

// Función para iniciar el servidor
async function startServer() {
  try {
    // Verificar la conexión a la base de datos
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');

    // Iniciar el servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
      console.log(`Documentación disponible en http://localhost:8000/api-docs`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();

// Exportar la app para testing
module.exports = app;