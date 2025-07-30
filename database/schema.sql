-- =================================
-- KARGHO CHATBOT - DATABASE SCHEMA
-- =================================

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS `u136155607_karghoChat`
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE u136155607_karghoChat;

-- =================================
-- TABLA: chat_sessions
-- =================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id VARCHAR(36) PRIMARY KEY,
    language ENUM('en', 'es') DEFAULT 'en',
    dot_number VARCHAR(20) NULL,
    email VARCHAR(255) NULL,
    carrier_found BOOLEAN DEFAULT FALSE,
    carrier_registered BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
    user_ip VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_dot_number (dot_number),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================
-- TABLA: chat_messages
-- =================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    message_type ENUM('user_text', 'user_audio', 'bot_response') NOT NULL,
    content TEXT NULL,
    audio_file_path VARCHAR(500) NULL,
    transcription TEXT NULL,
    processing_time_ms INT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_message_type (message_type),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================
-- TABLA: api_calls
-- =================================
CREATE TABLE IF NOT EXISTS api_calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(36) NULL,
    api_name VARCHAR(100) NOT NULL,
    endpoint VARCHAR(200) NOT NULL,
    method VARCHAR(10) NOT NULL,
    request_data LONGTEXT NULL, -- Cambiado de JSON a LONGTEXT para MariaDB < 10.2
    response_data LONGTEXT NULL, -- Cambiado de JSON a LONGTEXT para MariaDB < 10.2
    status_code INT NULL,
    response_time_ms INT NULL,
    error_message TEXT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE SET NULL,
    INDEX idx_session_id (session_id),
    INDEX idx_api_name (api_name),
    INDEX idx_status_code (status_code),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================
-- TABLA: system_metrics
-- =================================
CREATE TABLE IF NOT EXISTS system_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_unit VARCHAR(20) NULL,
    metric_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_metric_date (metric_name, metric_date),
    INDEX idx_metric_name (metric_name),
    INDEX idx_metric_date (metric_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================
-- TABLA: carriers_cache
-- =================================
CREATE TABLE IF NOT EXISTS carriers_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dot_number VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    carrier_data LONGTEXT NOT NULL, -- Cambiado de JSON a LONGTEXT para MariaDB < 10.2
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    
    UNIQUE KEY unique_dot_email (dot_number, email),
    INDEX idx_dot_number (dot_number),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================
-- INSERTAR DATOS INICIALES
-- =================================

-- Métricas iniciales del sistema
INSERT IGNORE INTO system_metrics (metric_name, metric_value, metric_unit, metric_date) VALUES
('total_conversations', 0, 'count', CURDATE()),
('successful_registrations', 0, 'count', CURDATE()),
('audio_messages_processed', 0, 'count', CURDATE()),
('average_response_time', 0, 'ms', CURDATE()),
('api_errors', 0, 'count', CURDATE());

-- =================================
-- VISTAS ÚTILES
-- =================================

-- Vista de estadísticas diarias
CREATE OR REPLACE VIEW daily_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_sessions,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sessions,
    SUM(CASE WHEN carrier_registered = TRUE THEN 1 ELSE 0 END) as new_registrations,
    AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) as avg_session_duration_minutes
FROM chat_sessions 
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Vista de mensajes por sesión
CREATE OR REPLACE VIEW session_messages AS
SELECT 
    s.id as session_id,
    s.language,
    s.status,
    COUNT(m.id) as total_messages,
    SUM(CASE WHEN m.message_type = 'user_audio' THEN 1 ELSE 0 END) as audio_messages,
    SUM(CASE WHEN m.message_type = 'user_text' THEN 1 ELSE 0 END) as text_messages,
    MAX(m.timestamp) as last_message_at
FROM chat_sessions s
LEFT JOIN chat_messages m ON s.id = m.session_id
GROUP BY s.id, s.language, s.status;

-- =================================
-- PROCEDIMIENTOS ALMACENADOS
-- =================================

-- Limpiar sesiones abandonadas (más de 24 horas)
DELIMITER //
CREATE PROCEDURE CleanupAbandonedSessions()
BEGIN
    UPDATE chat_sessions 
    SET status = 'abandoned' 
    WHERE status = 'active' 
    AND updated_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);
    
    SELECT ROW_COUNT() as sessions_marked_abandoned;
END //
DELIMITER ;

-- Obtener estadísticas del sistema
DELIMITER //
CREATE PROCEDURE GetSystemStats()
BEGIN
    SELECT 
        'Total Sessions' as metric,
        COUNT(*) as value
    FROM chat_sessions
    
    UNION ALL
    
    SELECT 
        'Active Sessions' as metric,
        COUNT(*) as value
    FROM chat_sessions 
    WHERE status = 'active'
    
    UNION ALL
    
    SELECT 
        'Completed Sessions' as metric,
        COUNT(*) as value
    FROM chat_sessions 
    WHERE status = 'completed'
    
    UNION ALL
    
    SELECT 
        'New Registrations' as metric,
        COUNT(*) as value
    FROM chat_sessions 
    WHERE carrier_registered = TRUE
    
    UNION ALL
    
    SELECT 
        'Total Messages' as metric,
        COUNT(*) as value
    FROM chat_messages;
END //
DELIMITER ;

-- =================================
-- EVENTOS PROGRAMADOS (Requiere EVENT_SCHEDULER=ON)
-- =================================

-- Verificar si el scheduler está habilitado
-- SHOW VARIABLES LIKE 'event_scheduler';
-- SET GLOBAL event_scheduler = ON; -- Ejecutar si está OFF

-- Limpiar cache expirado cada hora
DROP EVENT IF EXISTS cleanup_expired_cache;
CREATE EVENT cleanup_expired_cache
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO
  DELETE FROM carriers_cache WHERE expires_at < NOW();

-- Marcar sesiones abandonadas cada 6 horas
DROP EVENT IF EXISTS cleanup_abandoned_sessions;
CREATE EVENT cleanup_abandoned_sessions
ON SCHEDULE EVERY 6 HOUR
STARTS CURRENT_TIMESTAMP
DO
  CALL CleanupAbandonedSessions();

-- =================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =================================

/*
ESQUEMA DE BASE DE DATOS - KARGHO CHATBOT

Tablas principales:
1. chat_sessions: Almacena información de cada sesión de chat
2. chat_messages: Almacena todos los mensajes (texto y audio)
3. api_calls: Log de todas las llamadas a APIs externas
4. system_metrics: Métricas del sistema por fecha
5. carriers_cache: Cache de información de carriers

Características:
- Soporte para UTF-8 completo
- Índices optimizados para consultas frecuentes
- Claves foráneas con CASCADE/SET NULL apropiados
- Vistas para estadísticas comunes
- Procedimientos para mantenimiento
- Eventos programados para limpieza automática

Consideraciones de rendimiento:
- Índices en campos de búsqueda frecuente
- Particionado por fecha en tablas grandes (futuro)
- Cache de carriers para reducir llamadas a API
- Limpieza automática de datos antiguos

Notas para MariaDB:
- JSON cambiado a LONGTEXT para compatibilidad con versiones < 10.2
- Eventos requieren EVENT_SCHEDULER=ON
- Se agregaron DROP EVENT IF EXISTS para evitar errores
*/