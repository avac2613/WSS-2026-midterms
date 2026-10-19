import { NextResponse, type NextRequest } from 'next/server'
import { isUniqueViolation } from '@/features/auth/lib/db'
import {
  asString,
  fail,
  getClientIp,
  readJson,
  rejectCrossSite,
} from '@/features/auth/lib/http'
import { hashPassword } from '@/features/auth/lib/password'
import { consumeRateLimit } from '@/features/auth/lib/rateLimit'
import { createSession, setSessionCookie } from '@/features/auth/lib/session'
import { createUser, findUserByEmail } from '@/features/auth/lib/users'
import {
  normalizeEmail,
  validateEmail,
  validateName,
  validatePassword,
  type FieldErrors,
} from '@/features/auth/lib/validation'

const EMAIL_TAKEN = '이미 가입된 이메일이에요.'

/* 회원가입: POST /api/auth/signup  { name, email, password }
   가입하면 바로 로그인 상태가 되고, 화면은 본인인증으로 넘어갑니다. */
export async function POST(request: NextRequest) {
  const blocked = rejectCrossSite(request)
  if (blocked) return blocked

  // 같은 IP에서 1시간에 10번까지 (자동 가입 봇 방지)
  const limit = consumeRateLimit(
    `signup:ip:${getClientIp(request)}`,
    10,
    60 * 60 * 1000,
  )
  if (!limit.allowed) {
    return fail(429, '가입 시도가 너무 많아요. 잠시 후 다시 시도해 주세요.', {
      retryAfter: limit.retryAfterSec,
    })
  }

  const parsed = await readJson(request)
  if ('error' in parsed) return parsed.error

  const name = asString(parsed.body.name).trim()
  const email = normalizeEmail(asString(parsed.body.email))
  const password = asString(parsed.body.password)

  // 브라우저에서 검사했더라도 서버에서 다시 검사 (요청은 조작될 수 있음)
  const fieldErrors: FieldErrors = {}
  const nameError = validateName(name)
  const emailError = validateEmail(email)
  const passwordError = validatePassword(password)
  if (nameError) fieldErrors.name = nameError
  if (emailError) fieldErrors.email = emailError
  if (passwordError) fieldErrors.password = passwordError
  if (Object.keys(fieldErrors).length > 0) {
    return fail(400, '입력한 내용을 다시 확인해 주세요.', { fieldErrors })
  }

  if (findUserByEmail(email)) {
    return fail(409, EMAIL_TAKEN, { fieldErrors: { email: EMAIL_TAKEN } })
  }

  let userId: number
  try {
    userId = createUser({
      name,
      email,
      passwordHash: await hashPassword(password),
    })
  } catch (error) {
    // 같은 이메일로 거의 동시에 가입한 경우
    if (isUniqueViolation(error)) {
      return fail(409, EMAIL_TAKEN, { fieldErrors: { email: EMAIL_TAKEN } })
    }
    throw error
  }

  const response = NextResponse.json({ ok: true }, { status: 201 })
  setSessionCookie(response, createSession(userId))
  return response
}
