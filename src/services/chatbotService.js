const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const MOCK_STORAGE_KEY = 'localhub.chat.mockSessions'
const CHAT_INTENTS = new Set(['attraction', 'culture', 'restaurant', 'festival'])

const MOCK_RESULTS = {
  attraction: {
    total: 8,
    message: '아이와 함께 둘러보기 좋은 광주 관광지를 안내해 드릴게요.',
    references: [
      {
        type: 'regional_content',
        id: 101,
        title: '광주패밀리랜드',
        category: 'ATTRACTION',
        address: '광주광역시 북구 우치로 677',
        telephone: '062-607-8000',
        imageUrl: '',
        originalImageUrl: '',
        reason: '아이와 함께 체험하고 산책하기 좋은 관광지예요.',
      },
    ],
  },
  culture: {
    total: 5,
    message: '전시와 공연을 즐길 수 있는 광주 문화시설을 추천해 드릴게요.',
    references: [
      {
        type: 'regional_content',
        id: 201,
        title: '국립아시아문화전당',
        category: 'CULTURE',
        address: '광주광역시 동구 문화전당로 38',
        telephone: '1899-5566',
        imageUrl: '',
        originalImageUrl: '',
        reason: '다양한 전시와 공연, 어린이 프로그램을 한곳에서 즐길 수 있어요.',
      },
    ],
  },
  restaurant: {
    total: 23,
    message: '북구에서 조건에 맞는 음식점을 안내해 드릴게요.',
    references: [
      {
        type: 'regional_content',
        id: 301,
        title: '제일반점',
        category: 'RESTAURANT',
        address: '광주광역시 북구 서방로 24',
        telephone: '062-123-4567',
        imageUrl: '',
        originalImageUrl: '',
        reason: '북구 음식점을 찾는 조건과 일치합니다.',
      },
      {
        type: 'regional_content',
        id: 302,
        title: '광주송정 떡갈비 골목',
        category: 'RESTAURANT',
        address: '광주광역시 광산구 송정동 일대',
        telephone: '',
        imageUrl: '',
        originalImageUrl: '',
        reason: null,
      },
    ],
  },
  festival: {
    total: 4,
    message: '광주에서 즐길 수 있는 축제와 행사를 안내해 드릴게요.',
    references: [
      {
        type: 'regional_content',
        id: 401,
        title: '광주김치축제',
        category: 'FESTIVAL',
        address: '광주광역시 일대',
        telephone: '',
        imageUrl: '',
        originalImageUrl: '',
        reason: '광주의 음식 문화를 체험할 수 있는 대표 행사예요.',
      },
    ],
  },
}

let memoryMockSessions = {}

function createServiceError(message, status = 0, detail = null) {
  const error = new Error(message)
  error.status = status
  error.detail = detail
  return error
}

function detailMessage(detail) {
  if (typeof detail === 'string') return detail
  if (!Array.isArray(detail)) return ''

  return detail
    .map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item.msg === 'string') return item.msg
      return ''
    })
    .filter(Boolean)
    .join(' ')
}

function defaultErrorMessage(status) {
  if (status === 404) return '채팅 세션을 찾을 수 없습니다.'
  if (status === 410) return '만료된 채팅 세션입니다.'
  if (status === 422) return '입력 내용을 확인해 주세요.'
  return '일시적인 오류가 발생했어요.'
}

async function parseHttpError(response) {
  let payload = null
  try {
    payload = await response.json()
  } catch {
    // JSON 본문이 없는 오류도 상태 코드에 맞춰 처리합니다.
  }

  const detail = payload?.detail ?? null
  const message = detailMessage(detail) || defaultErrorMessage(response.status)
  return createServiceError(message, response.status, detail)
}

async function request(path, options = {}) {
  if (!API_BASE_URL) {
    throw createServiceError('API 주소가 설정되지 않았습니다.', 0, null)
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...options.headers,
      },
    })
  } catch (detail) {
    throw createServiceError('서버에 연결할 수 없습니다.', 0, detail)
  }

  if (!response.ok) throw await parseHttpError(response)

  try {
    return await response.json()
  } catch (detail) {
    throw createServiceError('서버 응답을 확인할 수 없습니다.', response.status, detail)
  }
}

