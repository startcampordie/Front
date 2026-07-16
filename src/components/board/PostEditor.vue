<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  mode: { type: String, required: true, validator: (value) => ['create', 'edit'].includes(value) },
  initialPost: { type: Object, default: null },
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['submit', 'cancel'])
const form = reactive({ title: '', content: '', password: '' })
const validationError = reactive({ title: '', content: '', password: '' })

watch(
  () => props.initialPost,
  (post) => {
    form.title = post?.title ?? ''
    form.content = post?.content ?? ''
    // 실제 서버는 기존 비밀번호를 반환하지 않으므로 수정 화면에서도 항상 빈 값으로 둡니다.
    form.password = ''
  },
  { immediate: true },
)

function validate() {
  validationError.title = form.title.trim() ? '' : '제목을 입력해 주세요.'
  validationError.content = form.content.trim() ? '' : '내용을 입력해 주세요.'
  validationError.password = form.password.length >= 4 ? '' : '비밀번호를 4자 이상 입력해 주세요.'
  return !Object.values(validationError).some(Boolean)
}

function submit() {
  if (validate()) emit('submit', { ...form })
}
</script>

<template>
  <form class="post-editor" @submit.prevent="submit">
    <label for="post-title">제목</label>
    <input id="post-title" v-model="form.title" maxlength="100" placeholder="제목을 입력하세요" />
    <p v-if="validationError.title" class="field-error">{{ validationError.title }}</p>

    <label for="post-content">내용</label>
    <textarea id="post-content" v-model="form.content" rows="12" maxlength="5000" placeholder="내용을 입력하세요" />
    <p v-if="validationError.content" class="field-error">{{ validationError.content }}</p>

    <div class="password-field">
      <div>
        <label for="post-password">수정용 비밀번호</label>
        <input id="post-password" v-model="form.password" type="password" minlength="4" maxlength="100" autocomplete="new-password" placeholder="비밀번호 4자 이상" />
        <p v-if="validationError.password" class="field-error">{{ validationError.password }}</p>
      </div>
      <p>이 게시글을 수정하거나 삭제할 때 사용됩니다. 비밀번호를 잊지 않도록 주의해 주세요.</p>
    </div>

    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
    <div class="form-actions">
      <button class="button" type="button" @click="$emit('cancel')">취소</button>
      <button class="button button-primary" type="submit" :disabled="submitting">
        {{ submitting ? '처리 중…' : mode === 'create' ? '등록' : '수정' }}
      </button>
    </div>
  </form>
</template>
