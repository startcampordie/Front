export const SEARCH_TYPES = [
  { value: 'all', label: '전체' },
  { value: 'attraction', label: '관광지' },
  { value: 'culture', label: '문화시설' },
  { value: 'restaurant', label: '맛집' },
  { value: 'festival', label: '축제' },
  { value: 'post', label: '게시글' },
]

export const PROVINCES = [
  { value: 'all', label: '전체' },
  { value: 'jeonbuk', label: '전북' },
  { value: 'jeonnam', label: '전남' },
]

export const DISTRICTS_BY_PROVINCE = Object.freeze({
  jeonbuk: [
    { value: 'jb-jeonju', label: '전주시' },
    { value: 'jb-gunsan', label: '군산시' },
    { value: 'jb-iksan', label: '익산시' },
    { value: 'jb-jeongeup', label: '정읍시' },
    { value: 'jb-namwon', label: '남원시' },
    { value: 'jb-gimje', label: '김제시' },
    { value: 'jb-wanju', label: '완주군' },
    { value: 'jb-jinan', label: '진안군' },
    { value: 'jb-muju', label: '무주군' },
    { value: 'jb-jangsu', label: '장수군' },
    { value: 'jb-imsil', label: '임실군' },
    { value: 'jb-sunchang', label: '순창군' },
    { value: 'jb-gochang', label: '고창군' },
    { value: 'jb-buan', label: '부안군' },
  ],
  jeonnam: [
    { value: 'jn-mokpo', label: '목포시' },
    { value: 'jn-yeosu', label: '여수시' },
    { value: 'jn-suncheon', label: '순천시' },
    { value: 'jn-naju', label: '나주시' },
    { value: 'jn-gwangyang', label: '광양시' },
    { value: 'jn-damyang', label: '담양군' },
    { value: 'jn-gokseong', label: '곡성군' },
    { value: 'jn-gurye', label: '구례군' },
    { value: 'jn-goheung', label: '고흥군' },
    { value: 'jn-boseong', label: '보성군' },
    { value: 'jn-hwasun', label: '화순군' },
    { value: 'jn-jangheung', label: '장흥군' },
    { value: 'jn-gangjin', label: '강진군' },
    { value: 'jn-haenam', label: '해남군' },
    { value: 'jn-yeongam', label: '영암군' },
    { value: 'jn-muan', label: '무안군' },
    { value: 'jn-hampyeong', label: '함평군' },
    { value: 'jn-yeonggwang', label: '영광군' },
    { value: 'jn-jangseong', label: '장성군' },
    { value: 'jn-wando', label: '완도군' },
    { value: 'jn-jindo', label: '진도군' },
    { value: 'jn-sinan', label: '신안군' },
  ],
})

export function getDistrictOptions(province = 'all') {
  const allOption = { value: 'all', label: '시·군 전체' }
  if (province !== 'all') return [allOption, ...(DISTRICTS_BY_PROVINCE[province] ?? [])]

  return [
    allOption,
    ...DISTRICTS_BY_PROVINCE.jeonbuk.map((district) => ({
      ...district,
      label: `전북 · ${district.label}`,
    })),
    ...DISTRICTS_BY_PROVINCE.jeonnam.map((district) => ({
      ...district,
      label: `전남 · ${district.label}`,
    })),
  ]
}

export const POPULAR_KEYWORDS = ['무등산', '맛집', '축제', '온천', '카페']

export const EMPTY_SEARCH_FILTERS = Object.freeze({
  type: 'all',
  keyword: '',
  province: 'all',
  district: 'all',
})
