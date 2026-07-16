<script setup>
import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { POPULAR_KEYWORDS, SEARCH_TYPES } from '@/config/search'
import { searchAll, toSearchRouteQuery } from '@/services/searchService'

const route = useRoute()
const router = useRouter()
const isLoading = ref(false)
const searchError = ref('')
const hasSearched = ref(false)
const searchResult = ref(null)

const filters = reactive({ type: 'all', keyword: '', province: 'all', region: 'all' })

const PROVINCES = [
  { value: 'all', label: '전체' },
  { value: '전북', label: '전북' },
  { value: '전남', label: '전남' },
]

const REGIONS_BY_PROVINCE = {
  all: [{ value: 'all', label: '전체 지역' }],
  전북: [
    { value: 'all', label: '전북 전체' },
    { value: '전주시', label: '전주시' }, { value: '군산시', label: '군산시' },
    { value: '익산시', label: '익산시' }, { value: '정읍시', label: '정읍시' },
    { value: '남원시', label: '남원시' }, { value: '김제시', label: '김제시' },
    { value: '완주군', label: '완주군' }, { value: '진안군', label: '진안군' },
    { value: '무주군', label: '무주군' }, { value: '장수군', label: '장수군' },
    { value: '임실군', label: '임실군' }, { value: '순창군', label: '순창군' },
    { value: '고창군', label: '고창군' }, { value: '부안군', label: '부안군' },
  ],
  전남: [
    { value: 'all', label: '전남 전체' },
    { value: '목포시', label: '목포시' }, { value: '여수시', label: '여수시' },
    { value: '순천시', label: '순천시' }, { value: '나주시', label: '나주시' },
    { value: '광양시', label: '광양시' }, { value: '담양군', label: '담양군' },
    { value: '곡성군', label: '곡성군' }, { value: '구례군', label: '구례군' },
    { value: '고흥군', label: '고흥군' }, { value: '보성군', label: '보성군' },
    { value: '화순군', label: '화순군' }, { value: '장흥군', label: '장흥군' },
    { value: '강진군', label: '강진군' }, { value: '해남군', label: '해남군' },
    { value: '영암군', label: '영암군' }, { value: '무안군', label: '무안군' },
    { value: '함평군', label: '함평군' }, { value: '영광군', label: '영광군' },
    { value: '장성군', label: '장성군' }, { value: '완도군', label: '완도군' },
    { value: '진도군', label: '진도군' }, { value: '신안군', label: '신안군' },
  ],
}

const categoryCards = [
  { category: '관광지', name: '무등산 국립공원', address: '광주 북구 무등산로', type: 'attraction' },
  { category: '문화시설', name: '국립아시아문화전당', address: '광주 동구 문화전당로', type: 'culture' },
  { category: '음식점', name: '송정떡갈비 골목', address: '광주 광산구 광산로', type: 'restaurant' },
  { category: '축제·행사', name: '광주 추억의 충장축제', address: '광주 동구 충장로', type: 'festival' },
]

const recentPosts = [
  { title: '이번 주 광주 행사 일정 공유', date: '07.14', views: 24 },
  { title: '무등산 산책 코스 추천', date: '07.13', views: 18 },
  { title: '서촌 맛집 다녀온 후기', date: '07.12', views: 36 },
  { title: '분리수거 일정 변경 안내', date: '07.11', views: 11 },
]

const popularPosts = [
  { title: '광주 맛집 추천 모음', date: '07.10', views: 162 },
  { title: '아이와 가기 좋은 문화시설', date: '07.09', views: 143 },
  { title: '주말 축제 주차 정보', date: '07.08', views: 127 },
  { title: '송정역 주변 카페 추천', date: '07.07', views: 98 },
]

function applyRouteQuery() {
  filters.type = typeof route.query.type === 'string' ? route.query.type : 'all'
  filters.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  filters.region = typeof route.query.region === 'string' ? route.query.region : 'all'

  if (filters.region === '전북') {
    filters.province = '전북'; filters.region = 'all'
  } else if (filters.region === '전남') {
    filters.province = '전남'; filters.region = 'all'
  } else if (filters.region !== 'all' && REGIONS_BY_PROVINCE.전북.some((region) => region.value === filters.region)) {
    filters.province = '전북'
  } else if (filters.region !== 'all' && REGIONS_BY_PROVINCE.전남.some((region) => region.value === filters.region)) {
    filters.province = '전남'
  } else {
    filters.province = 'all'
  }
}

