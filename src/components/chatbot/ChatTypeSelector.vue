<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const CHAT_INTENTS = [
  { value: 'attraction', label: '관광지' },
  { value: 'culture', label: '문화시설' },
  { value: 'restaurant', label: '음식점' },
  { value: 'festival', label: '축제·행사' },
]

function selectIntent(value) {
  emit('update:modelValue', value)
}
</script>

<template>
  <section class="chatbot-type-section" aria-labelledby="chatbot-type-label">
    <p id="chatbot-type-label" class="chatbot-section-label">검색 유형</p>
    <div class="chatbot-type-list">
      <button
        v-for="item in CHAT_INTENTS"
        :key="item.value"
        type="button"
        class="chatbot-type-button"
        :class="{ selected: modelValue === item.value }"
        :aria-pressed="modelValue === item.value"
        :disabled="disabled"
        @click="selectIntent(item.value)"
      >
        {{ item.label }}
      </button>
    </div>
    <p v-if="error" class="chatbot-field-error" role="alert">{{ error }}</p>
  </section>
</template>
