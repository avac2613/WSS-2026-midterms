import 'server-only'
import { connectAuthDb, User, type UserDoc } from '@/features/auth/lib/db'

/* 회원 정보 읽기·쓰기 (users 컬렉션은 이 파일에서만 다룸)
   나중에 다른 DB로 바꾸더라도 이 파일 안쪽만 고치면 되도록 모아 두었습니다. */

export type VerifyMethod = 'email' | 'phone'

export type UserRecord = {
  id: string
  name: string
  email: string
  passwordHash: string
  phone: string | null
  verifiedAt: number | null
  verifyMethod: VerifyMethod | null
}

function toVerifyMethod(value: unknown): VerifyMethod | null {
  return value === 'email' || value === 'phone' ? value : null
}

function toUser(doc: UserDoc): UserRecord {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash,
    phone: doc.phone ?? null,
    verifiedAt: doc.verifiedAt ? doc.verifiedAt.getTime() : null,
    verifyMethod: toVerifyMethod(doc.verifyMethod),
  }
}

export async function findUserByEmail(email: string) {
  await connectAuthDb()
  const doc = await User.findOne({ email: String(email) }).lean<UserDoc>()
  return doc ? toUser(doc) : null
}

/** 새 회원을 만들고 id를 돌려줌 (이메일이 이미 있으면 중복 오류가 남) */
export async function createUser(input: {
  name: string
  email: string
  passwordHash: string
}) {
  await connectAuthDb()
  const doc = await User.create({
    name: input.name,
    email: input.email,
    passwordHash: input.passwordHash,
    createdAt: new Date(),
  })
  return String(doc._id)
}

/** 다른 회원이 이미 이 번호로 본인인증했는지 (한 번호로 여러 계정 인증 방지) */
export async function isPhoneTaken(phone: string, exceptUserId: string) {
  await connectAuthDb()
  return Boolean(
    await User.exists({ phone: String(phone), _id: { $ne: exceptUserId } }),
  )
}

/** 본인인증 완료 처리 (휴대폰으로 인증했으면 번호도 저장) */
export async function markVerified(
  userId: string,
  method: VerifyMethod,
  target: string,
) {
  await connectAuthDb()
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        verifiedAt: new Date(),
        verifyMethod: method,
        ...(method === 'phone' ? { phone: target } : {}),
      },
    },
  )
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

export async function findUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  await connectAuthDb()
  const doc = await User.findById(userId)
    .select('name email phone verifiedAt verifyMethod createdAt')
    .lean<Omit<UserDoc, 'passwordHash'>>()
  if (!doc) return null

  return {
    name: doc.name,
    email: doc.email,
    phone: doc.phone ?? null,
    verifiedAt: doc.verifiedAt ? doc.verifiedAt.getTime() : null,
    verifyMethod: toVerifyMethod(doc.verifyMethod),
    createdAt: doc.createdAt.getTime(),
  }
}
