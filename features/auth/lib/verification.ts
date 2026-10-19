import 'server-only'
import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import {
  CODE_LENGTH,
  CODE_MAX_ATTEMPTS,
  CODE_RESEND_SEC,
  CODE_TTL_SEC,
} from '@/features/auth/lib/constants'
import { getDb } from '@/features/auth/lib/db'
import type { VerifyMethod } from '@/features/auth/lib/users'
import { formatPhone } from '@/features/auth/lib/validation'

/* 본인인증 인증번호
   - 예측할 수 없는 난수(crypto.randomInt)로 만듦 (Math.random은 예측 가능해서 보안용 X)
   - 원문은 발송에만 쓰고 DB에는 해시만 저장
   - 5분이 지나거나 5번 틀리면 폐기, 맞히면 바로 삭제 (한 번만 사용 가능) */

type CodeRow = {
  method: VerifyMethod
  target: string
  code_hash: string
  attempts: number
  expires_at: number
  sent_at: number
}

function hashCode(userId: number, code: string) {
  return createHash('sha256').update(`${userId}:${code}`).digest('hex')
}

function findCode(userId: number) {
  return getDb()
    .prepare('SELECT * FROM verification_codes WHERE user_id = ?')
    .get(userId) as CodeRow | undefined
}

export function discardCode(userId: number) {
  getDb()
    .prepare('DELETE FROM verification_codes WHERE user_id = ?')
    .run(userId)
}

/** 다시 받으려면 몇 초 더 기다려야 하는지 (0이면 바로 가능) */
export function getResendWaitSec(userId: number) {
  const row = findCode(userId)
  if (!row) return 0
  const waitMs = row.sent_at + CODE_RESEND_SEC * 1000 - Date.now()
  return waitMs > 0 ? Math.ceil(waitMs / 1000) : 0
}

/** 아직 유효한 인증번호가 있으면 화면에 다시 보여 줄 정보 (인증번호 자체는 X) */
export function getPendingCode(userId: number) {
  const row = findCode(userId)
  const now = Date.now()
  if (!row || row.expires_at <= now) return null
  return {
    method: row.method,
    target: row.method === 'phone' ? formatPhone(row.target) : row.target,
    expiresIn: Math.ceil((row.expires_at - now) / 1000),
    resendIn: getResendWaitSec(userId),
  }
}

/** 새 인증번호를 만들어 저장하고 원문을 돌려줌 (이전 번호는 무효가 됨) */
export function issueCode(
  userId: number,
  method: VerifyMethod,
  target: string,
) {
  const code = randomInt(0, 10 ** CODE_LENGTH)
    .toString()
    .padStart(CODE_LENGTH, '0')
  const now = Date.now()
  getDb()
    .prepare(
      `INSERT OR REPLACE INTO verification_codes
         (user_id, method, target, code_hash, attempts, expires_at, sent_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
    )
    .run(
      userId,
      method,
      target,
      hashCode(userId, code),
      now + CODE_TTL_SEC * 1000,
      now,
    )
  return code
}

export type CodeCheck =
  | { ok: true; method: VerifyMethod; target: string }
  | { ok: false; reason: 'missing' | 'expired' | 'locked' }
  | { ok: false; reason: 'mismatch'; remainingAttempts: number }

/** 입력한 인증번호 확인 */
export function checkCode(userId: number, code: string): CodeCheck {
  const row = findCode(userId)
  if (!row) return { ok: false, reason: 'missing' }

  if (row.expires_at <= Date.now()) {
    discardCode(userId)
    return { ok: false, reason: 'expired' }
  }

  const expected = Buffer.from(row.code_hash, 'hex')
  const actual = Buffer.from(hashCode(userId, code), 'hex')
  if (!timingSafeEqual(expected, actual)) {
    const attempts = row.attempts + 1
    if (attempts >= CODE_MAX_ATTEMPTS) {
      discardCode(userId)
      return { ok: false, reason: 'locked' }
    }
    getDb()
      .prepare('UPDATE verification_codes SET attempts = ? WHERE user_id = ?')
      .run(attempts, userId)
    return {
      ok: false,
      reason: 'mismatch',
      remainingAttempts: CODE_MAX_ATTEMPTS - attempts,
    }
  }

  discardCode(userId)
  return { ok: true, method: row.method, target: row.target }
}
