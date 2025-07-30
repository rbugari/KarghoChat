# Especificación Funcional - Chatbot de Onboarding para Kargho

## Objetivo

Desarrollar un chatbot para Kargho que gestione el onboarding y la consulta de estado de transportistas (carriers) americanos, interactuando 100% vía API REST segura (con JWT) y utilizando un LLM para respuestas naturales. El bot debe validar DOT y email, gestionar nuevos registros, informar estado y documentos pendientes, y ser integrable en cualquier web (preferencia por Vue.js o widget simple, sin React).

---

## Casos de Uso Principales

### 1. Onboarding de nuevos carriers

- El bot pregunta si el usuario tiene un número DOT.
- Si **NO**:
  - Informa sobre cómo obtener un DOT y finaliza la conversación.
- Si **SÍ**:
  - Solicita el número DOT.
  - Solicita el email con el que se registró.
  - Consulta `/api/fmcsa/find-by-dot-email` (requiere token).
    - **DOT y email encontrados (coinciden):**
      - Da la bienvenida.
      - Muestra estado y documentación pendiente (`/api/fmcsa/pending-documents`).
      - Ofrece enviar mail con pendientes (`/api/fmcsa/send-pending-documents-email`).
    - **DOT existe pero email no coincide:**
      - Informa que el email no corresponde y no puede avanzar.
    - **DOT no encontrado:**
      - Ofrece registro como carrier.
        - Si acepta, solicita email y llama a `/api/fmcsa/register-carrier`.
        - Confirma registro y explica que recibirá mail con instrucciones.

### 2. Consulta de estado de carriers existentes

- Solicita DOT y email.
- Consulta `/api/fmcsa/find-by-dot-email`.
- Si está registrado, muestra estado, lista de documentos pendientes y ofrece reenvío por email.
- Si no está registrado, ofrece ayuda para el alta.

### 3. Envío de recordatorio de documentos pendientes

- En cualquier paso, si el usuario lo solicita, llama a `/api/fmcsa/send-pending-documents-email` para enviar el detalle por correo.

---

## Flujos de conversación (pseudocódigo)

```plaintext
1. Bienvenida
   - Bot: "¡Bienvenido a Kargho! ¿Tienes un número DOT para operar como transportista en EE.UU.?"
     - Usuario: "No"
        - Bot: "Para operar necesitas gestionar tu DOT con la autoridad de transportes. Más info en [enlace]. ¡Te esperamos pronto!"
        - Fin
     - Usuario: "Sí"
        - Bot: "Por favor, dime tu número DOT:"
           - Usuario: (DOT)
           - Bot: "¿Con qué email te registraste?"
               - Usuario: (email)
               - [Llamada a /api/fmcsa/find-by-dot-email]
                   - Si DOT y email correctos:
                       - Bot: "¡Perfecto! Estás registrado. Verificando tu estado..."
                       - [Llamada a /api/fmcsa/pending-documents]
                          - Si hay documentos pendientes:
                             - Bot: "Aún faltan documentos: [lista]. ¿Quieres recibir el detalle por correo?"
                                 - Usuario: "Sí"
                                    - [Llamada a /api/fmcsa/send-pending-documents-email]
                                    - Bot: "¡Listo! Revisa tu correo."
                                 - Usuario: "No"
                                    - Bot: "¡Avísame si necesitas algo más!"
                          - Si todo OK:
                             - Bot: "¡Todo en orden! Ya puedes operar en Kargho."
                   - Si DOT existe pero email no coincide:
                       - Bot: "El email no coincide con el registrado para este DOT. Debes usar el email original."
                   - Si DOT no existe:
                       - Bot: "No encontramos tu DOT. ¿Deseas registrarte como transportista nuevo?"
                           - Usuario: "Sí"
                              - Bot: "Dime tu email para el alta:"
                                  - Usuario: (nuevo email)
                                  - [Llamada a /api/fmcsa/register-carrier]
                                  - Bot: "¡Registro realizado! Recibirás un correo con los siguientes pasos."
                           - Usuario: "No"
                              - Bot: "¡Listo! Si necesitas ayuda, escríbenos cuando quieras."
```

