import { getPosts } from '@/services/boardService'
import { getPlaces } from '@/services/placeService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || !API_BASE_URL

function toQueryString(filters) {
  const params = new URLSearchParams()
  if (filters.keyword?.trim()) params.set('keyword', filters.keyword.trim())
  if (filters.type && filters.type !== 'all') params.set('type', filters.type)
  if (filters.region && filters.region !== 'all') params.set('region', filters.region)
  return params.toString()
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
      .filter((place) => filters.region === 'all' || place.district === filters.region)
      .map((place) => ({ id: `place-${place.id}`, resultType: 'place', typeLabel: place.categoryLabel, title: place.name, description: place.address, route: { name: 'regions', query: { category: place.category, keyword: place.name } } }))
    const postItems = postResult.items.map((post) => ({ id: `post-${post.id}`, resultType: 'post', typeLabel: '게시글', title: post.title, description: post.content, route: { name: 'board-detail', params: { id: post.id } } }))
    const items = [...placeItems, ...postItems]
    return { items, totalCount: items.length, source: 'mock' }
  }

  // BACKEND 연결 지점: 통합 검색 API 경로와 type/region 코드값을 API 명세에 맞춰 수정합니다.
  const response = await fetch(`${API_BASE_URL}/search?${toQueryString(filters)}`, { method: 'GET', headers: { Accept: 'application/json' }, signal })
  if (!response.ok) throw new Error(`검색 요청에 실패했습니다. (${response.status})`)
  const payload = await response.json()

  // BACKEND 연결 지점: 서버 응답을 화면 공통 모델(id, typeLabel, title, description, route)로 변환합니다.
  return { items: payload.items ?? payload.results ?? [], totalCount: payload.totalCount ?? payload.total ?? 0, source: 'api' }
}

export function toSearchRouteQuery(filters) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value && value !== 'all'))
}
