import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Card from '@/components/ui/Card/Card'
import SignupForm from '@/features/auth/components/SignupForm'
import { AFTER_LOGIN_PATH } from '@/features/auth/lib/constants'
import { safeNextPath, withNext } from '@/features/auth/lib/redirect'
import { getCurrentUser } from '@/features/auth/lib/session'

export const metadata: Metadata = { title: '회원가입' }

type Props = {
  searchParams: Promise<{ next?: string | string[] }>
}

export default async function SignupPage({ searchParams }: Props) {
  const next = safeNextPath((await searchParams).next)

  // 이미 로그인했으면 가입할 필요가 없음
  const user = await getCurrentUser()
  if (user) {
    redirect(
      user.verified ? (next ?? AFTER_LOGIN_PATH) : withNext('/verify', next),
    )
  }

  return (
    <Card
      titleAs="h1"
      title="회원가입"
      description="가입하면 요약한 자료를 저장하고 분류할 수 있어요."
      footer={
        <>
          이미 계정이 있나요?{' '}
          <Link href={withNext('/login', next)}>로그인</Link>
        </>
      }
    >
      <SignupForm next={next} />
    </Card>
  )
}
