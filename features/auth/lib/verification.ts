import 'server-only'
import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import {
  CODE_LENGTH,
  CODE_MAX_ATTEMPTS,
  CODE_RESEND_SEC,
  CODE_TTL_SEC,
} from '@/features/auth/lib/constants'
import {
  connectAuthDb,
  VerificationCode,
  type VerificationCodeDoc,
} from '@/features/auth/lib/db'
import type { VerifyMethod } from '@/features/auth/lib/users'
import { formatPhone } from '@/features/auth/lib/validation'

/* 본인인증 인증번호
   - 예측할 수 없는 난수(crypto.randomInt)로 만듦 (Math.random은 예측 가능해서 보안용 X)
   - 원문은 발송에만 쓰고 DB에는 해시만 저장
   - 5분이 지나거나 5번 틀리면 폐기, 맞히면 바로 삭제 (한 번만 사용 가능) */

function hashCode(userId: string, code: string) {
  return createHash('sha256').update(`${userId}:${code}`).digest('hex')
}

async function findCode(userId: string) {
  await connectAuthDb()
  return VerificationCode.findOne({ userId }).lean<VerificationCodeDoc>()
}

export async function discardCode(userId: string) {
  await connectAuthDb()
  await VerificationCode.deleteOne({ userId })
}

function waitSecOf(row: VerificationCodeDoc | null) {
  if (!row) return 0
  const waitMs = row.sentAt.getTime() + CODE_RESEND_SEC * 1000 - Date.now()
  return waitMs > 0 ? Math.ceil(waitMs / 1000) : 0
}

/** 다시 받으려면 몇 초 더 기다려야 하는지 (0이면 바로 가능) */
export async function getResendWaitSec(userId: string) {
  return waitSecOf(await findCode(userId))
}

/** 아직 유효한 인증번호가 있으면 화면에 다시 보여 줄 정보 (인증번호 자체는 X) */
export async function getPendingCode(userId: string) {
  const row = await findCode(userId)
  const now = Date.now()
  if (!row || row.expiresAt.getTime() <= now) return null
  return {
    method: row.method,
    target: row.method === 'phone' ? formatPhone(row.target) : row.target,
    expiresIn: Math.ceil((row.expiresAt.getTime() - now) / 1000),
    resendIn: waitSecOf(row),
  }
}

/** 새 인증번호를 만들어 저장하고 원문을 돌려줌 (이전 번호는 무효가 됨) */
export async function issueCode(
  userId: string,
  method: VerifyMethod,
  target: string,
) {
  const code = randomInt(0, 10 ** CODE_LENGTH)
    .toString()
    .padStart(CODE_LENGTH, '0')
  const now = Date.now()
  await connectAuthDb()
  await VerificationCode.replaceOne(
    { userId },
    {
      userId,
      method,
      target,
      codeHash: hashCode(userId, code),
      attempts: 0,
      expiresAt: new Date(now + CODE_TTL_SEC * 1000),
      sentAt: new Date(now),
    },
    { upsert: true },
  )
  return code
}

export type CodeCheck =
  | { ok: true; method: VerifyMethod; target: string }
  | { ok: false; reason: 'missing' | 'expired' | 'locked' }
  | { ok: false; reason: 'mismatch'; remainingAttempts: number }

/** 입력한 인증번호 확인 */
export async function checkCode(
  userId: string,
  code: string,
): Promise<CodeCheck> {
  const row = await findCode(userId)
  if (!row) return { ok: false, reason: 'missing' }

  if (row.expiresAt.getTime() <= Date.now()) {
    await discardCode(userId)
    return { ok: false, reason: 'expired' }
  }

  const expected = Buffer.from(row.codeHash, 'hex')
  const actual = Buffer.from(hashCode(userId, code), 'hex')
  if (!timingSafeEqual(expected, actual)) {
    // 동시에 여러 번 보내도 횟수가 빠짐없이 올라가도록 DB에서 직접 1 증가
    const updated = await VerificationCode.findOneAndUpdate(
      { userId },
      { $inc: { attempts: 1 } },
      { new: true },
    ).lean<VerificationCodeDoc>()
    const attempts = updated?.attempts ?? CODE_MAX_ATTEMPTS
    if (attempts >= CODE_MAX_ATTEMPTS) {
      await discardCode(userId)
      return { ok: false, reason: 'locked' }
    }
    return {
      ok: false,
      reason: 'mismatch',
      remainingAttempts: CODE_MAX_ATTEMPTS - attempts,
    }
  }

  // 맞혔으면 바로 삭제 (한 번만 사용 가능). 동시에 두 번 맞혀도 하나만 통과
  const deleted = await VerificationCode.deleteOne({
    userId,
    codeHash: row.codeHash,
  })
  if (deleted.deletedCount === 0) return { ok: false, reason: 'missing' }
  return { ok: true, method: row.method, target: row.target }
}