function changeProvince() { filters.region = 'all' }

async function runSearch() {
  isLoading.value = true
  searchError.value = ''
  hasSearched.value = true

  try {
    searchResult.value = await searchAll({
      ...filters,
      region: filters.region === 'all' && filters.province !== 'all' ? filters.province : filters.region,
    })
  } catch (error) {
    searchError.value = error instanceof Error ? error.message : '검색 중 오류가 발생했습니다.'
  } finally {
    isLoading.value = false
  }
}

async function submitSearch() {
  if (!filters.keyword.trim()) return

  const nextQuery = toSearchRouteQuery({
    ...filters,
    region: filters.region === 'all' && filters.province !== 'all' ? filters.province : filters.region,
  })
  const currentQuery = toSearchRouteQuery({
    type: route.query.type,
    keyword: route.query.keyword,
    region: route.query.region,
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
    if (filters.keyword) runSearch()
  },
  { immediate: true },
)
</script>

<template>
  <section id="search" class="hero-section">
    <div class="container">
      <h1>광주의 매력을 한 번에 찾아보세요</h1>
      <p>관광지, 맛집, 축제와 지역 게시글을 통합 검색합니다.</p>

      <form class="home-search" role="search" @submit.prevent="submitSearch">
        <label class="sr-only" for="home-search-type">검색 대상</label>
        <select id="home-search-type" v-model="filters.type" class="search-type-select">
          <option v-for="option in SEARCH_TYPES" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <label class="sr-only" for="home-search-keyword">검색어</label>
        <input
          id="home-search-keyword"
          v-model="filters.keyword"
          class="search-keyword-input"
          type="search"
          placeholder="관광지, 맛집, 축제, 게시글 검색"
        />
        <label class="sr-only" for="home-search-province">도 선택</label>
        <select id="home-search-province" v-model="filters.province" class="province-select" @change="changeProvince">
          <option v-for="province in PROVINCES" :key="province.value" :value="province.value">
            {{ province.label }}
          </option>
        </select>
        <label class="sr-only" for="home-search-region">시·군 선택</label>
        <select id="home-search-region" v-model="filters.region" class="region-select" :disabled="filters.province === 'all'">
          <option v-for="region in REGIONS_BY_PROVINCE[filters.province]" :key="region.value" :value="region.value">
            {{ region.label }}
          </option>
        </select>
        <button class="button button-dark search-submit" type="submit">검색</button>
        <RouterLink class="button button-primary board-link" to="/board">게시판</RouterLink>
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
    <section class="content-section">
      <div class="section-heading">
        <h2>카테고리 바로가기</h2>
      </div>
      <div class="category-grid">
        <article v-for="card in categoryCards" :key="card.name" class="category-card">
          <div class="image-placeholder">사진</div>
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
              <td>{{ post.title }}</td><td>{{ post.date }}</td><td>{{ post.views }}</td>
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
              <td>{{ post.title }}</td><td>{{ post.date }}</td><td>{{ post.views }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-search {
  display: grid;
  grid-template-columns: 8rem minmax(13rem, 1fr) 6.5rem 9.5rem auto auto;
  align-items: stretch;
  gap: 0.5rem;
  width: 100%;
}

.home-search select,
.home-search input,
.home-search .button {
  box-sizing: border-box;
  min-width: 0;
  height: 3rem;
}

.search-keyword-input {
  width: 100%;
}

.region-select {
  width: 100%;
  min-width: 9.5rem;
}

.search-submit,
.board-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-inline: 1rem;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .home-search {
    grid-template-columns: 8rem minmax(0, 1fr) 4.5rem 5rem;
    grid-template-areas:
      "type keyword search board"
      "province region region region";
  }

  .search-type-select { grid-area: type; }
  .search-keyword-input { grid-area: keyword; }
  .province-select { grid-area: province; }
  .region-select { grid-area: region; }
  .search-submit { grid-area: search; }
  .board-link { grid-area: board; }
}

@media (max-width: 640px) {
  .home-search {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas:
      "type province"
      "region region"
      "keyword keyword"
      "search board";
  }

  .region-select {
    min-width: 0;
  }
}
</style>
