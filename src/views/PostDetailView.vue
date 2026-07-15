<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppModal from '@/components/common/AppModal.vue'
import { deletePost, getPost, verifyPostPassword } from '@/services/boardService'

const route = useRoute()
const router = useRouter()
const post = ref(null)
const loading = ref(true)
const error = ref('')
const action = ref('')
const password = ref('')
const passwordError = ref('')
const checking = ref(false)
const showDeleteConfirmation = ref(false)

onMounted(async () => {
  try { post.value = await getPost(route.params.id) }
  catch (caught) { error.value = caught instanceof Error ? caught.message : '게시글을 불러오지 못했습니다.' }
  finally { loading.value = false }
})

function openPasswordModal(nextAction) {
  action.value = nextAction
  password.value = ''
  passwordError.value = ''
}

function closePasswordModal() {
  action.value = ''
  password.value = ''
  passwordError.value = ''
}

async function confirmPassword() {
  if (!password.value) {
    passwordError.value = '비밀번호를 입력해 주세요.'
    return
  }

  checking.value = true
  passwordError.value = ''
  try {
    const result = await verifyPostPassword(route.params.id, password.value)
    if (!result.verified) {
      passwordError.value = '비밀번호가 일치하지 않습니다.'
      return
    }

    if (action.value === 'edit') {
      await router.push({ name: 'board-edit', params: { id: route.params.id } })
    } else {
      action.value = ''
      showDeleteConfirmation.value = true
    }
  } catch (caught) {
    passwordError.value = caught instanceof Error ? caught.message : '비밀번호를 확인하지 못했습니다.'
  } finally {
    checking.value = false
  }
}

async function confirmDelete() {
  checking.value = true
  try {
    await deletePost(route.params.id, password.value)
    await router.replace({ name: 'board' })
  } catch (caught) {
    showDeleteConfirmation.value = false
    passwordError.value = caught instanceof Error ? caught.message : '게시글을 삭제하지 못했습니다.'
    action.value = 'delete'
  } finally { checking.value = false }
}
</script>

<template>
  <div class="container page-section post-detail-page">
    <p class="breadcrumb">홈 &gt; 게시판 &gt; 게시글 상세</p>
    <div v-if="loading" class="empty-state">게시글을 불러오는 중입니다…</div>
    <div v-else-if="error" class="empty-state"><p class="form-error">{{ error }}</p><RouterLink class="button" :to="{ name: 'board' }">목록</RouterLink></div>
    <article v-else-if="post" class="post-detail">
      <h1>{{ post.title }}</h1>
      <div class="post-meta"><span>작성자 {{ post.author }}</span><span>{{ post.createdAt }}</span><span>조회 {{ post.views }}</span></div>
      <div class="post-content">{{ post.content }}</div>
      <div class="detail-actions">
        <RouterLink class="button" :to="{ name: 'board' }">목록</RouterLink>
        <button class="button button-outline-primary" @click="openPasswordModal('edit')">수정</button>
        <button class="button button-danger" @click="openPasswordModal('delete')">삭제</button>
      </div>
    </article>
  </div>

  <AppModal v-if="action" title="비밀번호 확인" @close="closePasswordModal">
    <p>{{ action === 'edit' ? '수정' : '삭제' }}을 위해 비밀번호를 입력해 주세요.</p>
    <form @submit.prevent="confirmPassword">
      <label class="sr-only" for="detail-password">비밀번호</label>
      <input id="detail-password" v-model="password" class="modal-input" type="password" autofocus placeholder="비밀번호" />
      <p v-if="passwordError" class="field-error">{{ passwordError }}</p>
    </form>
    <template #footer>
      <button class="button" type="button" @click="closePasswordModal">취소</button>
      <button class="button button-primary" type="button" :disabled="checking" @click="confirmPassword">{{ checking ? '확인 중…' : '확인' }}</button>
    </template>
  </AppModal>

  <AppModal v-if="showDeleteConfirmation" title="게시글 삭제" @close="showDeleteConfirmation = false">
    <p>삭제한 게시글은 복구할 수 없습니다. 정말 삭제하시겠습니까?</p>
    <template #footer>
      <button class="button" type="button" @click="showDeleteConfirmation = false">취소</button>
      <button class="button button-danger" type="button" :disabled="checking" @click="confirmDelete">{{ checking ? '삭제 중…' : '삭제' }}</button>
    </template>
  </AppModal>
</template>
