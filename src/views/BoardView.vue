<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPosts } from '@/services/boardService'

const route = useRoute()
const router = useRouter()
const result = reactive({ items: [], totalCount: 0, totalPages: 1, page: 1 })
const filters = reactive({ keyword: '', searchType: 'title-content', sort: 'latest' })
const loading = ref(false)
const error = ref('')
const pageSize = 10

const visiblePages = computed(() => {
  const groupStart = Math.floor((result.page - 1) / 10) * 10 + 1
  const groupEnd = Math.min(groupStart + 9, result.totalPages)
  return Array.from({ length: groupEnd - groupStart + 1 }, (_, index) => groupStart + index)
})

function applyQuery() {
  filters.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  filters.searchType = typeof route.query.searchType === 'string' ? route.query.searchType : 'title-content'
  filters.sort = route.query.sort === 'views' ? 'views' : 'latest'
}

async function loadPosts() {
  loading.value = true
  error.value = ''
  try {
    Object.assign(result, await getPosts({ ...filters, page: Number(route.query.page) || 1, pageSize }))
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : '게시글을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

function updateRoute(page = 1) {
  router.push({
    name: 'board',
    query: {
      ...(filters.keyword.trim() && { keyword: filters.keyword.trim() }),
      ...(filters.searchType !== 'title-content' && { searchType: filters.searchType }),
      ...(filters.sort !== 'latest' && { sort: filters.sort }),
      ...(page > 1 && { page }),
    },
  })
}

function formatDate(date) {
  return date.startsWith(String(new Date().getFullYear())) ? date.slice(5).replace('-', '.') : date.replaceAll('-', '.')
}

watch(() => route.query, () => { applyQuery(); loadPosts() }, { deep: true })
watch(() => filters.sort, () => updateRoute(1))
onMounted(() => { applyQuery(); loadPosts() })
</script>

<template>
  <div class="container page-section">
    <p class="breadcrumb">홈 &gt; 게시판</p>
    <h1>게시판</h1>
    <p class="page-description">광주 지역의 다양한 정보와 소식을 자유롭게 공유해 보세요.</p>

    <form class="board-tools" role="search" @submit.prevent="updateRoute(1)">
      <select v-model="filters.searchType" aria-label="검색 범위"><option value="title-content">제목 + 내용</option><option value="title">제목</option><option value="content">내용</option></select>
      <input v-model="filters.keyword" type="search" placeholder="검색어를 입력하세요" />
      <select v-model="filters.sort" aria-label="정렬"><option value="latest">최신순</option><option value="views">조회순</option></select>
      <button class="button button-dark">검색</button>
      <RouterLink class="button button-primary" :to="{ name: 'board-create' }">글 작성</RouterLink>
    </form>

    <p class="result-count">총 {{ result.totalCount }}개의 게시글</p>
    <p v-if="error" class="form-error">{{ error }}</p>
    <div v-if="loading" class="empty-state">게시글을 불러오는 중입니다…</div>
    <table v-else class="data-table board-table">
      <thead><tr><th>번호</th><th>제목</th><th>작성일자</th><th>조회수</th></tr></thead>
      <tbody>
        <tr v-for="post in result.items" :key="post.id">
          <td>{{ post.id }}</td>
          <td><RouterLink :to="{ name: 'board-detail', params: { id: post.id } }">{{ post.title }}</RouterLink></td>
          <td>{{ formatDate(post.createdAt) }}</td><td>{{ post.views }}</td>
        </tr>
        <tr v-if="result.items.length === 0"><td colspan="4" class="empty-state">검색 결과가 없습니다.</td></tr>
      </tbody>
    </table>

    <nav class="pagination" aria-label="게시판 페이지">
      <button :disabled="result.page === 1" @click="updateRoute(1)">처음</button>
      <button :disabled="result.page === 1" @click="updateRoute(result.page - 1)">이전</button>
      <button v-for="page in visiblePages" :key="page" :class="{ current: page === result.page }" @click="updateRoute(page)">{{ page }}</button>
      <button :disabled="result.page === result.totalPages" @click="updateRoute(result.page + 1)">다음</button>
      <button :disabled="result.page === result.totalPages" @click="updateRoute(result.totalPages)">마지막</button>
    </nav>
  </div>
</template>
