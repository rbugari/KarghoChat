const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Importar servicios y middlewares
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');

// Importar rutas
const chatRoutes = require('./routes/chat');
const audioRoutes = require('./routes/audio');
const healthRoutes = require('./routes/health');
const metricsRoutes = require('./routes/metrics');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// =================================
// MIDDLEWARES DE SEGURIDAD
// =================================

// Helmet para headers de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// =================================
// CONFIGURACIÓN DE CORS
// =================================

// Definir corsOptions antes de usarlo
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://kargho-chatbot-frontend.vercel.app'
  ],
  credentials: true
};

app.use(cors(corsOptions));

// =================================
// RATE LIMITING
// =================================

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests por ventana
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
      retryAfter: '15 minutos'
    });
  }
});
app.use('/api/', limiter);

// =================================
// MIDDLEWARES GENERALES
// =================================

// Compresión
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
} else {
  app.use(morgan('dev'));
}

// Parseo de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos (uploads temporales)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =================================
// RUTAS
// =================================

// Rutas principales
app.use('/api/health', healthRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/metrics', authMiddleware, metricsRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'Kargho Chatbot API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      chat: '/api/chat',
      audio: '/api/audio',
      metrics: '/api/metrics'
    }
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    message: `La ruta ${req.originalUrl} no existe`,
    availableEndpoints: [
      '/api/health',
      '/api/chat',
      '/api/audio',
      '/api/metrics'
    ]
  });
});

// =================================
// MANEJO DE ERRORES
// =================================

// Middleware de manejo de errores
app.use(errorHandler);

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// =================================
// INICIAR SERVIDOR
// =================================

const server = app.listen(PORT, () => {
  logger.info(`🚀 Kargho Chatbot API iniciado en puerto ${PORT}`);
  logger.info(`📝 Modo: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 CORS habilitado para: http://localhost:5173, https://tu-frontend-vercel.vercel.app`);
  logger.info(`📊 Rate limit: ${limiter.max} requests per ${limiter.windowMs / 1000 / 60} minutes`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    logger.info('Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT recibido, cerrando servidor...');
  server.close(() => {
    logger.info('Servidor cerrado correctamente');
    process.exit(0);
  });
});

module.exports = app;