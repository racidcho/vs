# 우리 벌금통 💕 (Couple Fine WebApp)

커플들이 함께 사용하는 귀여운 벌금 관리 앱입니다. 서로의 약속을 지키고, 벌금을 모아 특별한 데이트를 즐겨보세요!

🌐 **라이브 URL**: [joanddo.com](https://joanddo.com) (배포 준비 중)

## 🌟 주요 기능

- 💝 **우리들의 약속**: 커플만의 특별한 규칙을 만들고 관리해요
- 💰 **벌금 기록**: 규칙을 어기거나 착한 일을 했을 때 기록해요
- 🎁 **보상 시스템**: 목표 금액을 달성하면 함께 즐길 보상을 받아요
- 📱 **모바일 최적화**: 모바일에서 편하게 사용할 수 있는 디자인
- 🔐 **보안 기능**: 4자리 PIN으로 앱을 안전하게 보호해요
- 🌐 **오프라인 지원**: 인터넷이 없어도 사용 가능해요
- 🎨 **귀여운 디자인**: 파스텔톤과 이모지로 꾸민 아기자기한 UI

## 🛠 기술 스택

- **프론트엔드**: React 18 + TypeScript
- **스타일링**: Tailwind CSS v4 + 커스텀 디자인 시스템
- **상태 관리**: React Context API
- **데이터베이스**: Supabase (PostgreSQL)
- **인증**: Supabase Auth (매직 링크)
- **빌드 도구**: Vite
- **PWA**: Workbox + Service Workers

## 🚀 시작하기

### 필요 사항

- Node.js 18+ 및 npm
- Supabase 계정 및 프로젝트

### 설치 방법

1. 저장소 복제:
```bash
git clone https://github.com/yourusername/couple-fine-webapp.git
cd couple-fine-webapp
```

2. 의존성 설치:
```bash
npm install
```

3. 환경 변수 설정:
```bash
cp .env.example .env
```

`.env` 파일에 Supabase 인증 정보 입력:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. 개발 서버 실행:
```bash
npm run dev
```

5. 브라우저에서 [http://localhost:5173](http://localhost:5173) 열기

## 📦 프로덕션 빌드

```bash
npm run build
```

빌드 결과물은 `dist` 폴더에 생성됩니다.

## 📁 프로젝트 구조

```
couple-fine-webapp/
├── src/
│   ├── components/       # 재사용 가능한 컴포넌트
│   │   ├── auth/         # 인증 관련 컴포넌트
│   │   ├── layout/       # 레이아웃 컴포넌트
│   │   └── ui/           # UI 컴포넌트
│   ├── contexts/         # React Context
│   ├── hooks/            # 커스텀 훅
│   ├── lib/              # 유틸리티 및 설정
│   ├── pages/            # 페이지 컴포넌트
│   ├── styles/           # 전역 스타일
│   └── types/            # TypeScript 타입 정의
├── public/              # 정적 파일
└── supabase/           # Supabase 설정 및 마이그레이션
```

## 📊 개발 현황

### 완료된 기능 ✅
- 프로젝트 초기 설정 및 구성
- 기본 UI 컴포넌트 및 레이아웃
- 로그인 인증 플로우 (테스트 모드)
- 규칙 관리 페이지
- 벌금 기록 페이지
- 보상 시스템 페이지
- 설정 페이지
- PWA 구성
- 오프라인 지원
- **모바일 최적화** (하단 네비게이션 바)
- **전체 한글화** 완료
- **귀여운 디자인** (파스텔톤, 그라데이션, 이모지)

### 진행 중 🚧
- Supabase 실시간 동기화
- 실제 데이터베이스 연동
- 커플 연결 시스템
- PIN 인증 시스템 구현

### 계획됨 📋
- 푸시 알림
- 데이터 내보내기/가져오기
- 통계 및 분석 기능
- 달력 뷰 구현
- 소셜 기능
- 다국어 지원

## 🌐 배포 정보

- **도메인**: [joanddo.com](https://joanddo.com)
- **플랫폼**: Vercel
- **상태**: 배포 준비 중 (Vercel 프로젝트 연결 대기)

## 🤝 기여하기

기여를 환영합니다! PR을 보내주세요.

## 📄 라이선스

MIT License

## 💌 문의

이슈나 문의사항이 있으시면 GitHub Issues를 통해 연락주세요.

---

Made with 💕 by Couple Fine Team