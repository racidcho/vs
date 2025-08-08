# 💑 커플 벌칙 웹앱 - PRD (Product Requirements Document)

## 🧭 개요

### 목적
연인 간 금칙어와 행동을 위반했을 때 벌금을 부과하고, 감면하며, 누적 금액을 관리하고 보상 목표(리워드)를 설정할 수 있는 웹앱. 사용자는 금칙어 및 행동을 자유롭게 설정할 수 있으며, 모든 벌금은 **만원(₩10,000) 단위**로 관리된다.

---

## 🧱 핵심 기능 요약

| 기능 | 설명 |
|------|------|
| 회원가입/로그인 | Supabase 인증 기반 6자리 OTP 코드 인증 (크로스 디바이스 지원) |
| 커플 연결 | 초대코드 방식으로 한 쌍의 유저를 연결 |
| 금칙어/행동 관리 | 항목 추가/삭제 및 벌금 설정 (만원 단위) |
| 위반 기록 등록 | 위반 시 누가, 어떤 항목으로 몇 만원을 벌금 받았는지 기록 |
| 감면 처리 | 반성 또는 사과 시 벌금을 차감 처리 |
| 누적 통계 | 본인과 상대방의 누적 벌금 합계 표시 |
| 리워드 목표 설정 | 특정 금액 달성 시 리워드 등록 및 완료 처리 |
| 캘린더 보기 | 날짜별 위반 현황을 시각화해서 보기 |
| 테마 설정 | 다크모드/커플 테마 등 커스터마이징 |
| 앱 잠금 기능 | PIN 코드 기반 앱 잠금 기능 제공 (지문은 브라우저 한계로 미지원 예정) |

---

## 🔧 데이터베이스 설계 (Supabase)

### 🔹 users

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 사용자 고유 ID |
| email | string | 이메일 |
| display_name | string | 닉네임 |
| couple_id | UUID | 연결된 커플 ID |

---

### 🔹 couples

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 커플 고유 ID |
| code | string | 초대코드 |
| theme | string | 테마명 (예: "spring") |
| created_at | timestamp | 생성일 |

---

### 🔹 rules

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 고유 ID |
| couple_id | UUID | 해당 커플 ID |
| type | string | "word" 또는 "behavior" |
| title | string | 금칙어 or 행동명 |
| penalty_amount | int | 벌금 (단위: 만원, 예: 2 → 2만원) |
| created_at | timestamp | 생성일 |

---

### 🔹 violations

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 고유 ID |
| rule_id | UUID | 어떤 항목 위반인지 |
| violator_id | UUID | 위반한 사람 |
| partner_id | UUID | 대상자 |
| amount | int | 위반/감면 금액 (단위: 만원) |
| type | string | "add" 또는 "subtract" |
| note | string | 메모 |
| created_at | timestamp | 발생 시각 |

---

### 🔹 rewards

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 고유 ID |
| couple_id | UUID | 커플 ID |
| title | string | 리워드명 (예: “치킨 데이트”) |
| target_amount | int | 목표 금액 (단위: 만원) |
| is_claimed | boolean | 완료 여부 |
| created_at | timestamp | 생성일 |

---

## 📱 화면 설계 (MVP 기준)

1. **로그인/회원가입 페이지**
    - 이메일 입력 또는 Magic Link로 로그인
    - 커플 초대코드 입력/생성

2. **홈 / 대시보드**
    - 현재 내 벌금 합계 / 상대 벌금
    - 가장 최근 위반 내역
    - 리워드 목표 현황

3. **규칙 관리 페이지**
    - 금칙어/행동 추가/삭제
    - 벌금 수정

4. **위반 등록 페이지**
    - 어떤 규칙 위반했는지 선택
    - 감면 등록도 가능

5. **리워드 페이지**
    - 목표 설정 및 완료 체크
    - 달성률 표시

6. **캘린더 보기**
    - 날짜별 위반 건수 요약
    - 클릭 시 상세 보기

7. **설정 페이지**
    - 테마 설정
    - PIN 설정
    - 로그아웃

---

## 🔒 앱 잠금 기능

- 사용자가 PIN을 설정하면 브라우저 localStorage에 SHA256 암호화된 해시 저장
- 다음 접속 시 PIN 입력 → 일치 시 접근 허용
- 브라우저 환경 한정 (지문 등은 WebAuthn 비지원 시 생략)

---

## 🚀 기술 스택

| 구분 | 도구 |
|------|------|
| 프론트엔드 | Magic + Claude Code UI |
| 백엔드 | Supabase (MCP 포함) |
| 인증 | Supabase Auth |
| 배포 | Vercel |
| 캘린더 | `react-calendar` 또는 `@fullcalendar/react` |
| 테마 | Tailwind or styled-components 기반 |
| 잠금기능 | localStorage + SHA256 |

---

## 🎯 향후 확장 아이디어

- 푸시 알림 (PWA + Firebase)
- "감정 지수" 시각화 (긍정 강화용)
- 정기 점검 리포트 발송 (메일 or 앱 내)