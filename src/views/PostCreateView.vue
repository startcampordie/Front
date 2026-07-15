<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PostEditor from '@/components/board/PostEditor.vue'
import { createPost } from '@/services/boardService'

const router = useRouter()
const submitting = ref(false)
const error = ref('')

async function submit(input) {
  submitting.value = true
  error.value = ''
  try {
    const post = await createPost(input)
    await router.push({ name: 'board-detail', params: { id: post.id } })
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : '게시글을 등록하지 못했습니다.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="container page-section editor-page">
    <p class="breadcrumb">홈 &gt; 게시판 &gt; 게시글 작성</p>
    <h1>게시글 작성</h1>
    <PostEditor mode="create" :submitting="submitting" :error="error" @submit="submit" @cancel="router.push({ name: 'board' })" />
  </div>
</template>
