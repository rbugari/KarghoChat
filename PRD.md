
### 3.2 Tech Stack

**Frontend:**
- Vue.js 3 + Composition API
- Tailwind CSS para estilos
- Axios para HTTP requests
- Vue I18n para internacionalización
- MediaRecorder API para grabación de audio
- Deployment: Vercel

**Backend:**
- Node.js + Express.js
- JWT para autenticación
- Multer para manejo de archivos
- Rate limiting con express-rate-limit
- Helmet.js para seguridad
- Deployment: Railway

**Base de Datos:**
- MariaDB (Railway)
- Esquema optimizado para sesiones de chat

**Servicios Externos:**
- **LLM**: Groq Cloud (Mixtral-8x7b-32768)
- **STT**: OpenAI Whisper API
- **APIs**: Kargho FMCSA REST APIs

### 3.3 Especificaciones de Audio
- **Duración máxima**: 60 segundos
- **Tamaño máximo**: 10 MB
- **Formatos soportados**: MP3, WAV, M4A
- **Detección automática de idioma**: Inglés/Español

## 4. Requisitos Funcionales

### 4.1 Gestión de Idiomas
- **RF-001**: El sistema debe detectar automáticamente el idioma preferido del usuario
- **RF-002**: El usuario debe poder cambiar el idioma manualmente
- **RF-003**: Todas las respuestas deben generarse en el idioma seleccionado
- **RF-004**: Los mensajes de error deben estar localizados

### 4.2 Procesamiento de Audio
- **RF-005**: El sistema debe convertir audio a texto usando Whisper API
- **RF-006**: Debe validar duración y tamaño de archivos de audio
- **RF-007**: Debe mostrar indicadores de procesamiento durante la transcripción
- **RF-008**: Debe manejar errores de transcripción graciosamente

### 4.3 Flujo Conversacional
- **RF-009**: Iniciar conversación con mensaje de bienvenida
- **RF-010**: Solicitar DOT number con validación de formato
- **RF-011**: Solicitar email con validación de formato
- **RF-012**: Buscar carrier en base de datos FMCSA
- **RF-013**: Ofrecer registro si el carrier no existe
- **RF-014**: Mostrar documentos pendientes si el carrier existe
- **RF-015**: Enviar email con documentos pendientes

### 4.4 Integración con APIs
- **RF-016**: Autenticarse con Kargho API usando JWT
- **RF-017**: Buscar carriers por DOT y email
- **RF-018**: Registrar nuevos carriers automáticamente
- **RF-019**: Obtener lista de documentos pendientes
- **RF-020**: Enviar emails con documentos pendientes

## 5. Requisitos No Funcionales

### 5.1 Rendimiento
- **RNF-001**: Tiempo de respuesta < 3 segundos para búsquedas
- **RNF-002**: Transcripción de audio < 10 segundos
- **RNF-003**: Soporte para 100 usuarios concurrentes

### 5.2 Seguridad
- **RNF-004**: Encriptación HTTPS en todas las comunicaciones
- **RNF-005**: Rate limiting: 100 requests/15 minutos por IP
- **RNF-006**: Validación de entrada en todos los endpoints
- **RNF-007**: Logs de seguridad para todas las transacciones

### 5.3 Disponibilidad
- **RNF-008**: Uptime objetivo: 99.5%
- **RNF-009**: Manejo gracioso de errores de servicios externos
- **RNF-010**: Fallback para cuando APIs externas fallen

## 6. Casos de Uso

### 6.1 Caso de Uso Principal: Onboarding Exitoso
**Actor**: Carrier estadounidense
**Precondición**: Usuario accede al chatbot
**Flujo Principal**:
1. Sistema muestra mensaje de bienvenida
2. Usuario proporciona DOT number (texto o audio)
3. Sistema valida formato DOT
4. Usuario proporciona email (texto o audio)
5. Sistema valida formato email
6. Sistema busca carrier en FMCSA
7. **Escenario A**: Carrier existe
   - Sistema muestra información del carrier
   - Sistema obtiene documentos pendientes
   - Sistema envía email con documentos
   - Sistema confirma envío exitoso
