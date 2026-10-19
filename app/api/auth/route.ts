import { NextResponse, type NextRequest } from 'next/server'
import { fail } from '@/features/auth/lib/http'
import { getRequestUser } from '@/features/auth/lib/session'

/* 인증 API 목록
   GET  /api/auth                 지금 로그인한 회원 정보 (이 파일)
   POST /api/auth/signup          회원가입        → signup/route.ts
   POST /api/auth/login           로그인          → login/route.ts
   POST /api/auth/logout          로그아웃        → logout/route.ts
   POST /api/auth/verify/send     인증번호 받기   → verify/send/route.ts
   POST /api/auth/verify/confirm  인증번호 확인   → verify/confirm/route.ts */

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request)
  if (!user) return fail(401, '로그인이 필요해요.')

  // 화면에 필요한 정보만 돌려줌 (비밀번호 해시 등 X)
  return NextResponse.json(
    {
      ok: true,
      user: { name: user.name, email: user.email, verified: user.verified },
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
