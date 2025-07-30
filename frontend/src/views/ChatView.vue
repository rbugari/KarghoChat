<template>
  <div class="chat-container">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">{{ $t('chat') }}</h2>
      
      <!-- Área de mensajes -->
      <div class="messages-area h-96 overflow-y-auto border rounded p-4 mb-4">
        <div v-for="message in messages" :key="message.id" 
             :class="['message', message.type === 'user' ? 'user-message' : 'bot-message']">
          <p>{{ message.text }}</p>
          <small class="text-gray-500">{{ formatTime(message.timestamp) }}</small>
        </div>
      </div>
      
      <!-- Input de mensaje -->
      <div class="flex gap-2">
        <input 
          v-model="newMessage" 
          @keyup.enter="sendMessage"
          type="text" 
          placeholder="Escribe tu mensaje..."
          class="flex-1 border rounded px-3 py-2"
        >
        <button 
          @click="sendMessage" 
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {{ $t('send') }}
        </button>
        <button 
          @click="toggleRecording" 
          :class="['px-4 py-2 rounded', isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700']"
          class="text-white"
        >
          {{ isRecording ? $t('stop') : $t('record') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useChatStore } from '../stores/chat'

const chatStore = useChatStore()
const newMessage = ref('')
const isRecording = ref(false)
const messages = ref([
  {
    id: 1,
    type: 'bot',
    text: '¡Hola! Soy el chatbot de Kargho. ¿En qué puedo ayudarte?',
    timestamp: new Date()
  }
])

const sendMessage = async () => {
  if (!newMessage.value.trim()) return
  
  // Agregar mensaje del usuario
  messages.value.push({
    id: Date.now(),
    type: 'user',
    text: newMessage.value,
    timestamp: new Date()
  })
  
  const userMessage = newMessage.value
  newMessage.value = ''
  
  try {
    // Enviar al backend
    const response = await chatStore.sendMessage(userMessage)
    
    // Agregar respuesta del bot
    messages.value.push({
      id: Date.now() + 1,
      type: 'bot',
      text: response.message,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Error sending message:', error)
    messages.value.push({
      id: Date.now() + 1,
      type: 'bot',
      text: 'Lo siento, hubo un error. Intenta de nuevo.',
      timestamp: new Date()
    })
  }
}

const toggleRecording = () => {
  isRecording.value = !isRecording.value
  // TODO: Implementar grabación de audio
}

const formatTime = (date) => {
  return date.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}
</script>

<style scoped>
.chat-container {
  max-width: 800px;
  margin: 0 auto;
}

.message {
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
}

.user-message {
  background-color: #e3f2fd;
  margin-left: 2rem;
}

.bot-message {
  background-color: #f5f5f5;
  margin-right: 2rem;
}
</style>