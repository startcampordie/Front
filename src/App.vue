<script setup>
import AppHeader from '@/components/layout/AppHeader.vue'
import ChatbotWidget from '@/components/chatbot/ChatbotWidget.vue'
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <main class="page-content">
      <RouterView />
    </main>
    <ChatbotWidget />
  </div>
</template>
