import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/features/auth/lib/session'
import MainShell from './MainShell'

/* AI 요약, 자료실, 마이페이지 공통 레이아웃: 헤더 + 사이드바 + 본문
   로그인하고 본인인증까지 마친 사람만 들어올 수 있어요.
   (화면 틀은 사이드바 열림 상태 때문에 클라이언트 컴포넌트인 MainShell.tsx 로 분리) */
export default async function MainLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.verified) redirect('/verify')

  return <MainShell userName={user.name}>{children}</MainShell>
}
