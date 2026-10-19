import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/features/auth/lib/constants'
import { isUniqueViolation } from '@/features/auth/lib/db'
import {
  asString,
  fail,
  readJson,
  rejectCrossSite,
} from '@/features/auth/lib/http'
import {
  createSession,
  deleteSession,
  findSessionUser,
  setSessionCookie,
} from '@/features/auth/lib/session'
import { markVerified } from '@/features/auth/lib/users'
import { validateCode } from '@/features/auth/lib/validation'
import { checkCode } from '@/features/auth/lib/verification'

/** 인증번호를 새로 받아야 하는 경우의 안내 */
const NEED_NEW_CODE = {
  missing: { status: 400, message: '인증번호를 먼저 받아 주세요.' },
  expired: {
    status: 400,
    message: '인증 시간이 지났어요. 인증번호를 다시 받아 주세요.',
  },
  locked: {
    status: 429,
    message: '5번 틀려서 인증번호가 취소됐어요. 다시 받아 주세요.',
  },
}

/* 인증번호 확인: POST /api/auth/verify/confirm  { code } */
export async function POST(request: NextRequest) {
  const blocked = rejectCrossSite(request)
  if (blocked) return blocked

  const token = request.cookies.get(SESSION_COOKIE)?.value
  const user = token ? findSessionUser(token) : null
  if (!token || !user) return fail(401, '로그인이 필요해요.')
  if (user.verified) {
    return fail(409, '이미 본인인증을 마쳤어요.', { reason: 'verified' })
  }

  const parsed = await readJson(request)
  if ('error' in parsed) return parsed.error

  const code = asString(parsed.body.code).trim()
  const codeError = validateCode(code)
  if (codeError) {
    return fail(400, codeError, { fieldErrors: { code: codeError } })
  }

  const result = checkCode(user.id, code)
  if (!result.ok) {
    if (result.reason === 'mismatch') {
      const left = result.remainingAttempts
      return fail(400, `인증번호가 일치하지 않아요. (남은 기회 ${left}번)`, {
        reason: 'mismatch',
        remainingAttempts: left,
      })
    }
    const { status, message } = NEED_NEW_CODE[result.reason]
    return fail(status, message, { reason: result.reason })
  }

  try {
    markVerified(user.id, result.method, result.target)
  } catch (error) {
    // 그사이 다른 계정이 같은 번호로 먼저 인증한 경우
    if (isUniqueViolation(error)) {
      return fail(409, '이미 다른 계정에서 인증한 번호예요.')
    }
    throw error
  }

  // 권한이 바뀌었으니 세션을 새로 발급하고 예전 것은 폐기 (세션 고정 공격 방어)
  deleteSession(token)
  const response = NextResponse.json({ ok: true })
  setSessionCookie(response, createSession(user.id))
  return response
}