8. **Escenario B**: Carrier no existe
   - Sistema ofrece registro automático
   - Usuario confirma registro
   - Sistema registra carrier en FMCSA
   - Sistema envía email de bienvenida
   - Sistema confirma registro exitoso

### 6.2 Casos de Uso Secundarios
- **CU-002**: Manejo de errores de validación
- **CU-003**: Recuperación de sesión interrumpida
- **CU-004**: Cambio de idioma durante conversación
- **CU-005**: Procesamiento de audio con ruido

## 7. Interfaz de Usuario

### 7.1 Componentes Principales
- **ChatWidget**: Contenedor principal del chat
- **ChatHeader**: Título y selector de idioma
- **ChatMessages**: Lista de mensajes con scroll
- **ChatInput**: Input de texto y botón de audio
- **AudioRecorder**: Grabador de audio con visualización
- **TypingIndicator**: Indicador de "escribiendo..."
- **QuickActions**: Botones de acciones rápidas

### 7.2 Estados de la Interfaz
- **Inicial**: Mensaje de bienvenida
- **Esperando DOT**: Input activo para DOT number
- **Esperando Email**: Input activo para email
- **Procesando**: Indicadores de carga
- **Grabando Audio**: Visualización de grabación
- **Transcribiendo**: Indicador de procesamiento STT
- **Completado**: Resumen final y opciones

## 8. Base de Datos

### 8.1 Esquema de Tablas

```sql
-- Sesiones de chat
CREATE TABLE chat_sessions (
    id VARCHAR(36) PRIMARY KEY,
    language ENUM('en', 'es') DEFAULT 'en',
    dot_number VARCHAR(20),
    email VARCHAR(255),
    carrier_found BOOLEAN DEFAULT FALSE,
    carrier_registered BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Mensajes del chat
CREATE TABLE chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(36),
    message_type ENUM('user_text', 'user_audio', 'bot_response'),
    content TEXT,
    audio_file_path VARCHAR(500),
    transcription TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
);

-- Logs de llamadas a APIs
CREATE TABLE api_calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(36),
    api_name VARCHAR(100),
    endpoint VARCHAR(200),
    request_data JSON,
    response_data JSON,
    status_code INT,
    response_time_ms INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
);

-- Métricas del sistema
CREATE TABLE system_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    metric_name VARCHAR(100),
    metric_value DECIMAL(10,2),
    metric_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 9. APIs y Endpoints

### 9.1 Endpoints del Backend

```javascript
// Gestión de chat
POST   /api/chat/start           // Iniciar nueva sesión
POST   /api/chat/message         // Enviar mensaje de texto
GET    /api/chat/session/:id     // Obtener historial de sesión
POST   /api/chat/audio           // Procesar mensaje de audio

// Utilidades
GET    /api/health               // Health check
POST   /api/language             // Cambiar idioma de sesión
GET    /api/metrics              // Métricas básicas (admin)
```

### 9.2 Integración con APIs Externas

**Kargho FMCSA API:**
```javascript
// Autenticación
POST {API_BASE_URL}/api/login/moderator

// Endpoints principales
POST /api/fmcsa/find-by-dot-email
POST /api/fmcsa/pending-documents
POST /api/fmcsa/send-pending-documents-email
POST /api/fmcsa/register-carrier
```

**OpenAI Whisper API:**
```javascript
POST https://api.openai.com/v1/audio/transcriptions
```

**Groq Cloud API:**
```javascript
POST https://api.groq.com/openai/v1/chat/completions
```

## 10. Variables de Entorno

```bash
# Kargho API
KARGHO_API_BASE_URL=https://api.kargho.com
KARGHO_API_USERNAME=your_username
KARGHO_API_PASSWORD=your_password

# Database (Railway)
DATABASE_URL=mysql://user:password@host:port/database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=kargho_chatbot
DB_USER=root
DB_PASSWORD=password

# Groq API
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=mixtral-8x7b-32768

# OpenAI Whisper
OPENAI_API_KEY=your_openai_api_key

