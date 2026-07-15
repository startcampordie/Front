export const SEARCH_TYPES = [
  { value: 'all', label: '전체' },
  { value: 'attraction', label: '관광지' },
  { value: 'restaurant', label: '맛집' },
  { value: 'festival', label: '축제' },
  { value: 'post', label: '게시글' },
]

export const REGIONS = [
  { value: 'all', label: '광주 전체' },
  { value: 'dong-gu', label: '동구' },
  { value: 'seo-gu', label: '서구' },
  { value: 'nam-gu', label: '남구' },
  { value: 'buk-gu', label: '북구' },
  { value: 'gwangsan-gu', label: '광산구' },
]

export const POPULAR_KEYWORDS = ['관광지', '맛집', '축제', '게시글', '동네 문화 정보']

export const EMPTY_SEARCH_FILTERS = Object.freeze({
  type: 'all',
  keyword: '',
  region: 'all',
})
