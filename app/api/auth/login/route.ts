import { NextResponse, type NextRequest } from 'next/server'
import {
  asString,
  fail,
  getClientIp,
  readJson,
  rejectCrossSite,
  toMinutes,
} from '@/features/auth/lib/http'
import {
  verifyDummyPassword,
  verifyPassword,
} from '@/features/auth/lib/password'
import {
  checkRateLimit,
  consumeRateLimit,
  resetRateLimit,
} from '@/features/auth/lib/rateLimit'
import { createSession, setSessionCookie } from '@/features/auth/lib/session'
import { findUserByEmail } from '@/features/auth/lib/users'
import {
  normalizeEmail,
  PASSWORD_MAX,
  validateEmail,
  type FieldErrors,
} from '@/features/auth/lib/validation'

const WINDOW_MS = 15 * 60 * 1000 // 15분
const MAX_FAILS_PER_EMAIL = 5 // 한 계정에 비밀번호를 5번 틀리면 15분 잠금
const MAX_TRIES_PER_IP = 30 // 한 IP에서 15분에 30번까지 시도

/* 로그인: POST /api/auth/login  { email, password } */
export async function POST(request: NextRequest) {
  const blocked = rejectCrossSite(request)
  if (blocked) return blocked

  const parsed = await readJson(request)
  if ('error' in parsed) return parsed.error

  const email = normalizeEmail(asString(parsed.body.email))
  const password = asString(parsed.body.password)

  const fieldErrors: FieldErrors = {}
  const emailError = validateEmail(email)
  if (emailError) fieldErrors.email = emailError
  if (!password) fieldErrors.password = '비밀번호를 입력해 주세요.'
  if (password.length > PASSWORD_MAX) {
    fieldErrors.password = '비밀번호가 올바르지 않아요.'
  }
  if (Object.keys(fieldErrors).length > 0) {
    return fail(400, '입력한 내용을 다시 확인해 주세요.', { fieldErrors })
  }

  // 무차별 대입 방지: 계정별 실패 횟수 + IP별 시도 횟수
  const emailKey = `login:email:${email}`
  const emailLimit = checkRateLimit(emailKey, MAX_FAILS_PER_EMAIL)
  const ipLimit = consumeRateLimit(
    `login:ip:${getClientIp(request)}`,
    MAX_TRIES_PER_IP,
    WINDOW_MS,
  )
  if (!emailLimit.allowed || !ipLimit.allowed) {
    const retryAfter = Math.max(emailLimit.retryAfterSec, ipLimit.retryAfterSec)
    return fail(
      429,
      `로그인 시도가 너무 많아요. ${toMinutes(retryAfter)}분 후 다시 시도해 주세요.`,
      { retryAfter },
    )
  }

  const user = findUserByEmail(email)
  const passwordOk = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyDummyPassword(password) // 없는 계정도 비슷한 시간이 걸리게

  if (!user || !passwordOk) {
    consumeRateLimit(emailKey, MAX_FAILS_PER_EMAIL, WINDOW_MS)
    // 이메일이 없는 건지 비밀번호가 틀린 건지 알려 주지 않음 (가입 여부 노출 방지)
    return fail(401, '이메일 또는 비밀번호가 올바르지 않아요.')
  }

  resetRateLimit(emailKey)
  const response = NextResponse.json({
    ok: true,
    verified: user.verifiedAt !== null,
  })
  // 로그인할 때마다 새 세션 발급 (세션 고정 공격 방어)
  setSessionCookie(response, createSession(user.id))
  return response
}
