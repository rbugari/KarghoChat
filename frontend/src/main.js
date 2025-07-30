import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import router from './router'
import './style.css'

// Configuración de internacionalización
const i18n = createI18n({
  locale: 'es',
  fallbackLocale: 'en',
  messages: {
    es: {
      welcome: 'Bienvenido a Kargho Chatbot',
      chat: 'Chat',
      send: 'Enviar',
      record: 'Grabar',
      stop: 'Detener'
    },
    en: {
      welcome: 'Welcome to Kargho Chatbot',
      chat: 'Chat',
      send: 'Send',
      record: 'Record',
      stop: 'Stop'
    }
  }
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.mount('#app')