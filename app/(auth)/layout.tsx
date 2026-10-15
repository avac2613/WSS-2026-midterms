import type { ReactNode } from 'react'
import Header from '@/components/layout/header/Header'
import PageContainer from '@/components/layout/pageContainer/PageContainer'

/* 로그인·회원가입·본인인증 화면 공통 레이아웃 (사이드바 없음, 가운데 정렬) */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header variant="minimal" />
      <main>
        <PageContainer width="auth">{children}</PageContainer>
      </main>
    </>
  )
}
