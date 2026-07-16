<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppModal from '@/components/common/AppModal.vue'
import ChatMessageBubble from './ChatMessageBubble.vue'
import ChatTypeSelector from './ChatTypeSelector.vue'
import { createChatSession, getChatHistory, sendChatMessage } from '@/services/chatbotService'

const CHAT_SESSION_STORAGE_KEY = 'localhub.chat.sessionId'
const VALID_INTENTS = new Set(['attraction', 'culture', 'restaurant', 'festival'])
const INTENT_LABELS = {
  attraction: '관광지',
  culture: '문화시설',
  restaurant: '음식점',
  festival: '축제·행사',
}
const QUICK_QUESTIONS = [
  { label: '북구 맛집 알려줘', message: '북구 맛집 알려줘', intent: 'restaurant' },
  { label: '광주 축제 추천해줘', message: '광주 축제 추천해줘', intent: 'festival' },
  { label: '아이와 갈 관광지 알려줘', message: '아이와 갈 관광지 알려줘', intent: 'attraction' },
  { label: '광주 문화시설 추천해줘', message: '광주 문화시설 추천해줘', intent: 'culture' },
]

const router = useRouter()
const isOpen = ref(false)
const sending = ref(false)
const isHistoryLoading = ref(false)
const messages = ref([])
const sessionId = ref('')
const sessionState = ref('active')
const selectedIntent = ref('')
const inputValue = ref('')
const intentError = ref('')
const messageError = ref('')
const systemNotice = ref(null)
const unread = ref(false)
const lastRequestFailed = ref(false)
const showNewMessageButton = ref(false)
const showNewConversationModal = ref(false)
const creatingConversation = ref(false)
const modalError = ref('')

const toggleElement = ref(null)
const windowElement = ref(null)
const messagesElement = ref(null)
const inputElement = ref(null)

const selectedIntentLabel = computed(() => INTENT_LABELS[selectedIntent.value] ?? '')
const characterCount = computed(() => inputValue.value.length)
const sessionBlocked = computed(
  () => sessionState.value === 'not-found' || sessionState.value === 'expired',
)
const controlsDisabled = computed(
  () =>
    sending.value || isHistoryLoading.value || creatingConversation.value || sessionBlocked.value,
)
const newConversationDisabled = computed(
  () => sending.value || isHistoryLoading.value || creatingConversation.value,
)
const floatingState = computed(() => {
  if (sending.value || isHistoryLoading.value) return 'loading'
  if (lastRequestFailed.value) return 'error'
  if (unread.value) return 'unread'
  return 'default'
})
const floatingLabel = computed(() => {
  if (sending.value) return '호남두 챗봇, 답변 생성 중'
  if (isHistoryLoading.value) return '호남두 챗봇, 이전 대화 불러오는 중'
  if (floatingState.value === 'error') return '호남두 챗봇 열기, 오류 확인 필요'
  if (floatingState.value === 'unread') return '호남두 챗봇 열기, 새 답변 1개'
  return '호남두 챗봇 열기'
})

let mobileMediaQuery = null
let previousBodyOverflow = ''
let bodyScrollLocked = false

function createMessageId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function saveSessionId(value) {
  sessionId.value = value
  try {
    if (value) localStorage.setItem(CHAT_SESSION_STORAGE_KEY, value)
    else localStorage.removeItem(CHAT_SESSION_STORAGE_KEY)
  } catch {
    // 저장소를 사용할 수 없어도 현재 탭의 대화는 계속 사용할 수 있습니다.
  }
}

