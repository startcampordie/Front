# LocalHub 백엔드 연결 가이드

현재 프론트엔드는 `VITE_API_BASE_URL`이 없으면 목업 JSON과 `localStorage`를 사용합니다.

## 서버 모드 전환

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_USE_MOCK=false
```

API가 준비되기 전 강제로 목업을 사용하려면 `VITE_USE_MOCK=true`로 설정합니다.

## 수정할 파일

- 게시판 API: `src/services/boardService.js`
- 지역 정보 API: `src/services/placeService.js`
- 통합 검색 API: `src/services/searchService.js`
- 챗봇 API: `src/services/chatbotService.js`

각 파일에서 `BACKEND 연결 지점`을 검색하면 API 명세에 따라 바꿔야 할 위치를 찾을 수 있습니다. 화면 컴포넌트는 서비스 함수의 반환 모델만 유지되면 수정할 필요가 없습니다.

## 목업과 실제 서버의 차이

1. 목업 게시글은 브라우저 `localStorage`에 저장되며 다른 사용자와 공유되지 않습니다.
2. 목업 비밀번호는 기능 시연용 평문입니다. 실제 서버에서는 해시로 저장하고 응답에 포함하지 않습니다.
3. 목업 조회수는 브라우저 안에서만 증가합니다. 실제 서버에서는 동시 요청을 고려해 서버가 증가시켜야 합니다.
4. 실제 API의 페이지 번호가 0부터 시작한다면 서비스에서 프론트의 1 기반 페이지 번호를 변환해야 합니다.
5. 실제 서버의 필드명이 다르면 서비스의 응답 변환부에서 화면 공통 모델로 변환합니다.
6. 수정·삭제 인증이 토큰 방식이면 비밀번호 대신 서버가 발급한 일회용 토큰을 후속 요청에 전달합니다.
