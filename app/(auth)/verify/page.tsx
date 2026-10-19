import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Card from '@/components/ui/Card/Card'
import LogoutButton from '@/features/auth/components/LogoutButton'
import VerifyForm from '@/features/auth/components/VerifyForm'
import { AFTER_VERIFY_PATH } from '@/features/auth/lib/constants'
import { safeNextPath } from '@/features/auth/lib/redirect'
import { getCurrentUser } from '@/features/auth/lib/session'
import { getPendingCode } from '@/features/auth/lib/verification'

export const metadata: Metadata = { title: '본인인증' }

type Props = {
  searchParams: Promise<{ next?: string | string[] }>
}

export default async function VerifyPage({ searchParams }: Props) {
  const next = safeNextPath((await searchParams).next)

  // 인증 결과를 계정에 저장해야 하므로 로그인한 상태여야 함
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.verified) redirect(next ?? AFTER_VERIFY_PATH)

  return (
    <Card
      titleAs="h1"
      title="본인인증"
      description="안전한 이용을 위해 본인인증을 진행해 주세요."
      footer={
        <>
          다른 계정으로 로그인하려면 <LogoutButton />
        </>
      }
    >
      <VerifyForm
        email={user.email}
        next={next}
        pending={getPendingCode(user.id)}
      />
    </Card>
  )
}
