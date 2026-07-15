import places from '@/data/mock/places.json'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || !API_BASE_URL

export async function getPlaces({ category = 'all', tags = [], keyword = '', page = 1, pageSize = 6 } = {}) {
  if (!USE_MOCK) {
    // BACKEND 연결 지점: 배열 태그 직렬화 방식(tags=사진,자연 또는 tags=사진&tags=자연)을 API 명세에 맞춥니다.
    const query = new URLSearchParams({ category, keyword, page, size: pageSize })
    tags.forEach((tag) => query.append('tags', tag))
    const response = await fetch(`${API_BASE_URL}/places?${query}`)
    if (!response.ok) throw new Error('지역 정보를 불러오지 못했습니다.')
    return response.json()
  }

  let filtered = places.filter((place) => {
    const categoryMatches = category === 'all' || place.category === category
    const keywordMatches = !keyword.trim() || `${place.name} ${place.address}`.toLowerCase().includes(keyword.trim().toLowerCase())
    const tagMatches = tags.length === 0 || tags.every((tag) => place.tags.includes(tag))
    return categoryMatches && keywordMatches && tagMatches
  })

  const totalCount = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(Math.max(Number(page), 1), totalPages)
  const start = (safePage - 1) * pageSize
  filtered = filtered.slice(start, start + pageSize)

  return Promise.resolve({ items: filtered, totalCount, totalPages, page: safePage })
}
