import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export const useChatStore = defineStore('chat', {
  state: () => ({
    sessionId: null,
    messages: [],
    isLoading: false
  }),
  
  actions: {
    async sendMessage(message) {
      this.isLoading = true
      
      try {
        const response = await axios.post(`${API_BASE_URL}/chat`, {
          message,
          sessionId: this.sessionId
        })
        
        if (!this.sessionId) {
          this.sessionId = response.data.data.sessionId
        }
        
        return response.data.data
      } catch (error) {
        console.error('Error sending message:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    async getHistory() {
      if (!this.sessionId) return []
      
      try {
        const response = await axios.get(`${API_BASE_URL}/chat/history/${this.sessionId}`)
        this.messages = response.data.data
        return this.messages
      } catch (error) {
        console.error('Error getting history:', error)
        return []
      }
    }
  }
})