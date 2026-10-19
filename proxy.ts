import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/features/auth/lib/constants'

/* 로그인이 필요한 페이지에 세션 쿠키 없이 들어오면 로그인 화면으로 보냄
   (Next.js 16부터 middleware.ts 대신 proxy.ts)
   - proxy는 요청마다 실행되므로 쿠키가 '있는지'만 빠르게 확인 (DB 조회 X)
   - 세션이 진짜 유효한지는 app/(main)/layout.tsx 와 각 API에서 다시 확인함 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next()

  // 로그인 후 원래 보려던 페이지로 돌아올 수 있게 주소를 기억
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set(
    'next',
    request.nextUrl.pathname + request.nextUrl.search,
  )
  return NextResponse.redirect(loginUrl)
}

/* (main) 그룹에 새 페이지 폴더를 만들면 여기에도 추가해 주세요 */
export const config = {
  matcher: ['/ai/:path*', '/library/:path*', '/mypage/:path*'],
}
