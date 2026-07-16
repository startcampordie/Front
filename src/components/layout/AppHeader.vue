<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { SEARCH_TYPES } from '@/config/search'
import { toSearchRouteQuery } from '@/services/searchService'
import Logo from '@/assets/logo.png'

const route = useRoute()
const router = useRouter()
const isSearchOpen = ref(false)
const keyword = ref('')
const type = ref('all')
const searchInput = ref(null)

const navigation = [
  { label: '홈', to: '/' },
  { label: '게시판', to: '/board' },
  { label: '지역 정보', to: '/regions' },
]

function isActivePath(path) {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(`${path}/`)
}

async function toggleSearch() {
  isSearchOpen.value = !isSearchOpen.value
  if (isSearchOpen.value) {
    await nextTick()
    searchInput.value?.focus()
  }
}

function closeSearch() {
  isSearchOpen.value = false
}

async function submitSearch() {
  const trimmedKeyword = keyword.value.trim()
  if (!trimmedKeyword) {
    searchInput.value?.focus()
    return
  }

  await router.push({
    name: 'home',
    query: toSearchRouteQuery({ keyword: trimmedKeyword, type: type.value, region: 'all' }),
    hash: '#search',
  })
  closeSearch()
}

function handleEscape(event) {
  if (event.key === 'Escape' && isSearchOpen.value) closeSearch()
}

onMounted(() => window.addEventListener('keydown', handleEscape))
onBeforeUnmount(() => window.removeEventListener('keydown', handleEscape))
</script>

<template>
  <header class="site-header">
    <div class="header-bar container">
      <RouterLink class="brand" to="/" aria-label="호남두 홈">
        <img :src="Logo" alt="호남두" class="brand-logo" />
      </RouterLink>

      <nav class="main-nav" aria-label="주요 메뉴">
        <RouterLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          :class="{ active: isActivePath(item.to) }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <button
        class="search-toggle"
        type="button"
        :aria-expanded="isSearchOpen"
        aria-controls="global-search"
        :aria-label="isSearchOpen ? '검색창 닫기' : '검색창 열기'"
        @click="toggleSearch"
      >
        <span v-if="isSearchOpen" aria-hidden="true">×</span>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      </button>
    </div>

    <Transition name="search-panel">
      <form
        v-if="isSearchOpen"
        id="global-search"
        class="global-search"
        role="search"
        @submit.prevent="submitSearch"
      >
        <div class="container search-row">
          <label class="sr-only" for="global-search-type">검색 대상</label>
          <select id="global-search-type" v-model="type">
            <option v-for="option in SEARCH_TYPES" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>

          <label class="sr-only" for="global-search-keyword">검색어</label>
          <input
            id="global-search-keyword"
            ref="searchInput"
            v-model="keyword"
            type="search"
            placeholder="관광지, 맛집, 축제, 게시글을 검색해 보세요"
            autocomplete="off"
          />
          <button class="button button-primary" type="submit">검색</button>
        </div>
      </form>
    </Transition>
  </header>
</template>

<style scoped>
.brand {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
}

.brand-logo {
  display: block;
  width: clamp(7.5rem, 12vw, 10rem);
  height: 3rem;
  object-fit: contain;
  object-position: left center;
}

@media (max-width: 640px) {
  .brand-logo {
    width: 6.5rem;
    height: 2.5rem;
  }
}
</style>
