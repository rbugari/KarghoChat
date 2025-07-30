const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const logger = require('../utils/logger');

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: (process.env.MAX_AUDIO_FILE_SIZE_MB || 10) * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.SUPPORTED_AUDIO_FORMATS || 'mp3,wav,m4a').split(',');
    const fileExt = path.extname(file.originalname).toLowerCase().slice(1);
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de audio no soportado'));
    }
  }
});

// POST /api/audio/transcribe - Transcribir audio
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Archivo de audio requerido'
      });
    }

    // TODO: Implementar transcripción con OpenAI Whisper
    const transcription = {
      text: 'Transcripción pendiente de implementar',
      confidence: 0.95,
      duration: 5.2
    };

    // Limpiar archivo temporal
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      data: transcription
    });
  } catch (error) {
    logger.error('Error en transcripción:', error);
    
    // Limpiar archivo si existe
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: 'Error procesando audio'
    });
  }
});

module.exports = router;