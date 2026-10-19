import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/features/auth/lib/constants'
import { rejectCrossSite } from '@/features/auth/lib/http'
import { clearSessionCookie, deleteSession } from '@/features/auth/lib/session'

/* 로그아웃: POST /api/auth/logout
   상태를 바꾸는 요청이라 GET이 아니라 POST로만 받음
   (GET이면 다른 사이트의 링크를 누르기만 해도 로그아웃될 수 있음) */
export async function POST(request: NextRequest) {
  const blocked = rejectCrossSite(request)
  if (blocked) return blocked

  // DB에서 세션을 지워야 같은 쿠키를 다시 보내도 쓸 수 없음
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (token) deleteSession(token)

  const response = NextResponse.json({ ok: true })
  clearSessionCookie(response)
  return response
}
