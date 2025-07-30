<template>
  <div id="app">
    <header class="bg-blue-600 text-white p-4">
      <h1 class="text-2xl font-bold">{{ $t('welcome') }}</h1>
    </header>
    
    <main class="container mx-auto p-4">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
</script>

<style scoped>
#app {
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style>