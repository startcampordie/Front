<script setup>
import { nextTick, ref } from 'vue'
import { sendChatMessage } from '@/services/chatbotService'

const isOpen = ref(false)
const message = ref('')
const sending = ref(false)
const log = ref([{ role: 'bot', text: '안녕하세요! 무엇을 도와드릴까요?' }])
const messagesElement = ref(null)
const quickQuestions = ['광주 유명한 맛집 알려줘', '아이와 갈 만한 곳 추천해줘', '이번 주말 축제 알려줘', '광주 문화시설 추천해줘']

async function submit(text = message.value) {
  const trimmed = text.trim()
  if (!trimmed || sending.value) return
  log.value.push({ role: 'user', text: trimmed })
  message.value = ''
  sending.value = true
  try {
    const response = await sendChatMessage(trimmed, log.value.slice(0, -1))
    log.value.push({ role: 'bot', text: response.message })
  } catch (error) {
    log.value.push({ role: 'bot', text: error instanceof Error ? error.message : '응답을 불러오지 못했습니다.' })
  } finally {
    sending.value = false
    await nextTick()
    messagesElement.value?.scrollTo({ top: messagesElement.value.scrollHeight, behavior: 'smooth' })
  }
}
</script>

<template>
  <aside class="chatbot" :class="{ open: isOpen }">
    <section v-if="isOpen" class="chat-window" aria-label="LocalHub 챗봇">
      <header><strong>LocalHub 챗봇</strong><button type="button" aria-label="챗봇 닫기" @click="isOpen = false">×</button></header>
      <div ref="messagesElement" class="chat-body chat-messages">
        <p v-for="(item, index) in log" :key="index" class="chat-message" :class="item.role">{{ item.text }}</p>
        <template v-if="log.length === 1"><small>자주 묻는 질문을 선택해 보세요.</small><button v-for="question in quickQuestions" :key="question" class="quick-question" type="button" @click="submit(question)">{{ question }} <span>›</span></button></template>
        <p v-if="sending" class="chat-message bot">답변을 준비하고 있어요…</p>
      </div>
      <form class="chat-input" @submit.prevent="submit()"><input v-model="message" aria-label="챗봇 메시지" placeholder="메시지를 입력하세요" /><button type="submit" :disabled="sending">전송</button></form>
    </section>
    <button class="chat-toggle" type="button" :aria-expanded="isOpen" :aria-label="isOpen ? '챗봇 닫기' : '챗봇 열기'" @click="isOpen = !isOpen">챗</button>
  </aside>
</template>
