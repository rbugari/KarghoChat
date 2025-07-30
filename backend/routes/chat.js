const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// POST /api/chat - Enviar mensaje al chatbot
router.post('/', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Mensaje requerido'
      });
    }

    // TODO: Implementar lógica de chat con Groq/Kargho
    const response = {
      message: 'Echo: ' + message,
      sessionId: sessionId || 'temp-session',
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    logger.error('Error en chat:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/chat/history/:sessionId - Obtener historial
router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // TODO: Implementar obtención de historial desde DB
    const history = [];

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;