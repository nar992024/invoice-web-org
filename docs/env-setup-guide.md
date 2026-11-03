# 환경변수(.env) 설정 가이드

로컬에서 앱을 실행하는 데 필요한 `.env` 작성 방법과 Notion 연동 절차를 정리한 문서입니다.

> **보안 주의:** 실제 키와 비밀번호를 이 문서나 다른 커밋 대상 파일에 적지 마세요. `.env`는 `.gitignore`에 포함되어 있습니다.

## 한눈에 보기

프로젝트 루트에 `.env` 파일을 만들고 아래 4개 값을 채웁니다.

```bash
NOTION_API_KEY=
NOTION_DATABASE_ID=
ADMIN_PASSWORD=
SESSION_SECRET=
```

| 변수                 | 어디서 얻나요?      | 검증 규칙                    |
| -------------------- | ------------------- | ---------------------------- |
| `NOTION_API_KEY`     | Notion 개발자 포털  | `ntn_` 또는 `secret_`로 시작 |
| `NOTION_DATABASE_ID` | `Invoices` DB의 URL | 정확히 32자 (하이픈 제외)    |
| `ADMIN_PASSWORD`     | 직접 정함           | 8자 이상                     |
| `SESSION_SECRET`     | 명령으로 생성       | 정확히 32자                  |

검증 규칙은 `src/lib/env.ts`에 정의되어 있으며, 값이 규칙에 맞지 않으면 Notion을 사용하는 페이지와 관리자 로그인 화면에서 500 에러가 발생합니다.

아래 2개는 선택 항목입니다.

