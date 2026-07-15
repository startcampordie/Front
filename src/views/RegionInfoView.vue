<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPlaces } from '@/services/placeService'

const route = useRoute()
const router = useRouter()
const categories = [
  { value: 'all', label: '전체' }, { value: 'attraction', label: '관광지' },
  { value: 'culture', label: '문화시설' }, { value: 'restaurant', label: '음식점' },
  { value: 'festival', label: '축제·행사' }, { value: 'leisure', label: '레포츠' },
  { value: 'lodging', label: '숙박' }, { value: 'shopping', label: '쇼핑' },
]
const tags = ['조용한', '연인', '아이', '가족', '친구', '혼자', '사진', '자연', '체험', '활기찬']
const filters = reactive({ category: 'all', selectedTags: [], keyword: '' })
const keywordInput = ref('')
const result = reactive({ items: [], totalCount: 0, totalPages: 1, page: 1 })
const loading = ref(false)
const error = ref('')
const pageSize = 6

const selectedCategoryLabel = computed(() => categories.find((item) => item.value === filters.category)?.label ?? '전체')
const visiblePages = computed(() => {
  const start = Math.floor((result.page - 1) / 5) * 5 + 1
  const end = Math.min(start + 4, result.totalPages)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

function applyQuery() {
  filters.category = typeof route.query.category === 'string' ? route.query.category : 'all'
  filters.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  keywordInput.value = filters.keyword
  filters.selectedTags = typeof route.query.tags === 'string' ? route.query.tags.split(',').filter(Boolean) : []
}

async function loadPlaces() {
  loading.value = true
  error.value = ''
  try {
    Object.assign(result, await getPlaces({ category: filters.category, tags: filters.selectedTags, keyword: filters.keyword, page: Number(route.query.page) || 1, pageSize }))
  } catch (caught) { error.value = caught instanceof Error ? caught.message : '지역 정보를 불러오지 못했습니다.' }
  finally { loading.value = false }
}

function updateRoute(page = 1) {
  router.push({ name: 'regions', query: {
    ...(filters.category !== 'all' && { category: filters.category }),
    ...(filters.selectedTags.length && { tags: filters.selectedTags.join(',') }),
    ...(filters.keyword && { keyword: filters.keyword }),
    ...(page > 1 && { page }),
  } })
}

function selectCategory(category) { filters.category = category; updateRoute(1) }
function toggleTag(tag) {
  filters.selectedTags = filters.selectedTags.includes(tag) ? filters.selectedTags.filter((item) => item !== tag) : [...filters.selectedTags, tag]
  updateRoute(1)
}
function search() { filters.keyword = keywordInput.value.trim(); updateRoute(1) }
function resetFilters() { filters.category = 'all'; filters.selectedTags = []; filters.keyword = ''; keywordInput.value = ''; router.push({ name: 'regions' }) }

watch(() => route.query, () => { applyQuery(); loadPlaces() }, { deep: true })
onMounted(() => { applyQuery(); loadPlaces() })
</script>

<template>
  <div class="container page-section">
    <p class="breadcrumb">홈 &gt; 지역 정보</p>
    <h1>광주 지역 정보</h1>
    <p class="page-description">제공된 JSON 데이터를 카테고리와 태그별로 찾아보세요.</p>

    <div class="filter-row"><strong>카테고리</strong><button v-for="item in categories" :key="item.value" :class="{ selected: filters.category === item.value }" @click="selectCategory(item.value)">{{ item.label }}</button></div>
    <div class="filter-row"><strong>태그 필터</strong><button v-for="tag in tags" :key="tag" :class="{ selected: filters.selectedTags.includes(tag) }" @click="toggleTag(tag)">{{ tag }}</button><button v-if="filters.selectedTags.length" @click="filters.selectedTags = []; updateRoute(1)">전체 해제</button></div>

    <div class="selection-summary">
      <span>선택된 카테고리: {{ selectedCategoryLabel }}<template v-if="filters.selectedTags.length"> · 선택 태그: {{ filters.selectedTags.join(', ') }}</template></span>
      <span>검색 결과 {{ result.totalCount }}건</span>
    </div>
    <form class="region-search" @submit.prevent="search"><input v-model="keywordInput" placeholder="장소 이름 또는 주소 검색" /><button class="button button-dark">검색</button><button class="button" type="button" @click="resetFilters">초기화</button></form>

    <p v-if="error" class="form-error">{{ error }}</p>
    <div v-if="loading" class="empty-state">지역 정보를 불러오는 중입니다…</div>
    <table v-else class="data-table place-table">
      <thead><tr><th>사진</th><th>관광지 이름</th><th>주소</th></tr></thead>
      <tbody>
        <tr v-for="place in result.items" :key="place.id"><td><img v-if="place.imageUrl" :src="place.imageUrl" :alt="`${place.name} 사진`" /><span v-else class="table-image">사진 없음</span></td><td><strong>{{ place.name }}</strong><small>{{ place.categoryLabel }} · {{ place.tags.join(', ') }}</small></td><td>{{ place.address }}</td></tr>
        <tr v-if="result.items.length === 0"><td colspan="3" class="empty-state">조건에 맞는 지역 정보가 없습니다.</td></tr>
      </tbody>
    </table>

    <nav class="pagination" aria-label="지역 정보 페이지">
      <button :disabled="result.page === 1" @click="updateRoute(1)">처음</button><button :disabled="result.page === 1" @click="updateRoute(result.page - 1)">이전</button>
      <button v-for="page in visiblePages" :key="page" :class="{ current: page === result.page }" @click="updateRoute(page)">{{ page }}</button>
      <button :disabled="result.page === result.totalPages" @click="updateRoute(result.page + 1)">다음</button><button :disabled="result.page === result.totalPages" @click="updateRoute(result.totalPages)">마지막</button>
    </nav>
  </div>
</template>