function mapSession(payload) {
  return {
    sessionId: payload.session_id,
    createdAt: payload.created_at,
    expiresAt: payload.expires_at,
  }
}

function mapReference(item) {
  return {
    type: item.type,
    id: item.id,
    title: item.title,
    category: item.category,
    address: item.address,
    telephone: item.telephone,
    imageUrl: item.image_thumbnail_url || item.image_url || '',
    originalImageUrl: item.image_url || '',
    reason: item.reason,
  }
}

function mapChatResponse(payload) {
  return {
    sessionId: payload.session_id,
    intent: payload.intent,
    message: payload.answer,
    total: payload.total,
    createdAt: payload.created_at,
    references: Array.isArray(payload.references) ? payload.references.map(mapReference) : [],
  }
}

function mapHistory(payload) {
  return {
    sessionId: payload.session_id,
    messages: Array.isArray(payload.messages)
      ? payload.messages.map((item) => ({
          id: item.id,
          role: item.role,
          content: item.content,
          intent: item.intent,
          createdAt: item.created_at,
        }))
      : [],
  }
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function readMockSessions() {
  if (typeof localStorage === 'undefined') return memoryMockSessions

  try {
    const stored = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) ?? '{}')
    memoryMockSessions = stored && typeof stored === 'object' ? stored : {}
  } catch {
    memoryMockSessions = {}
  }
  return memoryMockSessions
}

function writeMockSessions(sessions) {
  memoryMockSessions = sessions
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(sessions))
}

function getMockSession(sessionId) {
  const session = readMockSessions()[sessionId]
  if (!session)
    throw createServiceError('채팅 세션을 찾을 수 없습니다.', 404, '채팅 세션을 찾을 수 없습니다.')
  return session
}

function validateMockMessage({ intent, message }) {
  if (!CHAT_INTENTS.has(intent)) {
    const detail = [{ msg: '허용하지 않는 검색 유형입니다.' }]
    throw createServiceError(detailMessage(detail), 422, detail)
  }

  const length = message.trim().length
  if (length < 2 || length > 100) {
    const detail = [{ msg: '메시지는 2자 이상 100자 이하로 입력해 주세요.' }]
    throw createServiceError(detailMessage(detail), 422, detail)
  }
}

async function createMockSession() {
  await new Promise((resolve) => setTimeout(resolve, 250))
  const sessionId = createId()
  const createdAt = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const sessions = readMockSessions()
  sessions[sessionId] = { sessionId, createdAt, expiresAt, messages: [] }
  writeMockSessions(sessions)
  return { sessionId, createdAt, expiresAt }
}

async function getMockHistory(sessionId) {
  await new Promise((resolve) => setTimeout(resolve, 180))
  const session = getMockSession(sessionId)
  return { sessionId, messages: [...session.messages] }
}

async function sendMockMessage({ sessionId, intent, message }) {
  validateMockMessage({ intent, message })
  const session = getMockSession(sessionId)
  await new Promise((resolve) => setTimeout(resolve, 650))

  const createdAt = new Date().toISOString()
  const empty = /없는|존재하지|결과 없음/.test(message)
  const result = empty
    ? { total: 0, message: '조건에 맞는 지역 정보를 찾지 못했어요.', references: [] }
    : MOCK_RESULTS[intent]

  session.messages.push(
    { id: createId(), role: 'user', content: message, intent, createdAt },
    {
      id: createId(),
      role: 'assistant',
      content: result.message,
      intent,
      createdAt,
    },
  )
  session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  writeMockSessions(memoryMockSessions)

  return {
    sessionId,
    intent,
    message: result.message,
    total: result.total,
    createdAt,
    references: result.references.map((item) => ({ ...item })),
  }
}

export async function createChatSession() {
  if (USE_MOCK) return createMockSession()
  const payload = await request('/chat/sessions', { method: 'POST' })
  return mapSession(payload)
}

export async function getChatHistory(sessionId) {
  if (USE_MOCK) return getMockHistory(sessionId)
  const payload = await request(`/chat/sessions/${encodeURIComponent(sessionId)}/messages`)
  return mapHistory(payload)
}

export async function sendChatMessage({ sessionId, intent, message }) {
  if (USE_MOCK) return sendMockMessage({ sessionId, intent, message })
  const payload = await request('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      intent,
      message,
    }),
  })
  return mapChatResponse(payload)
}
