<script setup>
import { computed } from 'vue'
import defaultPlaceImage from '@/assets/default-place.svg'

const props = defineProps({
  reference: { type: Object, required: true },
})

defineEmits(['open'])

const CATEGORY_LABELS = {
  ATTRACTION: '관광지',
  CULTURE: '문화시설',
  RESTAURANT: '음식점',
  FESTIVAL: '축제·행사',
}

const categoryLabel = computed(
  () => CATEGORY_LABELS[props.reference.category] ?? props.reference.category ?? '지역정보',
)
const imageSource = computed(() => props.reference.imageUrl || defaultPlaceImage)

function replaceBrokenImage(event) {
  if (event.currentTarget.src.endsWith(defaultPlaceImage)) return
  event.currentTarget.src = defaultPlaceImage
}
</script>

<template>
  <article class="chatbot-reference-card">
    <img
      class="chatbot-reference-image"
      :src="imageSource"
      :alt="`${reference.title || '지역정보 장소'} 대표 이미지`"
      @error="replaceBrokenImage"
    />
    <div class="chatbot-reference-content">
      <span class="chatbot-reference-category">{{ categoryLabel }}</span>
      <h3 :title="reference.title">{{ reference.title }}</h3>
      <p class="chatbot-reference-address" :title="reference.address || '주소 정보 없음'">
        {{ reference.address || '주소 정보 없음' }}
      </p>
      <p v-if="reference.telephone" class="chatbot-reference-telephone">
        <span aria-hidden="true">☎</span> {{ reference.telephone }}
      </p>
    </div>
    <p v-if="reference.reason" class="chatbot-reference-reason">
      <strong>추천 이유</strong>
      <span>{{ reference.reason }}</span>
    </p>
    <button type="button" class="chatbot-reference-link" @click="$emit('open', reference)">
      지역정보에서 보기
    </button>
  </article>
</template>
