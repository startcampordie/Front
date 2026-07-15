<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PostEditor from '@/components/board/PostEditor.vue'
import { getPost, updatePost } from '@/services/boardService'

const route = useRoute()
const router = useRouter()
const post = ref(null)
const loading = ref(true)
const submitting = ref(false)
const error = ref('')

onMounted(async () => {
  try { post.value = await getPost(route.params.id, { increaseView: false }) }
  catch (caught) { error.value = caught instanceof Error ? caught.message : '게시글을 불러오지 못했습니다.' }
  finally { loading.value = false }
})

async function submit(input) {
  submitting.value = true
  error.value = ''
  try {
    await updatePost(route.params.id, input)
    await router.push({ name: 'board-detail', params: { id: route.params.id } })
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : '게시글을 수정하지 못했습니다.'
  } finally { submitting.value = false }
}
</script>

<template>
  <div class="container page-section editor-page">
    <p class="breadcrumb">홈 &gt; 게시판 &gt; 게시글 수정</p>
    <h1>게시글 수정</h1>
    <div v-if="loading" class="empty-state">게시글을 불러오는 중입니다…</div>
    <PostEditor v-else-if="post" mode="edit" :initial-post="post" :submitting="submitting" :error="error" @submit="submit" @cancel="router.push({ name: 'board-detail', params: { id: route.params.id } })" />
    <p v-else class="form-error">{{ error }}</p>
  </div>
</template>