# Application
JWT_SECRET=your_jwt_secret_key
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Audio Settings
MAX_AUDIO_DURATION_SECONDS=60
MAX_AUDIO_FILE_SIZE_MB=10
```

## 11. Métricas y Monitoreo

### 11.1 Métricas de Negocio
- Número total de conversaciones iniciadas
- Tasa de conversión (conversaciones → registros)
- Tiempo promedio de onboarding
- Carriers registrados exitosamente
- Documentos pendientes enviados

### 11.2 Métricas Técnicas
- Tiempo de respuesta de APIs
- Tasa de errores por endpoint
- Uso de recursos (CPU, memoria)
- Tiempo de transcripción de audio
- Disponibilidad de servicios externos

### 11.3 Métricas de Usuario
- Mensajes de texto vs. audio
- Idioma preferido por región
- Puntos de abandono en el flujo
- Errores de validación más comunes

## 12. Plan de Desarrollo

### 12.1 Cronograma (4 semanas)

**Semana 1: Configuración e Infraestructura**
- Día 1-2: Setup del proyecto y repositorio
- Día 3-4: Configuración Railway (backend + MariaDB)
- Día 5-7: Implementación de servicios base (Kargho, Groq)

**Semana 2: Backend Core**
- Día 8-10: Implementación WhisperService y endpoints de audio
- Día 11-12: Desarrollo ChatService con lógica conversacional
- Día 13-14: Sistema de logging y métricas

**Semana 3: Frontend**
- Día 15-17: Componentes Vue.js principales
- Día 18-19: Implementación de grabación de audio
- Día 20-21: Configuración i18n y integración con backend

**Semana 4: Testing y Deploy**
- Día 22-24: Testing integral y corrección de bugs
- Día 25-26: Deploy en Vercel y optimización
- Día 27-28: Documentación y configuración de monitoreo

### 12.2 Hitos Principales
- ✅ **Hito 1**: Autenticación con Kargho API funcional
- ✅ **Hito 2**: Flujo conversacional básico completo
- ✅ **Hito 3**: Procesamiento de audio implementado
- ✅ **Hito 4**: Interfaz multiidioma funcional
- ✅ **Hito 5**: Deploy en producción exitoso

## 13. Riesgos y Mitigaciones

### 13.1 Riesgos Técnicos
- **Riesgo**: Latencia alta en Whisper API
  - **Mitigación**: Implementar timeout y fallback a texto
- **Riesgo**: Rate limiting de APIs externas
  - **Mitigación**: Implementar cola de requests y retry logic
- **Riesgo**: Errores de transcripción de audio
  - **Mitigación**: Validación adicional y opción de reintento

### 13.2 Riesgos de Negocio
- **Riesgo**: Baja adopción del chatbot
  - **Mitigación**: UX intuitiva y onboarding guiado
- **Riesgo**: Problemas de precisión en respuestas
  - **Mitigación**: Fine-tuning de prompts y testing extensivo

## 14. Criterios de Aceptación

### 14.1 Funcionales
- ✅ Usuario puede completar onboarding en < 5 minutos
- ✅ Soporte completo para inglés y español
- ✅ Procesamiento de audio funcional en ambos idiomas
- ✅ Integración exitosa con todas las APIs de Kargho
- ✅ Manejo gracioso de todos los casos de error

### 14.2 No Funcionales
- ✅ Tiempo de respuesta < 3 segundos
- ✅ Disponibilidad > 99%
- ✅ Interfaz responsive en móvil y desktop
- ✅ Cumplimiento de estándares de seguridad

## 15. Documentación Adicional

- **API Documentation**: `/docs/API.md`
- **Deployment Guide**: `/docs/DEPLOYMENT.md`
- **User Manual**: `/docs/USER_GUIDE.md`
- **Technical Architecture**: `/docs/ARCHITECTURE.md`

---

**Versión**: 1.0  
**Fecha**: Diciembre 2024  
**Autor**: Equipo de Desarrollo Kargho  
**Estado**: Aprobado para Implementación