import places from '@/data/mock/places.json'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || !API_BASE_URL

const CATEGORY_LABELS = {
  ATTRACTION: '관광지',
  CULTURE: '문화시설',
  RESTAURANT: '음식점',
  FESTIVAL: '축제·행사',
}

function mapPlace(place) {
  return {
    id: place.id,
    category: place.category.toLowerCase(),
    categoryLabel: CATEGORY_LABELS[place.category] ?? place.category,
    name: place.title,
    address: place.address ?? '주소 정보 없음',
    imageUrl: place.image_url ?? '',
    tags: Array.isArray(place.tags) ? place.tags : [],
  }
}

export async function getPlaces({ category = 'all', tags = [], keyword = '', page = 1, pageSize = 6 } = {}) {
  if (!USE_MOCK) {
    const query = new URLSearchParams({ category, page, size: pageSize })
    if (keyword.trim()) query.set('keyword', keyword.trim())
    tags.forEach((tag) => query.append('tags', tag))
    const response = await fetch(`${API_BASE_URL}/contents?${query}`)
    if (!response.ok) throw new Error('지역 정보를 불러오지 못했습니다.')
    const payload = await response.json()
    return {
      items: payload.items.map(mapPlace),
      totalCount: payload.total_elements,
      totalPages: payload.total_pages,
      page: payload.page,
    }
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
