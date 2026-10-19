import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import type { FieldErrors } from '@/features/auth/lib/validation'

/* 인증 API(route.ts)에서 같이 쓰는 도우미
   응답 형식
   - 성공: { ok: true, ... }
   - 실패: { ok: false, message: "화면에 보여 줄 문구", fieldErrors?: { email: "..." }, ... } */

type FailExtra = {
  fieldErrors?: FieldErrors
  /** 다시 시도할 수 있을 때까지 남은 초 */
  retryAfter?: number
  /** 화면에서 실패 종류를 구분할 때 쓰는 값 (예: 'expired') */
  reason?: string
  remainingAttempts?: number
}

export function fail(status: number, message: string, extra: FailExtra = {}) {
  const response = NextResponse.json(
    { ok: false, message, ...extra },
    { status },
  )
  if (extra.retryAfter) {
    response.headers.set('Retry-After', String(extra.retryAfter))
  }
  return response
}

/* 다른 사이트에서 보낸 요청이면 거부 (CSRF 방어)
   SameSite 쿠키에 더해 한 번 더 확인합니다.
   브라우저는 요청을 보낸 페이지 주소를 Origin 헤더에 자동으로 넣고,
   웹페이지의 스크립트는 이 값을 바꿀 수 없어요. */
export function rejectCrossSite(request: NextRequest) {
  const origin = request.headers.get('origin')
  // 앞단 프록시를 거치면 원래 접속 주소가 x-forwarded-host에 담겨 옴
  const forwardedHost =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? ''
  const host = forwardedHost.split(',')[0].trim()

  if (origin) {
    let originHost: string | null = null
    try {
      originHost = new URL(origin).host
    } catch {
      // Origin: null 처럼 주소가 아닌 값
    }
    if (!host || originHost !== host) {
      return fail(403, '허용되지 않은 요청이에요.')
    }
  } else if (request.headers.get('sec-fetch-site') === 'cross-site') {
    return fail(403, '허용되지 않은 요청이에요.')
  }
  return null
}

const MAX_BODY_LENGTH = 10_000

/** JSON 본문 읽기. 형식이 틀렸거나 너무 크면 error에 응답이 담김 */
export async function readJson(
  request: NextRequest,
): Promise<{ body: Record<string, unknown> } | { error: NextResponse }> {
  // application/json만 받음: 다른 사이트의 <form>은 이 형식으로 보낼 수 없어서 CSRF 방어에도 도움
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return { error: fail(415, 'JSON 형식으로 보내 주세요.') }
  }
  if (Number(request.headers.get('content-length')) > MAX_BODY_LENGTH) {
    return { error: fail(413, '요청이 너무 커요.') }
  }

  const text = await request.text()
  if (text.length > MAX_BODY_LENGTH) {
    return { error: fail(413, '요청이 너무 커요.') }
  }
  try {
    const body: unknown = JSON.parse(text)
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      return { body: body as Record<string, unknown> }
    }
  } catch {
    // 아래에서 공통 처리
  }
  return { error: fail(400, '요청 형식이 올바르지 않아요.') }
}

/** 문자열이 아니면 빈 문자열로 (숫자·배열·객체가 들어와도 안전하게) */
export function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

/* 요청한 사람의 IP (요청 횟수 제한용)
   주의: 앞단 프록시 없이 서비스하면 x-forwarded-for는 요청하는 쪽이 꾸며 보낼 수 있어요.
         그래서 IP 제한만 믿지 않고 이메일·계정 기준 제한도 함께 둡니다. */
export function getClientIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  )
}

/** "15분 후" 처럼 보여 줄 분 단위 (올림) */
export function toMinutes(seconds: number) {
  return Math.max(1, Math.ceil(seconds / 60))
}
