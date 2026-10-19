/* 로그인 후 돌아갈 주소(?next=) 다루기
   주소창의 next 값은 누구나 바꿀 수 있어서 그대로 이동하면
   /login?next=https://evil.com 같은 링크로 피싱 사이트에 보내는
   '오픈 리다이렉트' 공격이 가능합니다. 우리 사이트 안의 경로만 허용해요. */

/** 다시 돌아오면 안 되는 화면 (로그인 화면으로 돌아가면 무한 이동이 생김) */
const AUTH_PAGES = ['/login', '/signup', '/verify']

/** 안전한 경로면 그대로, 아니면 null */
export function safeNextPath(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 512) return null

  // '/'로 시작하는 내부 경로만 ('//evil.com'은 외부 주소로 해석되므로 거부)
  if (!value.startsWith('/') || value.startsWith('//')) return null

  // 역슬래시·공백·제어문자가 섞이면 브라우저가 외부 주소로 바꿔 읽을 수 있음
  if (/[\\\s\u0000-\u001f\u007f]/.test(value)) return null

  const pathname = value.split(/[?#]/)[0]
  if (pathname.startsWith('/api/') || AUTH_PAGES.includes(pathname)) return null

  return value
}

/** 주소 뒤에 ?next= 를 붙임 (next가 없으면 그대로) */
export function withNext(path: string, next: string | null) {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path
}
