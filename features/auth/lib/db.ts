import 'server-only'
import mongoose, { Schema, type Model, type Types } from 'mongoose'
import connectMongoDB from '@/lib/mongodb'

/* 로그인 기능 데이터베이스 (MongoDB)
   - 원래는 프로젝트 폴더의 SQLite 파일(data/app.db)에 저장했지만,
     Vercel 서버는 프로젝트 폴더에 파일을 쓸 수 없어서 자료실과 같은 MongoDB로 옮겼어요.
   - 연결 주소는 자료실과 같은 MONGODB_URI 환경 변수를 씁니다. (lib/mongodb.ts)
   - 쿼리에는 항상 값만 넘기고, 사용자가 보낸 객체를 그대로 조건에 넣지 않아요.
       좋은 예: User.findOne({ email })          ← email은 문자열로 검사한 값
       나쁜 예: User.findOne(request.body)       ← { "$ne": null } 같은 값이 들어올 수 있음 */

/* ---------- 회원 ---------- */
export type UserDoc = {
  _id: Types.ObjectId
  name: string
  email: string // 소문자로 통일해서 저장
  passwordHash: string // 비밀번호 원문은 저장하지 않음
  phone?: string // 휴대폰으로 본인인증했을 때만 저장
  verifiedAt: Date | null // 본인인증한 시각 (null이면 아직 안 함)
  verifyMethod: 'email' | 'phone' | null
  createdAt: Date
}

const UserSchema = new Schema<UserDoc>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  phone: { type: String },
  verifiedAt: { type: Date, default: null },
  verifyMethod: { type: String, default: null },
  createdAt: { type: Date, required: true },
})
// 번호가 있는 회원끼리만 중복 금지 (번호 없는 회원은 여러 명이어도 됨)
UserSchema.index(
  { phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $type: 'string' } } },
)

/* ---------- 로그인 세션 (쿠키 값의 해시만 저장) ---------- */
export type SessionDoc = {
  tokenHash: string
  userId: Types.ObjectId
  expiresAt: Date
  createdAt: Date
}

const SessionSchema = new Schema<SessionDoc>({
  tokenHash: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, required: true },
})
// 만료 시각이 지나면 MongoDB가 자동으로 지움 (청소용, 만료 확인은 코드에서도 함)
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

/* ---------- 본인인증 인증번호 (회원마다 가장 최근 것 하나만) ---------- */
export type VerificationCodeDoc = {
  userId: Types.ObjectId
  method: 'email' | 'phone'
  target: string // 받은 이메일 또는 휴대폰 번호
  codeHash: string
  attempts: number // 틀린 횟수
  expiresAt: Date
  sentAt: Date
}

const VerificationCodeSchema = new Schema<VerificationCodeDoc>({
  userId: { type: Schema.Types.ObjectId, required: true, unique: true },
  method: { type: String, required: true },
  target: { type: String, required: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true },
  sentAt: { type: Date, required: true },
})
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

/* ---------- 요청 횟수 제한 기록 ---------- */
export type RateLimitDoc = { key: string; count: number; resetAt: Date }

const RateLimitSchema = new Schema<RateLimitDoc>({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true },
  resetAt: { type: Date, required: true },
})
RateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 })

/* 개발 서버가 코드를 다시 불러와도 모델을 두 번 만들지 않도록 */
function model<T>(name: string, schema: Schema<T>, collection: string) {
  return (
    (mongoose.models[name] as Model<T> | undefined) ??
    mongoose.model<T>(name, schema, collection)
  )
}

export const User = model('AuthUser', UserSchema, 'users')
export const Session = model('AuthSession', SessionSchema, 'sessions')
export const VerificationCode = model(
  'AuthVerificationCode',
  VerificationCodeSchema,
  'verification_codes',
)
export const RateLimit = model('AuthRateLimit', RateLimitSchema, 'rate_limits')

/* DB에 연결하고, 중복 금지(unique) 인덱스가 만들어질 때까지 기다림
   (인덱스가 없으면 같은 이메일로 동시에 가입하는 걸 막지 못하므로 처음 한 번은 확인) */
let ready: Promise<void> | null = null
export async function connectAuthDb() {
  await connectMongoDB()
  ready ??= Promise.all([
    User.init(),
    Session.init(),
    VerificationCode.init(),
    RateLimit.init(),
  ]).then(() => undefined)
  try {
    await ready
  } catch (error) {
    ready = null // 실패했으면 다음 요청에서 다시 시도
    throw error
  }
}

/** 중복 금지 위반인지 (같은 이메일·번호가 이미 있을 때 나는 오류) */
export function isUniqueViolation(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 11000
  )
}