function readSessionId() {
  try {
    return localStorage.getItem(CHAT_SESSION_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function syncBodyScrollLock() {
  const shouldLock = isOpen.value && mobileMediaQuery?.matches
  if (shouldLock && !bodyScrollLocked) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    bodyScrollLocked = true
  } else if (!shouldLock && bodyScrollLocked) {
    document.body.style.overflow = previousBodyOverflow
    bodyScrollLocked = false
  }
}

function mapHistoryMessage(item) {
  return {
    id: `history-${item.id}`,
    role: item.role,
    content: item.content,
    intent: VALID_INTENTS.has(item.intent) ? item.intent : '',
    createdAt: item.createdAt,
    status: 'success',
    references: [],
  }
}

async function restoreHistory(storedSessionId) {
  isHistoryLoading.value = true
  try {
    const history = await getChatHistory(storedSessionId)
    saveSessionId(history.sessionId || storedSessionId)
    messages.value = history.messages
      .filter((item) => item.role === 'user' || item.role === 'assistant')
      .map(mapHistoryMessage)
      .sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt))

    const lastIntent = [...messages.value]
      .reverse()
      .find((item) => VALID_INTENTS.has(item.intent))?.intent
    if (lastIntent) selectedIntent.value = lastIntent
  } catch (error) {
    if (error?.status === 404) sessionState.value = 'not-found'
    else if (error?.status === 410) sessionState.value = 'expired'
    else {
      systemNotice.value = {
        title: '이전 대화를 불러오지 못했어요',
        message: '연결 상태를 확인해 주세요. 새 질문은 그대로 보낼 수 있어요.',
      }
    }
  } finally {
    isHistoryLoading.value = false
  }
}

function validateInput() {
  const trimmed = inputValue.value.trim()
  intentError.value = selectedIntent.value ? '' : '검색 유형을 선택해 주세요.'

  if (inputValue.value.length > 100 || trimmed.length > 100) {
    messageError.value = '100자 이하로 입력해 주세요.'
  } else if (trimmed.length < 2) {
    messageError.value = '2자 이상 입력해 주세요.'
  } else {
    messageError.value = ''
  }

  return !intentError.value && !messageError.value ? trimmed : ''
}

function getDisplayError(error) {
  if (error?.status === 422) {
    return {
      title: '입력 내용을 확인해 주세요',
      message: error.message || '입력 내용을 확인해 주세요.',
    }
  }
  return {
    title: '일시적인 오류가 발생했어요',
    message: '연결 상태를 확인하고 잠시 후 다시 시도해 주세요.',
  }
}

function updateSessionStateFromError(error) {
  if (error?.status === 404) sessionState.value = 'not-found'
  if (error?.status === 410) sessionState.value = 'expired'
}

async function ensureSession() {
  if (sessionId.value) return sessionId.value
  const session = await createChatSession()
  saveSessionId(session.sessionId)
  sessionState.value = 'active'
  return session.sessionId
}

function isNearBottom() {
  const element = messagesElement.value
  if (!element) return true
  return element.scrollHeight - element.scrollTop - element.clientHeight < 96
}

async function scrollToBottom(behavior = 'smooth') {
  await nextTick()
  const element = messagesElement.value
  if (!element) return
  element.scrollTo({ top: element.scrollHeight, behavior })
  showNewMessageButton.value = false
}

function handleMessagesScroll() {
  showNewMessageButton.value = !isNearBottom()
}

async function sendMessage({ content, intent, existingMessage = null }) {
  if (sending.value || isHistoryLoading.value || sessionBlocked.value) return
  sending.value = true
  systemNotice.value = null
  lastRequestFailed.value = false

  let userMessage = existingMessage
  try {
    const activeSessionId = await ensureSession()

    if (userMessage) {
      userMessage.status = 'sending'
      userMessage.errorTitle = ''
      userMessage.errorMessage = ''
    } else {
      userMessage = {
        id: createMessageId(),
        role: 'user',
        content,
        intent,
        createdAt: new Date().toISOString(),
        status: 'sending',
        references: [],
      }
      messages.value.push(userMessage)
      inputValue.value = ''
    }

    await scrollToBottom('smooth')
    const response = await sendChatMessage({ sessionId: activeSessionId, intent, message: content })
    if (response.sessionId && response.sessionId !== sessionId.value)
      saveSessionId(response.sessionId)

    userMessage.status = 'success'
    const shouldAutoScroll = isNearBottom()
    messages.value.push({
      id: createMessageId(),
      role: 'assistant',
      content: response.message,
      intent: response.intent,
      createdAt: response.createdAt,
      status: 'success',
      total: response.total,
      isEmpty: response.total === 0 || response.references.length === 0,
      references: response.references,
    })
    unread.value = !isOpen.value
    lastRequestFailed.value = false

    if (shouldAutoScroll) await scrollToBottom('smooth')
    else showNewMessageButton.value = true
  } catch (error) {
    updateSessionStateFromError(error)
    lastRequestFailed.value = true
    const displayError = getDisplayError(error)

    if (userMessage) {
      userMessage.status = 'error'
      userMessage.errorTitle = displayError.title
      userMessage.errorMessage = displayError.message
    } else {
      systemNotice.value = {
        ...displayError,
        retry: true,
      }
    }
  } finally {
    sending.value = false
    await nextTick()
    resizeTextarea()
  }
}

