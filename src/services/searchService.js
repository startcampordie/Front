import { getPosts } from '@/services/boardService'
import { getPlaces } from '@/services/placeService'
import { DISTRICTS_BY_PROVINCE } from '@/config/search'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || !API_BASE_URL

const PROVINCE_LABELS = {
  jeonbuk: '전북특별자치도',
  jeonnam: '전라남도',
}

const DISTRICT_LABELS = Object.fromEntries(
  Object.values(DISTRICTS_BY_PROVINCE)
    .flat()
    .map((district) => [district.value, district.label]),
)

function toQueryString(filters) {
  const params = new URLSearchParams()
  if (filters.keyword?.trim()) params.set('keyword', filters.keyword.trim())
  if (filters.type && filters.type !== 'all') params.set('search_type', filters.type.toUpperCase())
  if (PROVINCE_LABELS[filters.province]) params.set('province', PROVINCE_LABELS[filters.province])
  if (DISTRICT_LABELS[filters.district]) params.set('district', DISTRICT_LABELS[filters.district])
  return params.toString()
}

function placeMatchesRegion(place, filters) {
  const address = place.address ?? ''
  const selectedProvince = filters.province ?? 'all'
  const selectedDistrict = filters.district ?? 'all'
  const placeProvince = place.province
    ?? (/전북|전라북도/.test(address) ? 'jeonbuk' : /전남|전라남도/.test(address) ? 'jeonnam' : '')

  if (selectedProvince !== 'all' && placeProvince !== selectedProvince) return false
  if (selectedDistrict !== 'all') {
    const districtLabel = DISTRICT_LABELS[selectedDistrict]
    return place.district === selectedDistrict || Boolean(districtLabel && address.includes(districtLabel))
  }
  return true
}

const CATEGORY_LABELS = {
  ATTRACTION: '관광지',
  CULTURE: '문화시설',
  RESTAURANT: '음식점',
  FESTIVAL: '축제·행사',
}

function mapContent(item) {
  return {
    id: `place-${item.id}`,
    resultType: 'place',
    typeLabel: CATEGORY_LABELS[item.category] ?? item.category,
    title: item.title,
    description: item.address ?? '주소 정보 없음',
    route: {
      name: 'regions',
      query: { category: item.category.toLowerCase(), keyword: item.title },
    },
  }
}

function mapPost(item) {
  return {
    id: `post-${item.id}`,
    resultType: 'post',
    typeLabel: '게시글',
    title: item.title,
    description: item.content_preview,
    route: { name: 'board-detail', params: { id: item.id } },
  }
}

export async function searchAll(filters, { signal } = {}) {
  if (USE_MOCK) {
    const placeCategory = ['attraction', 'restaurant', 'festival'].includes(filters.type) ? filters.type : 'all'
    const includePlaces = filters.type !== 'post'
    const includePosts = ['all', 'post'].includes(filters.type)
    const [placeResult, postResult] = await Promise.all([
      includePlaces ? getPlaces({ category: placeCategory, keyword: filters.keyword, pageSize: 100 }) : { items: [] },
      includePosts ? getPosts({ keyword: filters.keyword, pageSize: 100 }) : { items: [] },
    ])

    const placeItems = placeResult.items
      .filter((place) => placeMatchesRegion(place, filters))
      .map((place) => ({ id: `place-${place.id}`, resultType: 'place', typeLabel: place.categoryLabel, title: place.name, description: place.address, route: { name: 'regions', query: { category: place.category, keyword: place.name } } }))
    const postItems = postResult.items.map((post) => ({ id: `post-${post.id}`, resultType: 'post', typeLabel: '게시글', title: post.title, description: post.content, route: { name: 'board-detail', params: { id: post.id } } }))
    const items = [...placeItems, ...postItems]
    return { items, totalCount: items.length, source: 'mock' }
  }

  const response = await fetch(`${API_BASE_URL}/search?${toQueryString(filters)}`, { method: 'GET', headers: { Accept: 'application/json' }, signal })
  if (!response.ok) throw new Error(`검색 요청에 실패했습니다. (${response.status})`)
  const payload = await response.json()

  const contents = [
    ...(payload.attractions ?? []),
    ...(payload.cultures ?? []),
    ...(payload.restaurants ?? []),
    ...(payload.festivals ?? []),
  ].map(mapContent)
  const posts = (payload.posts ?? []).map(mapPost)
  return { items: [...contents, ...posts], totalCount: payload.total_count ?? 0, source: 'api' }
}

export function toSearchRouteQuery(filters) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value && value !== 'all'))
}
