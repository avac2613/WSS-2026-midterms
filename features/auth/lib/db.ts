import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import type { DatabaseSync } from 'node:sqlite'

/* SQLite 데이터베이스
   - Node.js에 들어 있는 SQLite(node:sqlite)를 써서 따로 설치할 것이 없어요. (Node.js 22.13 이상)
   - 데이터는 프로젝트 폴더의 data/app.db 파일에 저장됩니다. (git에는 올라가지 않음)
   - 처음부터 다시 시작하고 싶으면 개발 서버를 끄고 data 폴더를 지우면 돼요.
   - 쿼리에 값을 넣을 때는 항상 ? 자리표시자를 써서 SQL 인젝션을 막습니다.
       좋은 예: db.prepare('SELECT * FROM users WHERE email = ?').get(email)
       나쁜 예: db.prepare(`SELECT * FROM users WHERE email = '${email}'`)  ← 절대 X */

const DB_FILE = path.join(process.cwd(), 'data', 'app.db')

const SCHEMA = `
  -- 회원
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,  -- 소문자로 통일해서 저장
    password_hash TEXT    NOT NULL,         -- 비밀번호 원문은 저장하지 않음
    phone         TEXT    UNIQUE,           -- 휴대폰으로 본인인증했을 때만 저장
    verified_at   INTEGER,                  -- 본인인증한 시각 (NULL이면 아직 안 함)
    verify_method TEXT,                     -- 'email' | 'phone'
    created_at    INTEGER NOT NULL
  );

  -- 로그인 세션 (쿠키 값의 해시만 저장)
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT    PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_user_id ON sessions(user_id);

  -- 본인인증 인증번호 (회원마다 가장 최근 것 하나만)
  CREATE TABLE IF NOT EXISTS verification_codes (
    user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    method     TEXT    NOT NULL,
    target     TEXT    NOT NULL,            -- 받은 이메일 또는 휴대폰 번호
    code_hash  TEXT    NOT NULL,
    attempts   INTEGER NOT NULL DEFAULT 0,  -- 틀린 횟수
    expires_at INTEGER NOT NULL,
    sent_at    INTEGER NOT NULL
  );

  -- 요청 횟수 제한 기록
  CREATE TABLE IF NOT EXISTS rate_limits (
    key      TEXT    PRIMARY KEY,
    count    INTEGER NOT NULL,
    reset_at INTEGER NOT NULL
  );
`

function openDatabase() {
  // import 대신 실행할 때 Node.js에서 직접 꺼내 씁니다.
  // (Next.js 번들러가 node:sqlite 모듈을 건드리지 않게 하려는 것)
  const sqlite = process.getBuiltinModule('node:sqlite')
  if (!sqlite) {
    throw new Error(
      'node:sqlite를 찾을 수 없어요. Node.js 22.13 이상으로 업데이트해 주세요.',
    )
  }

  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true })
  const db = new sqlite.DatabaseSync(DB_FILE)
  db.exec('PRAGMA journal_mode = WAL') // 읽기와 쓰기가 서로 덜 막히게
  db.exec('PRAGMA busy_timeout = 5000') // 잠겨 있으면 5초까지 기다림
  db.exec('PRAGMA foreign_keys = ON') // 회원을 지우면 세션·인증번호도 같이 삭제
  db.exec(SCHEMA)
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now())
  db.prepare('DELETE FROM rate_limits WHERE reset_at <= ?').run(Date.now())
  return db
}

/* 개발 서버는 코드를 고칠 때마다 모듈을 다시 불러오므로
   연결을 globalThis에 하나만 만들어 두고 재사용합니다. */
const globalForDb = globalThis as typeof globalThis & {
  __studyNoteDb?: DatabaseSync
}

export function getDb() {
  globalForDb.__studyNoteDb ??= openDatabase()
  return globalForDb.__studyNoteDb
}

/** UNIQUE 제약 위반인지 (같은 이메일·번호가 이미 있을 때 나는 오류) */
export function isUniqueViolation(error: unknown) {
  return (
    error instanceof Error && error.message.includes('UNIQUE constraint failed')
  )
}
