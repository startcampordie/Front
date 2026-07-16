<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getDistrictOptions, POPULAR_KEYWORDS, PROVINCES, SEARCH_TYPES } from '@/config/search'
import { searchAll, toSearchRouteQuery } from '@/services/searchService'
import { getHome } from '@/services/homeService'

const route = useRoute()
const router = useRouter()
const isLoading = ref(false)
const searchError = ref('')
const hasSearched = ref(false)
const searchResult = ref(null)
const homeLoading = ref(true)
const homeError = ref('')

const filters = reactive({ type: 'all', keyword: '', province: 'all', district: 'all' })
const districtOptions = computed(() => getDistrictOptions(filters.province))

const categoryCards = ref([])
const recentPosts = ref([])
const popularPosts = ref([])

function formatDate(date) {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return '-'
  return `${String(parsed.getMonth() + 1).padStart(2, '0')}.${String(parsed.getDate()).padStart(2, '0')}`
}

async function loadHome() {
  homeLoading.value = true
  homeError.value = ''
  try {
    const payload = await getHome()
    categoryCards.value = payload.categoryCards
    recentPosts.value = payload.recentPosts
    popularPosts.value = payload.popularPosts
  } catch (error) {
    homeError.value = error instanceof Error ? error.message : '홈 정보를 불러오지 못했습니다.'
  } finally {
    homeLoading.value = false
  }
}

function applyRouteQuery() {
  filters.type = typeof route.query.type === 'string' ? route.query.type : 'all'
  filters.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  const routeProvince = typeof route.query.province === 'string' ? route.query.province : 'all'
  filters.province = PROVINCES.some((item) => item.value === routeProvince) ? routeProvince : 'all'
  const routeDistrict = typeof route.query.district === 'string' ? route.query.district : 'all'
  filters.district = getDistrictOptions(filters.province).some((item) => item.value === routeDistrict)
    ? routeDistrict
    : 'all'
}

function changeProvince() {
  filters.district = 'all'
}

async function runSearch() {
  isLoading.value = true
  searchError.value = ''
  hasSearched.value = true

  try {
    searchResult.value = await searchAll(filters)
  } catch (error) {
    searchError.value = error instanceof Error ? error.message : '검색 중 오류가 발생했습니다.'
  } finally {
    isLoading.value = false
  }
}

async function submitSearch() {
  if (!filters.keyword.trim() && filters.province === 'all' && filters.district === 'all') return

  const nextQuery = toSearchRouteQuery(filters)
  const currentQuery = toSearchRouteQuery({
    type: route.query.type,
    keyword: route.query.keyword,
    province: route.query.province,
    district: route.query.district,
  })

  if (JSON.stringify(nextQuery) === JSON.stringify(currentQuery)) {
    await runSearch()
    return
  }

  await router.replace({ name: 'home', query: nextQuery, hash: '#search' })
}

function searchKeyword(keyword) {
  filters.keyword = keyword
  submitSearch()
}

watch(
  () => route.query,
  () => {
    applyRouteQuery()
    if (filters.keyword || filters.province !== 'all' || filters.district !== 'all') runSearch()
  },
  { immediate: true },
)

onMounted(loadHome)
</script>

<template>
  <section id="search" class="hero-section">
    <div class="container">
      <h1>호남의 매력을 한 번에 찾아보세요</h1>
      <p>전북·전남의 관광지, 맛집, 축제와 지역 게시글을 통합 검색합니다.</p>

      <form class="home-search" role="search" @submit.prevent="submitSearch">
        <label class="sr-only" for="home-search-type">검색 대상</label>
        <select id="home-search-type" v-model="filters.type">
          <option v-for="option in SEARCH_TYPES" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <label class="sr-only" for="home-search-keyword">검색어</label>
        <input
          id="home-search-keyword"
          v-model="filters.keyword"
          type="search"
          placeholder="관광지, 맛집, 축제, 게시글 검색"
        />
        <label class="sr-only" for="home-search-province">시·도</label>
        <select id="home-search-province" v-model="filters.province" @change="changeProvince">
          <option v-for="province in PROVINCES" :key="province.value" :value="province.value">
            {{ province.label }}
          </option>
        </select>
        <label class="sr-only" for="home-search-district">시·군</label>
        <select id="home-search-district" v-model="filters.district">
          <option v-for="district in districtOptions" :key="district.value" :value="district.value">
            {{ district.label }}
          </option>
        </select>
        <button class="button button-dark" type="submit">검색</button>
      </form>

      <div class="popular-keywords" aria-label="인기 검색어">
        <strong>인기 검색 키워드</strong>
        <button v-for="keyword in POPULAR_KEYWORDS" :key="keyword" @click="searchKeyword(keyword)">
          {{ keyword }}
        </button>
      </div>

      <div v-if="hasSearched" class="search-status" aria-live="polite">
        <p v-if="isLoading">검색하고 있습니다…</p>
        <p v-else-if="searchError" class="error-text">{{ searchError }}</p>
        <p v-else-if="searchResult?.totalCount === 0">검색 결과가 없습니다.</p>
        <p v-else>총 {{ searchResult?.totalCount }}개의 검색 결과가 있습니다.</p>
      </div>

      <div v-if="hasSearched && !isLoading && searchResult?.items.length" class="global-results">
        <RouterLink v-for="item in searchResult.items" :key="item.id" :to="item.route" class="global-result-item">
          <span>{{ item.typeLabel }}</span><div><strong>{{ item.title }}</strong><p>{{ item.description }}</p></div>
        </RouterLink>
      </div>
    </div>
  </section>

  <div class="container home-content">
    <p v-if="homeError" class="error-text">{{ homeError }}</p>
    <div v-if="homeLoading" class="empty-state">홈 정보를 불러오는 중입니다…</div>
    <section class="content-section">
      <div class="section-heading">
        <h2>카테고리 바로가기</h2>
      </div>
      <div class="category-grid">
        <article v-for="card in categoryCards" :key="card.name" class="category-card">
          <img v-if="card.imageUrl" :src="card.imageUrl" :alt="`${card.name} 사진`" />
          <div v-else class="image-placeholder">사진 없음</div>
          <div>
            <span class="eyebrow">{{ card.category }}</span>
            <h3>{{ card.name }}</h3>
            <p>{{ card.address }}</p>
            <RouterLink :to="{ name: 'regions', query: { category: card.type } }">목록 보기 →</RouterLink>
          </div>
        </article>
      </div>
    </section>

    <section class="post-grid">
      <div>
        <h2>최근 게시글</h2>
        <table>
          <thead><tr><th>제목</th><th>날짜</th><th>조회</th></tr></thead>
          <tbody>
            <tr v-for="post in recentPosts" :key="post.title">
              <td><RouterLink :to="{ name: 'board-detail', params: { id: post.id } }">{{ post.title }}</RouterLink></td><td>{{ formatDate(post.date) }}</td><td>{{ post.views }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div>
        <h2>많이 본 게시글</h2>
        <table>
          <thead><tr><th>제목</th><th>날짜</th><th>조회</th></tr></thead>
          <tbody>
            <tr v-for="post in popularPosts" :key="post.title">
              <td><RouterLink :to="{ name: 'board-detail', params: { id: post.id } }">{{ post.title }}</RouterLink></td><td>{{ formatDate(post.date) }}</td><td>{{ post.views }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