async function submit() {
  if (sending.value || isHistoryLoading.value || sessionBlocked.value) return
  const trimmed = validateInput()
  if (!trimmed) return
  await sendMessage({ content: trimmed, intent: selectedIntent.value })
}

function retryMessage(message) {
  if (sending.value || sessionBlocked.value) return
  sendMessage({ content: message.content, intent: message.intent, existingMessage: message })
}

function chooseQuickQuestion(question) {
  if (sending.value) return
  selectedIntent.value = question.intent
  inputValue.value = question.message
  intentError.value = ''
  messageError.value = ''
  nextTick(() => {
    resizeTextarea()
    inputElement.value?.focus()
  })
}

function handleIntentChange(value) {
  selectedIntent.value = value
  intentError.value = ''
}

function handleInputKeydown(event) {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return
  event.preventDefault()
  submit()
}

function resizeTextarea() {
  const element = inputElement.value
  if (!element) return
  element.style.height = 'auto'
  element.style.height = `${Math.min(element.scrollHeight, 96)}px`
}

function focusInput() {
  inputElement.value?.focus()
}

async function openChatbot() {
  isOpen.value = true
  unread.value = false
  await nextTick()
  windowElement.value?.focus()
  if (messages.value.length) scrollToBottom('auto')
}

async function closeChatbot() {
  isOpen.value = false
  await nextTick()
  toggleElement.value?.focus()
}

function openNewConversation() {
  if (sending.value || isHistoryLoading.value || creatingConversation.value) return
  modalError.value = ''
  showNewConversationModal.value = true
}

function closeNewConversationModal() {
  if (!creatingConversation.value) showNewConversationModal.value = false
}

async function confirmNewConversation() {
  if (creatingConversation.value) return
  creatingConversation.value = true
  modalError.value = ''
  try {
    const session = await createChatSession()
    saveSessionId(session.sessionId)
    messages.value = []
    selectedIntent.value = ''
    inputValue.value = ''
    intentError.value = ''
    messageError.value = ''
    systemNotice.value = null
    sessionState.value = 'active'
    unread.value = false
    lastRequestFailed.value = false
    showNewConversationModal.value = false
    await nextTick()
    inputElement.value?.focus()
  } catch {
    modalError.value = '새 대화를 만들지 못했어요. 잠시 후 다시 시도해 주세요.'
  } finally {
    creatingConversation.value = false
  }
}

function openReference(reference) {
  const query = { keyword: reference.title }
  if (typeof reference.category === 'string') query.category = reference.category.toLowerCase()
  router.push({
    name: 'regions',
    query,
  })
}

watch(isOpen, syncBodyScrollLock)
watch(inputValue, () => {
  if (inputValue.value.length > 100 || inputValue.value.trim().length > 100) {
    messageError.value = '100자 이하로 입력해 주세요.'
  } else if (
    messageError.value === '100자 이하로 입력해 주세요.' ||
    inputValue.value.trim().length >= 2
  ) {
    messageError.value = ''
  }
  nextTick(resizeTextarea)
})

onMounted(() => {
  mobileMediaQuery = window.matchMedia('(max-width: 640px)')
  mobileMediaQuery.addEventListener('change', syncBodyScrollLock)
  const storedSessionId = readSessionId()
  if (storedSessionId) {
    sessionId.value = storedSessionId
    restoreHistory(storedSessionId)
  }
})

