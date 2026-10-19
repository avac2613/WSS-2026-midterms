import 'server-only'
import { getDb } from '@/features/auth/lib/db'

/* 요청 횟수 제한 (비밀번호 무차별 대입, 인증번호 문자 폭탄 등 방지)
   - key마다 정해진 시간(windowMs) 동안 limit번까지만 허용
   - DB에 기록하므로 서버를 다시 켜도 초기화되지 않음
   - node:sqlite는 동기 방식이라 한 서버 안에서 이 함수들이 중간에 끊기지 않음 */

type LimitRow = { count: number; reset_at: number }

export type LimitResult = { allowed: boolean; retryAfterSec: number }

function readRow(key: string, now: number) {
  const row = getDb()
    .prepare('SELECT count, reset_at FROM rate_limits WHERE key = ?')
    .get(key) as LimitRow | undefined
  return row && row.reset_at > now ? row : null // 시간이 지난 기록은 없는 것으로
}

/** 1회 사용으로 기록하고, 이미 다 썼으면 allowed: false */
export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): LimitResult {
  const now = Date.now()
  const row = readRow(key, now)

  if (!row) {
    getDb()
      .prepare(
        'INSERT OR REPLACE INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)',
      )
      .run(key, now + windowMs)
    return { allowed: true, retryAfterSec: 0 }
  }
  if (row.count >= limit) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((row.reset_at - now) / 1000),
    }
  }
  getDb()
    .prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?')
    .run(key)
  return { allowed: true, retryAfterSec: 0 }
}

/** 기록은 남기지 않고 이미 막혔는지만 확인 */
export function checkRateLimit(key: string, limit: number): LimitResult {
  const now = Date.now()
  const row = readRow(key, now)
  if (!row || row.count < limit) return { allowed: true, retryAfterSec: 0 }
  return {
    allowed: false,
    retryAfterSec: Math.ceil((row.reset_at - now) / 1000),
  }
}

export function resetRateLimit(key: string) {
  getDb().prepare('DELETE FROM rate_limits WHERE key = ?').run(key)
}
