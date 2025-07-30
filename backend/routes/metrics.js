const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// GET /api/metrics - Obtener métricas del sistema
router.get('/', async (req, res) => {
  try {
    const metrics = {
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version
      },
      application: {
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      },
      // TODO: Agregar métricas de base de datos y APIs
      database: {
        status: 'pending',
        connections: 0
      },
      apis: {
        groq: { status: 'pending', lastCall: null },
        openai: { status: 'pending', lastCall: null },
        kargho: { status: 'pending', lastCall: null }
      }
    };

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error obteniendo métricas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;