onUnmounted(() => {
  mobileMediaQuery?.removeEventListener('change', syncBodyScrollLock)
  if (bodyScrollLocked) {
    document.body.style.overflow = previousBodyOverflow
    bodyScrollLocked = false
  }
})
</script>

<template>
  <aside class="chatbot" aria-label="호남두 챗봇">
    <section
      v-if="isOpen"
      ref="windowElement"
      class="chatbot-window"
      aria-label="호남두 챗봇 대화창"
      tabindex="-1"
    >
      <header class="chatbot-header">
        <div class="chatbot-heading">
          <span class="chatbot-status-dot" aria-hidden="true"></span>
          <div>
            <strong>호남두 챗봇</strong>
            <span>지역 정보 안내</span>
          </div>
        </div>
        <div class="chatbot-header-actions">
          <button
            type="button"
            class="chatbot-new-button"
            aria-label="새 대화 시작"
            :disabled="newConversationDisabled"
            @click="openNewConversation"
          >
            <span aria-hidden="true">＋</span> 새 대화
          </button>
          <button
            type="button"
            class="chatbot-collapse-button"
            aria-label="챗봇 접기"
            @click="closeChatbot"
          >
            <span class="chatbot-desktop-collapse" aria-hidden="true">—</span>
            <span class="chatbot-mobile-collapse" aria-hidden="true">‹</span>
          </button>
        </div>
      </header>

      <div class="chatbot-content">
        <div
          ref="messagesElement"
          class="chatbot-messages"
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
          @scroll="handleMessagesScroll"
        >
          <div v-if="!messages.length && !isHistoryLoading" class="chatbot-welcome">
            <h2>안녕하세요! 무엇을 도와드릴까요?</h2>
            <p>먼저 검색 유형을 하나 선택해 주세요.</p>
          </div>

          <div v-if="isHistoryLoading" class="chatbot-history-loading" role="status">
            <span class="chatbot-loading-dots" aria-hidden="true"><i></i><i></i><i></i></span>
            <span>이전 대화를 불러오고 있어요.</span>
          </div>

          <ChatTypeSelector
            :model-value="selectedIntent"
            :disabled="controlsDisabled"
            :error="intentError"
            @update:model-value="handleIntentChange"
          />

          <div class="chatbot-selection" :class="{ empty: !selectedIntent }" aria-live="polite">
            <strong>
              {{ selectedIntent ? `선택됨 · ${selectedIntentLabel}` : '선택된 검색 유형이 없어요' }}
            </strong>
            <span>질문 전·후 변경 가능</span>
          </div>

          <section
            v-if="!messages.length"
            class="chatbot-quick-section"
            aria-labelledby="quick-title"
          >
            <div class="chatbot-quick-heading">
              <strong id="quick-title">빠른 질문</strong>
              <span>누르면 입력창에 채워져요.</span>
            </div>
            <button
              v-for="question in QUICK_QUESTIONS"
              :key="question.message"
              type="button"
              class="chatbot-quick-question"
              :disabled="sending"
              @click="chooseQuickQuestion(question)"
            >
              <span>{{ question.label }}</span>
              <span aria-hidden="true">›</span>
            </button>
          </section>

          <div v-if="sessionState === 'not-found'" class="chatbot-session-state" role="alert">
            <strong>대화 세션을 찾을 수 없어요</strong>
            <p>기존 메시지는 유지됩니다. 새 대화를 시작해 주세요.</p>
            <button type="button" class="chatbot-inline-button" @click="openNewConversation">
              새 대화 시작
            </button>
          </div>

          <div v-else-if="sessionState === 'expired'" class="chatbot-session-state" role="alert">
            <strong>대화 세션이 만료됐어요</strong>
            <p>기존 메시지는 유지됩니다. 새 대화를 시작해 주세요.</p>
            <button type="button" class="chatbot-inline-button" @click="openNewConversation">
              새 대화 시작
            </button>
          </div>

          <div v-if="systemNotice" class="chatbot-system-notice" role="alert">
            <strong>{{ systemNotice.title }}</strong>
            <p>{{ systemNotice.message }}</p>
            <button
              v-if="systemNotice.retry"
              type="button"
              class="chatbot-inline-button"
              :disabled="sending"
              @click="submit"
            >
              다시 시도
            </button>
          </div>

          <ChatMessageBubble
            v-for="item in messages"
            :key="item.id"
            :message="item"
            :retry-disabled="sending"
            :can-retry="!sessionBlocked"
            @retry="retryMessage"
            @focus-input="focusInput"
            @open-reference="openReference"
          />

          <div v-if="sending && messages.length" class="chatbot-loading-message" role="status">
            <span class="chatbot-loading-dots" aria-hidden="true"><i></i><i></i><i></i></span>
            <div>
              <strong>검색하고 있어요</strong>
              <span>잠시만 기다려 주세요</span>
            </div>
          </div>
        </div>

        <button
          v-if="showNewMessageButton"
          type="button"
          class="chatbot-new-message-button"
          @click="scrollToBottom('smooth')"
        >
          새 메시지 ↓
        </button>
      </div>

      <form class="chatbot-input-area" @submit.prevent="submit">
        <p class="chatbot-input-guide">질문은 2~100자까지 입력할 수 있어요.</p>
        <div class="chatbot-compose-row">
          <div class="chatbot-textarea-wrap" :class="{ error: messageError }">
            <textarea
              ref="inputElement"
              v-model="inputValue"
              rows="1"
              aria-label="챗봇 질문"
              aria-describedby="chatbot-input-hint chatbot-character-count chatbot-message-error"
              :aria-invalid="Boolean(messageError)"
              :disabled="controlsDisabled"
              placeholder="메시지를 입력하세요"
              @keydown="handleInputKeydown"
            ></textarea>
            <span
              id="chatbot-character-count"
              class="chatbot-character-count"
              :class="{ over: characterCount > 100 }"
            >
              {{ characterCount }} / 100
            </span>
          </div>
          <button type="submit" class="chatbot-send-button" :disabled="controlsDisabled">
            {{ sending ? '전송 중' : '전송' }}
          </button>
        </div>
        <p v-if="messageError" id="chatbot-message-error" class="chatbot-field-error" role="alert">
          {{ messageError }}
        </p>
        <p id="chatbot-input-hint" class="chatbot-input-hint">Enter로 전송 · Shift+Enter 줄바꿈</p>
      </form>
    </section>

    <div v-else class="chatbot-floating-wrap">
      <span class="chatbot-tooltip" role="tooltip">{{ floatingLabel }}</span>
      <button
        ref="toggleElement"
        type="button"
        class="chatbot-toggle"
        :class="`state-${floatingState}`"
        :aria-label="floatingLabel"
        :aria-expanded="isOpen"
        @click="openChatbot"
      >
        <span v-if="floatingState === 'loading'" class="chatbot-toggle-dots" aria-hidden="true">
          <i></i><i></i><i></i>
        </span>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 5.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-4.5 3v-3H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"
          />
          <path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" />
        </svg>
        <span v-if="floatingState === 'unread'" class="chatbot-toggle-badge">1</span>
        <span v-else-if="floatingState === 'error'" class="chatbot-toggle-badge error">!</span>
      </button>
    </div>
  </aside>

  <AppModal
    v-if="showNewConversationModal"
    title="새 대화 시작"
    close-label="새 대화 확인 창 닫기"
    @close="closeNewConversationModal"
  >
    <p>현재 대화 화면을 비우고 새 대화를 시작할까요?</p>
    <p>새 세션이 만들어진 뒤에만 현재 대화가 지워집니다.</p>
    <p v-if="modalError" class="form-error" role="alert">{{ modalError }}</p>
    <template #footer>
      <button
        type="button"
        class="button"
        :disabled="creatingConversation"
        @click="closeNewConversationModal"
      >
        취소
      </button>
      <button
        type="button"
        class="button button-primary"
        :disabled="creatingConversation"
        @click="confirmNewConversation"
      >
        {{ creatingConversation ? '새 대화 만드는 중' : '새 대화 시작' }}
      </button>
    </template>
  </AppModal>
</template>
