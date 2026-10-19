'use client'

import { useLogout } from '@/features/auth/lib/useLogout'
import styles from './AuthForm.module.css'

/* 글자처럼 보이는 로그아웃 버튼 (카드 꼬리말 등에 사용)
   <LogoutButton />  */
export default function LogoutButton() {
  const logout = useLogout()

  return (
    <button type="button" className={styles.linkButton} onClick={logout}>
      로그아웃
    </button>
  )
}
