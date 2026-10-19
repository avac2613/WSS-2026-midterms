import 'server-only'
import { getDb } from '@/features/auth/lib/db'

/* 회원 정보 읽기·쓰기 (users 테이블은 이 파일에서만 다룸)
   나중에 MySQL 등으로 바꾸더라도 이 파일 안쪽만 고치면 되도록 모아 두었습니다. */

export type VerifyMethod = 'email' | 'phone'

export type UserRecord = {
  id: number
  name: string
  email: string
  passwordHash: string
  phone: string | null
  verifiedAt: number | null
  verifyMethod: VerifyMethod | null
}

type UserRow = {
  id: number
  name: string
  email: string
  password_hash: string
  phone: string | null
  verified_at: number | null
  verify_method: string | null
}

function toUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    phone: row.phone,
    verifiedAt: row.verified_at,
    verifyMethod:
      row.verify_method === 'email' || row.verify_method === 'phone'
        ? row.verify_method
        : null,
  }
}

export function findUserByEmail(email: string) {
  const row = getDb()
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email) as UserRow | undefined
  return row ? toUser(row) : null
}

/** 새 회원을 만들고 id를 돌려줌 (이메일이 이미 있으면 UNIQUE 오류가 남) */
export function createUser(input: {
  name: string
  email: string
  passwordHash: string
}) {
  const result = getDb()
    .prepare(
      'INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
    )
    .run(input.name, input.email, input.passwordHash, Date.now())
  return Number(result.lastInsertRowid)
}

/** 다른 회원이 이미 이 번호로 본인인증했는지 (한 번호로 여러 계정 인증 방지) */
export function isPhoneTaken(phone: string, exceptUserId: number) {
  return Boolean(
    getDb()
      .prepare('SELECT 1 FROM users WHERE phone = ? AND id != ?')
      .get(phone, exceptUserId),
  )
}

/** 본인인증 완료 처리 (휴대폰으로 인증했으면 번호도 저장) */
export function markVerified(
  userId: number,
  method: VerifyMethod,
  target: string,
) {
  const db = getDb()
  if (method === 'phone') {
    db.prepare(
      'UPDATE users SET verified_at = ?, verify_method = ?, phone = ? WHERE id = ?',
    ).run(Date.now(), method, target, userId)
  } else {
    db.prepare(
      'UPDATE users SET verified_at = ?, verify_method = ? WHERE id = ?',
    ).run(Date.now(), method, userId)
  }
}

/** 마이페이지 표시용 회원 정보 (비밀번호 해시는 아예 꺼내지 않음) */
export type UserProfile = {
  name: string
  email: string
  phone: string | null
  verifiedAt: number | null
  verifyMethod: VerifyMethod | null
  createdAt: number
}

type UserProfileRow = {
  name: string
  email: string
  phone: string | null
  verified_at: number | null
  verify_method: string | null
  created_at: number
}

export function findUserProfile(userId: number): UserProfile | null {
  const row = getDb()
    .prepare(
      `SELECT name, email, phone, verified_at, verify_method, created_at
         FROM users WHERE id = ?`,
    )
    .get(userId) as UserProfileRow | undefined
  if (!row) return null

  return {
    name: row.name,
    email: row.email,
    phone: row.phone,
    verifiedAt: row.verified_at,
    verifyMethod:
      row.verify_method === 'email' || row.verify_method === 'phone'
        ? row.verify_method
        : null,
    createdAt: row.created_at,
  }
}