| 변수                   | 용도                      | 설명                                                        |
| ---------------------- | ------------------------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_BASE_URL` | 견적서 링크 생성          | 기본값 `http://localhost:3000`, 배포 시 실제 도메인 지정    |
| `SLACK_WEBHOOK_URL`    | Claude Code Slack 알림 훅 | 앱 실행에는 필요 없음. [8단계](#8단계-slack-알림-선택) 참고 |

같은 이름의 값이 `.env.local`에도 있으면 `.env.local`의 값이 우선합니다.

## 1단계: `NOTION_API_KEY` 발급

**링크:** <https://app.notion.com/developers/connections>

1. 왼쪽 사이드바의 **Build**에서 **Internal connections**를 선택합니다. 워크스페이스 소유자만 만들 수 있습니다.
2. **Create a new connection**을 누르고 이름과 워크스페이스를 정합니다.
3. **Configuration** 탭에서 **API token**을 복사해 `.env`에 넣습니다.

콘텐츠 읽기, 업데이트, 삽입 기능이 켜져 있는지 확인합니다. API 토큰을 새로 고치면 `.env`의 값도 다시 입력해야 합니다.

## 2단계: 페이지에 connection 연결

키가 맞아도 페이지 권한이 없으면 API가 `404 object_not_found`를 반환합니다. 워크스페이스에 설치된 것(연결됨 표시)과 페이지 접근 권한은 별개입니다.

아래 방법 중 하나로 연결합니다.

- **Notion 페이지에서:** 페이지 오른쪽 위 **•••** → **Connections** → **+ Add connection** → 만든 connection 선택
- **연결 설정 화면에서:** 해당 connection → **사용 권한 편집하기** → 페이지 선택 후 저장

connection이 검색되지 않으면 페이지가 다른 워크스페이스에 있는지 확인합니다.

## 3단계: Notion DB 준비

앱은 DB 2개를 사용합니다. 속성 이름이 정확히 같아야 하며, 이름이 다르면 오류 없이 `미지정`이나 0 같은 기본값으로 표시될 수 있습니다.

### Invoices

| 속성           | 유형                         |
| -------------- | ---------------------------- |
| `견적서 번호`  | 제목(Title)                  |
| `클라이언트명` | 텍스트                       |
| `발행일`       | 날짜                         |
| `유효기간`     | 날짜                         |
| `총 금액`      | 숫자                         |
| `상태`         | 선택: `대기`, `승인`, `거절` |
| `항목`         | 관계형 → Items               |

### Items

| 속성       | 유형              |
| ---------- | ----------------- |
| `항목명`   | 제목(Title)       |
| `수량`     | 숫자              |
| `단가`     | 숫자              |
| `금액`     | 숫자              |
| `Invoices` | 관계형 → Invoices |

`금액`이 비어 있으면 앱이 `수량 × 단가`로 계산합니다.

connection이 연결된 페이지 아래에 DB를 만들면 그 권한이 DB에도 적용됩니다. 다른 위치에 만든다면 두 DB 모두에 connection을 연결해야 합니다.

## 4단계: `NOTION_DATABASE_ID` 입력

`Invoices` DB를 전체 페이지로 열고, 주소에서 `?` 바로 앞의 32자를 복사합니다. 데스크톱 앱에서는 **•••** → **링크 복사** 또는 `Ctrl + L`을 사용합니다.

```text
https://www.notion.so/워크스페이스/Invoices-1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d?v=...
                                           └──────── 이 32자 ────────┘
```

- `?v=` 뒤의 값이나 data source ID가 아니라 **database ID**를 넣습니다.
- 하이픈이 있으면 제거합니다.
- `Items` DB의 ID는 넣지 않습니다.
- 연결된 보기(linked view)가 아닌 **원본 DB**의 ID를 사용합니다.

## 5단계: `ADMIN_PASSWORD` 정하기

`/admin-login` 화면에서 입력할 관리자 비밀번호입니다. 외부에서 발급받는 값이 아니라 직접 정합니다.

- 8자 이상으로 정합니다.
- `$`와 `#`은 `.env`에서 다르게 해석될 수 있으니 쓰지 않는 편이 안전합니다.
- `admin1234`, `admin123`, `password`, `12345678`, `qwerty123`은 프로덕션에서 차단됩니다.
- 다른 서비스의 비밀번호를 재사용하지 않습니다.

## 6단계: `SESSION_SECRET` 생성

로그인 세션 토큰(JWT)을 서명하는 키입니다. 앱 내부에서만 쓰며, 아래 명령이 만든 32자를 그대로 넣습니다.

```powershell
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

- `openssl rand -base64 32`는 44자를 만들기 때문에 검증에 실패합니다.
- `docs/api-documentation.md`의 예시값은 프로덕션에서 차단되므로 사용하지 않습니다.
- 값을 바꾸면 기존 로그인이 풀려 다시 로그인해야 합니다.
- 배포 환경에는 개발용과 다른 값을 사용합니다.

## 7단계: 저장 후 확인

```powershell
npm run dev
```

| 주소                   | 기대 결과               |
| ---------------------- | ----------------------- |
| `/`                    | `/invoice/guide`로 이동 |
| `/invoice/[견적서 ID]` | 견적서 내용 표시        |
| `/admin`               | 로그인 화면으로 이동    |

견적서 ID는 `Invoices` DB에서 해당 견적서 페이지를 열었을 때 주소에 있는 32자입니다.

> **접속 주소 주의:** 프로덕션 빌드(`npm run start`)는 세션 쿠키에 `secure`를 사용합니다. HTTP로 IP 주소(`http://192.168.x.x:3000` 등)에 접속하면 쿠키가 저장되지 않아, "로그인 성공" 뒤에 로그인 화면으로 돌아옵니다. 로컬에서는 `http://localhost:3000`으로 접속합니다.

## 8단계: Slack 알림 (선택)

`.claude/hooks/`의 훅이 Claude Code의 작업 완료와 권한 요청을 Slack `#claude-code` 채널로 알립니다. 앱 동작과는 무관하므로 필요할 때만 설정합니다.

### 웹훅 URL 발급

1. [Slack 앱 관리 페이지](https://api.slack.com/apps)에서 앱을 만들거나 기존 앱을 선택합니다.
2. **Incoming Webhooks**를 켭니다.
3. 알림을 받을 채널을 선택해 웹훅을 추가하고 URL을 복사합니다.
4. `.env`에 추가합니다.

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

자세한 절차는 [Slack 공식 문서](https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/)를 참고합니다. 웹훅 URL을 아는 사람은 누구나 채널에 메시지를 보낼 수 있으므로 공개하지 않습니다.

### 주의 사항

- 훅은 `.env`만 읽습니다. `.env.local`에 넣으면 동작하지 않습니다.
- 훅이 bash의 `source`로 `.env` 전체를 읽으므로, **파일 줄바꿈은 LF**여야 하고 다른 값에도 공백이나 셸 특수문자가 없어야 합니다. VS Code 오른쪽 아래에서 `CRLF`를 눌러 `LF`로 바꿀 수 있습니다.
- `jq`와 `curl`이 필요합니다. Windows에서는 아래 명령으로 `jq`를 설치합니다.

```powershell
winget install jqlang.jq
```

`jq` 설치 후에는 터미널과 Claude Code를 모두 다시 시작해야 PATH가 적용됩니다. `jq --version`으로 확인합니다.

훅의 "성공" 메시지는 `curl` 실행 성공만 뜻하며, Slack이 URL을 거부해도 표시될 수 있습니다. 실제 채널에 알림이 왔는지로 확인합니다.

## 문제 해결

| 증상                                     | 원인                                       | 해결                                      |
| ---------------------------------------- | ------------------------------------------ | ----------------------------------------- |
| 화면이 500 에러, 로그에 `ZodError`       | 환경변수가 없거나 규칙에 맞지 않음         | 한눈에 보기의 검증 규칙 확인              |
| 값을 넣었는데 읽히지 않음                | 파일이 저장되지 않음 (0바이트)             | 편집기에서 저장 후 파일 크기 확인         |
| API `404 object_not_found`               | 페이지나 DB에 connection 미연결            | 2단계 진행                                |
| API `400 validation_error` (database_id) | `NOTION_DATABASE_ID`가 예시값이거나 잘못됨 | 4단계 진행                                |
| connection이 검색되지 않음               | 페이지가 다른 워크스페이스에 있음          | connection을 설치한 워크스페이스에서 진행 |
| 로그인 성공 후 로그인 화면으로 돌아옴    | HTTP IP 주소 접속으로 쿠키 저장 안 됨      | `http://localhost:3000`으로 접속          |
| "비밀번호가 일치하지 않습니다"           | 입력값과 `ADMIN_PASSWORD`가 다름           | `.env` 확인 후 서버 재시작                |
| `jq`를 찾을 수 없음                      | 설치 후 PATH가 갱신되지 않음               | 터미널과 Claude Code 재시작               |
| Slack 알림이 오지 않음                   | URL 오류, `.env`의 CRLF, 값 누락           | 8단계 주의 사항 확인                      |

## 참고 문서

- [Internal connections 가이드](https://developers.notion.com/guides/connections-and-tokens/internal-connections.md)
- [페이지 접근 권한 부여](https://developers.notion.com/guides/connections-and-tokens/internal-connections.md#granting-page-access)
- [데이터베이스 다루기](https://developers.notion.com/guides/data-apis/working-with-databases.md)
