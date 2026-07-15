const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || !API_BASE_URL

const mockAnswers = [
  { keywords: ['맛집', '음식'], answer: '광주송정역 인근의 송정떡갈비 골목과 동구 대인시장을 추천해요.' },
  { keywords: ['아이', '가족'], answer: '국립아시아문화전당 어린이문화원과 광주패밀리랜드를 추천해요.' },
  { keywords: ['축제', '주말'], answer: '충장축제와 광주김치축제를 확인해 보세요. 실제 일정은 API 연결 후 제공할 예정이에요.' },
  { keywords: ['문화', '전시'], answer: '국립아시아문화전당과 광주시립미술관이 대표적인 문화시설이에요.' },
]

export async function sendChatMessage(message, history = []) {
  if (!USE_MOCK) {
    // BACKEND 연결 지점: 세션 ID, 대화 이력 형식과 응답 필드를 챗봇 API 명세에 맞춰 수정합니다.
    const response = await fetch(`${API_BASE_URL}/chatbot/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    })
    if (!response.ok) throw new Error('챗봇 응답을 불러오지 못했습니다.')
    const payload = await response.json()
    return { message: payload.message ?? payload.answer ?? '' }
  }

  const matched = mockAnswers.find((item) => item.keywords.some((keyword) => message.includes(keyword)))
  await new Promise((resolve) => setTimeout(resolve, 350))
  return { message: matched?.answer ?? '현재는 목업 챗봇입니다. 맛집, 아이, 축제, 문화시설에 관해 질문해 보세요.' }
}
