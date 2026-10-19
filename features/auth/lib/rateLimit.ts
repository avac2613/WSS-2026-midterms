import 'server-only'
import {
  connectAuthDb,
  isUniqueViolation,
  RateLimit,
} from '@/features/auth/lib/db'

/* 요청 횟수 제한 (비밀번호 무차별 대입, 인증번호 문자 폭탄 등 방지)
   - key마다 정해진 시간(windowMs) 동안 limit번까지만 허용
   - DB에 기록하므로 서버를 다시 켜거나 Vercel 서버가 여러 대여도 공유됨
   - 횟수 증가는 DB에서 한 번에 처리해서, 동시에 요청이 몰려도 limit을 넘지 않음 */

export type LimitResult = { allowed: boolean; retryAfterSec: number }

function blocked(resetAt: Date, now: number): LimitResult {
  return {
    allowed: false,
    retryAfterSec: Math.max(1, Math.ceil((resetAt.getTime() - now) / 1000)),
  }
}

/** 1회 사용으로 기록하고, 이미 다 썼으면 allowed: false */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  retried = false,
): Promise<LimitResult> {
  const now = Date.now()
  await connectAuthDb()

  // 1) 아직 유효한 기록이 있고 한도 미만이면 1 증가
  const updated = await RateLimit.findOneAndUpdate(
    { key, resetAt: { $gt: new Date(now) }, count: { $lt: limit } },
    { $inc: { count: 1 } },
    { new: true },
  ).lean()
  if (updated) return { allowed: true, retryAfterSec: 0 }

  // 2) 유효한 기록이 있는데 위에서 못 올렸다면 한도를 다 쓴 것
  const current = await RateLimit.findOne({
    key,
    resetAt: { $gt: new Date(now) },
  }).lean()
  if (current) return blocked(current.resetAt, now)

  // 3) 기록이 없거나 시간이 지났으면 새로 시작
  try {
    await RateLimit.updateOne(
      { key },
      { $set: { count: 1, resetAt: new Date(now + windowMs) } },
      { upsert: true },
    )
  } catch (error) {
    // 같은 key를 동시에 새로 만들면 한쪽이 중복 오류 → 처음부터 한 번 더
    if (!retried && isUniqueViolation(error)) {
      return consumeRateLimit(key, limit, windowMs, true)
    }
    throw error
  }
  return { allowed: true, retryAfterSec: 0 }
}

/** 기록은 남기지 않고 이미 막혔는지만 확인 */
export async function checkRateLimit(
  key: string,
  limit: number,
): Promise<LimitResult> {
  const now = Date.now()
  await connectAuthDb()
  const row = await RateLimit.findOne({
    key,
    resetAt: { $gt: new Date(now) },
  }).lean()
  if (!row || row.count < limit) return { allowed: true, retryAfterSec: 0 }
  return blocked(row.resetAt, now)
}

export async function resetRateLimit(key: string) {
  await connectAuthDb()
  await RateLimit.deleteOne({ key })
}
