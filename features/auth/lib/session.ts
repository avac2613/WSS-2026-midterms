import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { cache } from 'react'
import { cookies } from 'next/headers'
import type { NextRequest, NextResponse } from 'next/server'
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
} from '@/features/auth/lib/constants'
import { getDb } from '@/features/auth/lib/db'
import type { VerifyMethod } from '@/features/auth/lib/users'

/* 로그인 세션
   1) 로그인하면 추측할 수 없는 무작위 토큰을 만들어 쿠키로 브라우저에 줌
   2) DB에는 토큰 원문이 아니라 SHA-256 해시만 저장 → DB가 유출돼도 그 값으로는 로그인 불가
   3) 요청이 올 때마다 쿠키의 토큰을 해시해서 DB와 대조
   4) 로그아웃하면 DB에서 지움 → 쿠키를 훔쳐 갔더라도 더는 못 씀

   사용법 (팀원 1·3: 내 자료·요약 API를 만들 때)
   import { getCurrentUser } from "@/features/auth/lib/session";
   const user = await getCurrentUser();
   if (!user?.verified) {
     return Response.json({ message: "로그인이 필요해요." }, { status: 401 });
   }
   // 이후 user.id 로 그 사람의 자료만 조회 (다른 사람 id를 받아서 조회하면 안 됨) */

/** 화면·API에 넘겨도 되는 회원 정보만 (비밀번호 해시 등은 뺌) */
export type SessionUser = {
  id: number
  name: string
  email: string
  phone: string | null
  verified: boolean
  verifyMethod: VerifyMethod | null
}

type SessionUserRow = {
  id: number
  name: string
  email: string
  phone: string | null
  verified_at: number | null
  verify_method: string | null
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

/** 새 세션을 만들고 쿠키에 넣을 토큰을 돌려줌 */
export function createSession(userId: number) {
  const token = randomBytes(32).toString('base64url') // 256비트 무작위 값
  const now = Date.now()
  getDb()
    .prepare(
      'INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
    )
    .run(hashToken(token), userId, now + SESSION_MAX_AGE_SEC * 1000, now)
  return token
}

export function deleteSession(token: string) {
  getDb()
    .prepare('DELETE FROM sessions WHERE token_hash = ?')
    .run(hashToken(token))
}

/** 토큰으로 로그인한 회원 찾기 (없거나 만료됐으면 null) */
export function findSessionUser(token: string): SessionUser | null {
  const row = getDb()
    .prepare(
      `SELECT u.id, u.name, u.email, u.phone, u.verified_at, u.verify_method
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(hashToken(token), Date.now()) as SessionUserRow | undefined
  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    verified: row.verified_at !== null,
    verifyMethod:
      row.verify_method === 'email' || row.verify_method === 'phone'
        ? row.verify_method
        : null,
  }
}

/* ---------- 쿠키 ----------
   배포 모드(npm start)에서는 Secure가 켜져서 https(또는 localhost)에서만 쿠키가 저장돼요.
   휴대폰으로 http://192.168.x.x:3000 처럼 접속해 테스트할 때는 npm run dev로 여세요. */
const cookieOptions = {
  httpOnly: true, // 자바스크립트(document.cookie)로 못 읽음 → XSS가 생겨도 세션을 못 훔침
  secure: process.env.NODE_ENV === 'production', // 배포(https)에서는 암호화된 연결로만 전송
  sameSite: 'lax' as const, // 다른 사이트에서 보낸 POST에는 쿠키가 안 붙음 → CSRF 방어
  path: '/',
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    ...cookieOptions,
    maxAge: SESSION_MAX_AGE_SEC,
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, '', { ...cookieOptions, maxAge: 0 })
}

/* ---------- 현재 로그인한 회원 ---------- */
/** API(route.ts)에서: 요청에 붙어 온 쿠키로 확인 */
export function getRequestUser(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  return token ? findSessionUser(token) : null
}

/** 페이지·레이아웃(서버 컴포넌트)과 API 어디서나 사용 가능
    (cache: 한 번 화면을 그리는 동안 여러 곳에서 불러도 DB 조회는 한 번만) */
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  return token ? findSessionUser(token) : null
})
