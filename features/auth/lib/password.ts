import 'server-only'
import {
  randomBytes,
  scrypt,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto'

/* 비밀번호 해시
   - 원문은 저장하지 않고 scrypt(일부러 느리고 메모리를 많이 쓰는 해시)로 바꿔 저장
     → DB가 유출돼도 비밀번호를 하나하나 맞혀 보는 데 오래 걸림
   - 회원마다 다른 무작위 salt를 섞음 → 같은 비밀번호라도 저장 값이 달라짐 (레인보우 테이블 방어)
   - 저장 형식: scrypt$N$r$p$salt$hash
     설정값을 같이 저장해 두어서, 나중에 강도를 올려도 예전 해시를 그대로 검사할 수 있음 */

// OWASP Password Storage Cheat Sheet의 scrypt 권장 설정 중 하나 (N=2^15, r=8, p=3)
const COST = { N: 2 ** 15, r: 8, p: 3 }
const KEY_LENGTH = 32
const SALT_LENGTH = 16
// 위 설정은 메모리를 32MiB 쓰는데 Node.js 기본 한도가 딱 32MiB라 여유 있게 늘림
const MAX_MEMORY = 64 * 1024 * 1024

function scryptAsync(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions,
) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, key) =>
      error ? reject(error) : resolve(key),
    )
  })
}

export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_LENGTH)
  const hash = await scryptAsync(password, salt, KEY_LENGTH, {
    ...COST,
    maxmem: MAX_MEMORY,
  })
  return [
    'scrypt',
    COST.N,
    COST.r,
    COST.p,
    salt.toString('base64'),
    hash.toString('base64'),
  ].join('$')
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, N, r, p, salt, hash] = stored.split('$')
  if (algorithm !== 'scrypt' || !salt || !hash) return false

  const expected = Buffer.from(hash, 'base64')
  const actual = await scryptAsync(
    password,
    Buffer.from(salt, 'base64'),
    expected.length,
    { N: Number(N), r: Number(r), p: Number(p), maxmem: MAX_MEMORY },
  )
  // 처음 몇 글자가 맞는지에 따라 비교 시간이 달라지지 않게 (타이밍 공격 방어)
  return timingSafeEqual(actual, expected)
}

/* 없는 이메일로 로그인할 때도 진짜 비밀번호를 검사하는 만큼 시간을 쓰게 하는 용도
   (응답이 유난히 빠르면 '가입 안 된 이메일'이라는 걸 알아챌 수 있기 때문) */
let dummyHash: Promise<string> | undefined

export async function verifyDummyPassword(password: string) {
  dummyHash ??= hashPassword('dummy-password-for-timing')
  await verifyPassword(password, await dummyHash)
  return false
}
