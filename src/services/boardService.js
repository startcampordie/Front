import initialPosts from '@/data/mock/posts.json'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || !API_BASE_URL
const STORAGE_KEY = 'localhub.mock.posts'

const wait = (milliseconds = 120) => new Promise((resolve) => setTimeout(resolve, milliseconds))

function readMockPosts() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) return JSON.parse(stored)

  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialPosts))
  return structuredClone(initialPosts)
}

function writeMockPosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
}

// 목업 JSON에는 기능 시연을 위해 비밀번호가 평문으로 들어 있습니다.
// BACKEND 연결 지점: 실제 서버는 비밀번호를 해시로 저장하고 응답에 password를 절대 포함하면 안 됩니다.
function toPublicPost({ password: _password, ...post }) {
  return post
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...options.headers },
    ...options,
  })

  if (!response.ok) {
    const error = new Error('게시판 요청을 처리하지 못했습니다.')
    error.status = response.status
    throw error
  }

  return response.status === 204 ? null : response.json()
}

export async function getPosts({ keyword = '', searchType = 'title-content', sort = 'latest', page = 1, pageSize = 10 } = {}) {
  if (!USE_MOCK) {
    // BACKEND 연결 지점: API 명세의 검색/정렬/페이징 파라미터 이름이 다르면 이 부분만 변경합니다.
    const query = new URLSearchParams({ keyword, searchType, sort, page, size: pageSize })
    return apiRequest(`/posts?${query}`)
  }

  await wait()
  const normalizedKeyword = keyword.trim().toLowerCase()
  let posts = readMockPosts().filter((post) => {
    if (!normalizedKeyword) return true
    const titleMatches = post.title.toLowerCase().includes(normalizedKeyword)
    const contentMatches = post.content.toLowerCase().includes(normalizedKeyword)
    if (searchType === 'title') return titleMatches
    if (searchType === 'content') return contentMatches
    return titleMatches || contentMatches
  })

  posts.sort((a, b) => (sort === 'views' ? b.views - a.views : b.id - a.id))
  const totalCount = posts.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(Math.max(Number(page), 1), totalPages)
  const start = (safePage - 1) * pageSize

  return {
    items: posts.slice(start, start + pageSize).map(toPublicPost),
    totalCount,
    totalPages,
    page: safePage,
  }
}

export async function getPost(id, { increaseView = true } = {}) {
  if (!USE_MOCK) {
    // BACKEND 연결 지점: 조회수 증가는 서버에서 원자적으로 처리해야 합니다.
    return apiRequest(`/posts/${id}${increaseView ? '?increaseView=true' : ''}`)
  }

  await wait()
  const posts = readMockPosts()
  const post = posts.find((item) => item.id === Number(id))
  if (!post) throw Object.assign(new Error('게시글을 찾을 수 없습니다.'), { status: 404 })
  if (increaseView) {
    post.views += 1
    writeMockPosts(posts)
  }
  return toPublicPost(post)
}

export async function createPost(input) {
  if (!USE_MOCK) {
    // BACKEND 연결 지점: 작성자 정책과 비밀번호 전달 형식은 API 명세에 맞춰 변경합니다.
    return apiRequest('/posts', { method: 'POST', body: JSON.stringify(input) })
  }

  await wait()
  const posts = readMockPosts()
  const newPost = {
    id: Math.max(0, ...posts.map((post) => post.id)) + 1,
    title: input.title.trim(),
    content: input.content.trim(),
    author: '익명',
    password: input.password,
    createdAt: new Date().toISOString().slice(0, 10),
    views: 0,
  }
  posts.unshift(newPost)
  writeMockPosts(posts)
  return toPublicPost(newPost)
}

export async function verifyPostPassword(id, password) {
  if (!USE_MOCK) {
    // BACKEND 연결 지점: 서버가 일회용 수정 토큰을 준다면 반환값을 { verified, token } 형태로 바꿉니다.
    return apiRequest(`/posts/${id}/verify-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    })
  }

  await wait()
  const post = readMockPosts().find((item) => item.id === Number(id))
  return { verified: Boolean(post && post.password === password) }
}

export async function updatePost(id, input) {
  if (!USE_MOCK) {
    // BACKEND 연결 지점: 인증 토큰 방식이면 password 대신 Authorization 헤더를 사용합니다.
    return apiRequest(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(input) })
  }

  const verification = await verifyPostPassword(id, input.password)
  if (!verification.verified) throw Object.assign(new Error('비밀번호가 일치하지 않습니다.'), { status: 403 })
  const posts = readMockPosts()
  const index = posts.findIndex((post) => post.id === Number(id))
  posts[index] = { ...posts[index], title: input.title.trim(), content: input.content.trim() }
  writeMockPosts(posts)
  return toPublicPost(posts[index])
}

export async function deletePost(id, password) {
  if (!USE_MOCK) {
    // BACKEND 연결 지점: DELETE 요청 body 허용 여부에 따라 헤더 또는 별도 검증 토큰으로 변경합니다.
    return apiRequest(`/posts/${id}`, { method: 'DELETE', body: JSON.stringify({ password }) })
  }

  const verification = await verifyPostPassword(id, password)
  if (!verification.verified) throw Object.assign(new Error('비밀번호가 일치하지 않습니다.'), { status: 403 })
  writeMockPosts(readMockPosts().filter((post) => post.id !== Number(id)))
}
