import { NextResponse, type NextRequest } from 'next/server'
import { CODE_RESEND_SEC, CODE_TTL_SEC } from '@/features/auth/lib/constants'
import {
  asString,
  fail,
  readJson,
  rejectCrossSite,
} from '@/features/auth/lib/http'
import { consumeRateLimit } from '@/features/auth/lib/rateLimit'
import { sendVerificationCode } from '@/features/auth/lib/sendCode'
import { getRequestUser } from '@/features/auth/lib/session'
import { isPhoneTaken } from '@/features/auth/lib/users'
import {
  discardCode,
  getResendWaitSec,
  issueCode,
} from '@/features/auth/lib/verification'
import { normalizePhone, validatePhone } from '@/features/auth/lib/validation'

const HOUR_MS = 60 * 60 * 1000
const MAX_SENDS_PER_HOUR = 5

/* 인증번호 받기: POST /api/auth/verify/send  { method: 'email' | 'phone', phone? }
   로그인한 상태에서만 가능 (인증 결과를 이 계정에 저장하기 때문) */
export async function POST(request: NextRequest) {
  const blocked = rejectCrossSite(request)
  if (blocked) return blocked

  const user = await getRequestUser(request)
  if (!user) return fail(401, '로그인이 필요해요.')
  if (user.verified) {
    return fail(409, '이미 본인인증을 마쳤어요.', { reason: 'verified' })
  }

  const parsed = await readJson(request)
  if ('error' in parsed) return parsed.error

  const method = parsed.body.method
  if (method !== 'email' && method !== 'phone') {
    return fail(400, '인증 수단을 선택해 주세요.')
  }

  // 이메일 인증은 가입한 이메일로만 보냄 (아무 주소나 받으면 남의 메일로 인증 가능)
  let target = user.email
  if (method === 'phone') {
    const phone = asString(parsed.body.phone)
    const phoneError = validatePhone(phone)
    if (phoneError) {
      return fail(400, phoneError, { fieldErrors: { phone: phoneError } })
    }
    target = normalizePhone(phone)
    if (await isPhoneTaken(target, user.id)) {
      const message = '이미 다른 계정에서 인증한 번호예요.'
      return fail(409, message, { fieldErrors: { phone: message } })
    }
  }

  const waitSec = await getResendWaitSec(user.id)
  if (waitSec > 0) {
    return fail(429, `${waitSec}초 후에 다시 받을 수 있어요.`, {
      retryAfter: waitSec,
    })
  }

  // 1시간에 계정당 5번, 같은 번호·이메일로 5번까지 (문자 폭탄·발송 요금 폭탄 방지)
  for (const key of [`verify:user:${user.id}`, `verify:target:${target}`]) {
    const limit = await consumeRateLimit(key, MAX_SENDS_PER_HOUR, HOUR_MS)
    if (!limit.allowed) {
      return fail(
        429,
        '인증번호를 너무 많이 요청했어요. 잠시 후 다시 시도해 주세요.',
        { retryAfter: limit.retryAfterSec },
      )
    }
  }

  const code = await issueCode(user.id, method, target)
  try {
    const { devMode } = await sendVerificationCode(method, target, code)
    return NextResponse.json({
      ok: true,
      expiresIn: CODE_TTL_SEC,
      resendIn: CODE_RESEND_SEC,
      devMode, // true면 화면에 "터미널에서 확인" 안내 (인증번호 자체는 응답에 넣지 않음)
    })
  } catch (error) {
    console.error(error)
    await discardCode(user.id) // 못 보낸 번호는 지워서 바로 다시 시도할 수 있게
    return fail(503, '인증번호를 보내지 못했어요. 잠시 후 다시 시도해 주세요.')
  }
}