---

## Especificación Técnica

### 1. **Autenticación y Token JWT**

- Todos los endpoints de Kargho requieren token JWT con perfil de administrador.
- El token se obtiene vía:
  - **POST** `/api/login/moderator`
  - Body:
    ```json
    {
      "email": "rbugari@outlook.com",
      "password": "kqkND3wB665z"
    }
    ```
  - El token se debe incluir en cada request como:
    ```
    Authorization: Bearer {jwt_token}
    ```

### 2. **Endpoints disponibles**

- **Buscar carrier por DOT y email:**
  - `POST /api/fmcsa/find-by-dot-email`
  - Body:
    ```json
    {
      "dot_number": "1234567",
      "email": "user@example.com",
      "language": "es"
    }
    ```
- **Consultar documentos pendientes:**
  - `POST /api/fmcsa/pending-documents`
  - Body:
    ```json
    {
      "dot_number": "1234567",
      "language": "es"
    }
    ```
- **Enviar mail con documentos pendientes:**
  - `POST /api/fmcsa/send-pending-documents-email`
  - Body:
    ```json
    {
      "dot_number": "1234567",
      "language": "es"
    }
    ```
- **Registrar carrier:**
  - `POST /api/fmcsa/register-carrier`
  - Body:
    ```json
    {
      "dot_number": "1234567",
      "email": "user@example.com",
      "language": "es"
    }
    ```

### 3. **Manejo de estados y errores**

- Validar siempre las respuestas de API:
  - Si hay error de validación, mostrar mensaje amigable ("El número DOT es obligatorio", "Email inválido", etc.).
  - Si el DOT o email ya existen, o no existen, informar de forma clara.
  - Loguear todos los flujos y errores para poder hacer troubleshooting.
- El chatbot nunca debe exponer datos sensibles ni permitir cambios fuera de lo definido en los endpoints.

---

## Integración y arquitectura sugerida

- **Frontend:** Componente Vue.js o widget JavaScript embebible, responsive.

- **Backend/Orquestador:** Node.js/Express, encargado de:

  - Autenticación y gestión del token.
  - Orquestación del flujo conversacional.
  - Tracking del estado de cada usuario (por sesión/chat).
  - Llamadas a la API REST y parsing de respuestas.
  - Integración con el LLM para generación de respuestas naturales.

- **LLM:** OpenAI, Groq, Azure OpenAI u otro, configurable, solo para generación de texto; las decisiones y validaciones se hacen en backend.

---

## Ejemplo de secuencia de llamadas (Node.js)

```js
// 1. Autenticación (solo una vez al iniciar backend)
const token = await loginAndGetToken(email, password);

// 2. Buscar carrier por DOT y email
const carrier = await findByDotEmail(dot, email, token);

// 3. Si corresponde, consultar documentos pendientes
const docs = await getPendingDocuments(dot, token);

// 4. Si el usuario lo pide, enviar correo
await sendPendingDocumentsEmail(dot, token);

// 5. Si el usuario necesita registro
await registerCarrier(dot, email, token);
```

---

## Consideraciones adicionales

- El bot debe ser educado, empático y profesional.
- Siempre sugerir contactar soporte humano si surge algún error técnico o duda fuera del alcance.
- Dejar listo para futuras integraciones multicanal (WhatsApp, Telegram, etc.).

---

## Pendientes para el desarrollador

- Adaptar textos finales del bot con el equipo de Kargho.
- Revisar el diseño de los mails automáticos.
- Implementar logging y monitorización.
- Documentar todo el código y flujos.

---

**Contacto para dudas:**\
Ramiro Bugari\
[rbugari@outlook.com](mailto\:rbugari@outlook.com)

