'use client'

import type { ComponentProps } from 'react'
import Header from '@/components/layout/header/Header'
import { useLogout } from '@/features/auth/lib/useLogout'

type AuthHeaderProps = Omit<
  ComponentProps<typeof Header>,
  'isLoggedIn' | 'userName' | 'onLogout'
> & {
  /** 로그인한 사람의 이름 (넘기지 않으면 로그아웃 상태로 표시) */
  userName?: string
}

/* 로그인 상태를 연결한 Header
   로그인했으면 "OOO님 · 로그아웃", 아니면 "로그인 · 회원가입" 버튼이 보여요.
   서버 컴포넌트에서는 onLogout 같은 함수를 넘길 수 없어서 이 컴포넌트로 감쌌습니다. */
export default function AuthHeader({
  userName,
  ...headerProps
}: AuthHeaderProps) {
  const logout = useLogout()

  return (
    <Header
      {...headerProps}
      isLoggedIn={userName !== undefined}
      userName={userName}
      onLogout={logout}
    />
  )
}
