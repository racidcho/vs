# Vercel MCP 서버 설정 가이드 🚀

## 설치 완료 ✅

Vercel MCP 서버가 성공적으로 설치되었습니다:
```bash
npm install -g vercel-mcp
```

**Claude Code 설정 완료**:
- 래퍼 스크립트 생성 (vercel-mcp-wrapper.cmd)
- Claude Code에 MCP 서버 추가 완료

## Claude와 통합하기

### 1. Vercel API 토큰 생성

1. [Vercel Dashboard](https://vercel.com/account/tokens)로 이동
2. "Create Token" 클릭
3. 토큰 이름 입력 (예: "Claude MCP")
4. 적절한 권한 설정:
   - **Full Access** 또는
   - 최소 권한: `read:user`, `read:deployment`, `write:deployment`
5. 생성된 토큰 복사 (한 번만 표시됨!)

### 2. Claude Desktop 설정

Claude Desktop에서 MCP 서버를 사용하려면 설정 파일을 수정해야 합니다.

#### Windows 설정 경로:
```
%APPDATA%\Claude\claude_desktop_config.json
```

#### 설정 파일 내용:
```json
{
  "mcpServers": {
    "vercel": {
      "command": "node",
      "args": [
        "C:\\Users\\라시드\\AppData\\Roaming\\npm\\node_modules\\vercel-mcp\\index.js"
      ],
      "env": {
        "VERCEL_API_KEY": "YOUR_VERCEL_TOKEN_HERE"
      }
    }
  }
}
```

**중요**: `YOUR_VERCEL_TOKEN_HERE`를 실제 Vercel API 토큰으로 교체하세요.

### 3. Claude 재시작

설정 파일을 저장한 후 Claude Desktop을 재시작하면 Vercel MCP 서버가 자동으로 로드됩니다.

## 사용 가능한 Vercel MCP 명령어

Vercel MCP가 활성화되면 Claude에서 다음과 같은 작업을 수행할 수 있습니다:

### 배포 관련
- 프로젝트 배포 상태 확인
- 새로운 배포 트리거
- 배포 로그 확인
- 빌드 오류 디버깅

### 도메인 관리
- 도메인 목록 확인
- 도메인 연결 상태 확인
- DNS 설정 확인

### 프로젝트 관리
- 프로젝트 설정 확인
- 환경 변수 목록 확인
- 프로젝트 통계 조회

### 팀 관리
- 팀 멤버 확인
- 권한 관리

## 현재 프로젝트 정보

- **프로젝트 이름**: couple-fine-webapp
- **도메인**: joanddo.com (연결 대기 중)
- **프로덕션 URL**: https://couple-fine-webapp-ch7kqsduz-racidcho-1617s-projects.vercel.app

## 다음 단계

1. Vercel API 토큰 생성
2. Claude 설정 파일 수정
3. Claude 재시작
4. MCP 명령어로 도메인 연결 및 환경 변수 설정

## 보안 주의사항

⚠️ **API 토큰 보안**:
- API 토큰을 절대 공개 저장소에 커밋하지 마세요
- 토큰은 환경 변수나 안전한 위치에 보관하세요
- 정기적으로 토큰을 재생성하여 보안을 유지하세요

## 문제 해결

### MCP 서버가 로드되지 않는 경우:
1. Claude Desktop 완전히 종료 (시스템 트레이 확인)
2. 설정 파일 JSON 문법 확인
3. 파일 경로가 정확한지 확인
4. Claude Desktop 재시작

### 권한 오류가 발생하는 경우:
- API 토큰의 권한이 충분한지 확인
- 토큰이 만료되지 않았는지 확인
- 올바른 팀/프로젝트에 접근 권한이 있는지 확인

---

*최종 업데이트: 2025-08-07*