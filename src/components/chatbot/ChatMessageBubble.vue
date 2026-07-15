<script setup>
import { computed } from 'vue'
import ChatReferenceCard from './ChatReferenceCard.vue'

const props = defineProps({
  message: { type: Object, required: true },
  retryDisabled: { type: Boolean, default: false },
  canRetry: { type: Boolean, default: true },
})

defineEmits(['retry', 'open-reference', 'focus-input'])

const INTENT_LABELS = {
  attraction: '관광지',
  culture: '문화시설',
  restaurant: '음식점',
  festival: '축제·행사',
}

const intentLabel = computed(() => INTENT_LABELS[props.message.intent] ?? '')
const formattedTime = computed(() => {
  if (!props.message.createdAt) return ''
  const date = new Date(props.message.createdAt)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit' }).format(date)
})
</script>

<template>
  <article class="chatbot-message-row" :class="`chatbot-message-${message.role}`">
    <div class="chatbot-message-bubble">
      <span v-if="intentLabel" class="chatbot-message-intent">{{ intentLabel }}</span>
      <p>{{ message.content }}</p>
    </div>

    <div class="chatbot-message-meta">
      <time v-if="formattedTime" :datetime="message.createdAt">{{ formattedTime }}</time>
      <span v-if="message.status === 'sending'">전송 중</span>
      <span v-else-if="message.status === 'error'">전송 실패</span>
    </div>

    <div v-if="message.status === 'error'" class="chatbot-message-error" role="alert">
      <strong>{{ message.errorTitle || '일시적인 오류가 발생했어요' }}</strong>
      <p>{{ message.errorMessage || '연결 상태를 확인하고 잠시 후 다시 시도해 주세요.' }}</p>
      <button
        v-if="canRetry"
        type="button"
        class="chatbot-inline-button"
        :disabled="retryDisabled"
        @click="$emit('retry', message)"
      >
        다시 시도
      </button>
    </div>

    <div v-if="message.role === 'assistant' && message.isEmpty" class="chatbot-empty-state">
      <strong>검색 결과가 없어요</strong>
      <p>검색어나 유형을 바꿔 다시 시도해 주세요.</p>
      <button type="button" class="chatbot-inline-button" @click="$emit('focus-input')">
        다시 검색
      </button>
    </div>

    <div
      v-if="message.role === 'assistant' && message.references?.length"
      class="chatbot-reference-list"
    >
      <p v-if="message.total > message.references.length" class="chatbot-reference-summary">
        총 {{ message.total }}건 중 {{ message.references.length }}건을 안내합니다.
      </p>
      <ChatReferenceCard
        v-for="reference in message.references"
        :key="`${reference.type}-${reference.id}`"
        :reference="reference"
        @open="$emit('open-reference', $event)"
      />
    </div>
  </article>
</template>
