const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const CATEGORY_LABELS = {
  ATTRACTION: '관광지',
  CULTURE: '문화시설',
  RESTAURANT: '음식점',
  FESTIVAL: '축제·행사',
}

function mapPost(post) {
  return {
    id: post.id,
    title: post.title,
    date: post.created_at,
    views: post.view_count,
  }
}

export async function getHome() {
  if (!API_BASE_URL) throw new Error('API 주소가 설정되지 않았습니다.')
  const response = await fetch(`${API_BASE_URL}/home`, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error('홈 정보를 불러오지 못했습니다.')
  const payload = await response.json()
  return {
    categoryCards: payload.random_contents.map((item) => ({
      id: item.id,
      category: CATEGORY_LABELS[item.category] ?? item.category,
      name: item.title,
      address: item.address ?? '주소 정보 없음',
      imageUrl: item.image_url ?? '',
      type: item.category.toLowerCase(),
    })),
    recentPosts: payload.recent_posts.map(mapPost),
    popularPosts: payload.popular_posts.map(mapPost),
  }
}
