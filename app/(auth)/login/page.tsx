import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Card from '@/components/ui/Card/Card'
import LoginForm from '@/features/auth/components/LoginForm'
import { AFTER_LOGIN_PATH } from '@/features/auth/lib/constants'
import { safeNextPath, withNext } from '@/features/auth/lib/redirect'
import { getCurrentUser } from '@/features/auth/lib/session'

export const metadata: Metadata = { title: '로그인' }

type Props = {
  searchParams: Promise<{ next?: string | string[] }>
}

export default async function LoginPage({ searchParams }: Props) {
  const next = safeNextPath((await searchParams).next)

  // 이미 로그인했으면 로그인 화면을 보여 줄 필요가 없음
  const user = await getCurrentUser()
  if (user) {
    redirect(
      user.verified ? (next ?? AFTER_LOGIN_PATH) : withNext('/verify', next),
    )
  }

  return (
    <Card
      titleAs="h1"
      title="로그인"
      description="계정에 로그인하고 요약한 자료를 이어서 확인하세요."
      footer={
        <>
          아직 계정이 없나요?{' '}
          <Link href={withNext('/signup', next)}>회원가입</Link>
        </>
      }
    >
      <LoginForm next={next} />
    </Card>
  )
}
