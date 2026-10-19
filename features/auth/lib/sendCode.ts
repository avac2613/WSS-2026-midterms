import 'server-only'
import { CODE_TTL_SEC } from '@/features/auth/lib/constants'
import type { VerifyMethod } from '@/features/auth/lib/users'
import { formatPhone } from '@/features/auth/lib/validation'

/* 인증번호 발송
   실제 문자·메일을 보내려면 발송 서비스와 계약(API 키)이 필요해서,
   지금은 개발 서버 터미널(npm run dev 창)에 인증번호를 출력합니다.

   실제 발송을 붙이려면 아래 TODO 자리에서 서비스 API를 호출하고
   { devMode: false } 를 돌려주면 됩니다.
     - 문자: 네이버 클라우드 SENS, CoolSMS 등
     - 메일: Gmail SMTP(nodemailer), Resend 등

   배포 모드(npm start)에서는 인증번호가 서버 로그에 남지 않도록 터미널 출력을 막아 둡니다.
   발표 등으로 꼭 필요하면 .env.local 에 AUTH_PRINT_CODE=true 를 넣으세요. */

export async function sendVerificationCode(
  method: VerifyMethod,
  target: string,
  code: string,
) {
  // TODO(실제 발송): 문자/메일 발송 API 호출 → return { devMode: false }

  const canPrint =
    process.env.NODE_ENV !== 'production' ||
    process.env.AUTH_PRINT_CODE === 'true'
  if (!canPrint) {
    throw new Error('인증번호 발송 수단이 설정되지 않았습니다. (sendCode.ts)')
  }

  const to = method === 'phone' ? `휴대폰 ${formatPhone(target)}` : target
  console.info(
    `\n[본인인증] ${to} 로 보낼 인증번호: ${code}  (${CODE_TTL_SEC / 60}분 안에 입력)\n`,
  )
  return { devMode: true }
}
