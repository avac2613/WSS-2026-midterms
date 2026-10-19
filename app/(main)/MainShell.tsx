'use client'

import { useCallback, useState, type ReactNode } from 'react'
import Sidebar from '@/components/layout/sidebar/Sidebar'
import AuthHeader from '@/features/auth/components/AuthHeader'
import styles from './layout.module.css'

type MainShellProps = {
  /** 헤더에 표시할 이름 (layout.tsx에서 로그인 확인 후 넘김) */
  userName: string
  children: ReactNode
}

/* 헤더 + 사이드바 + 본문 틀 (원래 layout.tsx에 있던 내용) */
export default function MainShell({ userName, children }: MainShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  return (
    <div className={styles.shell}>
      <a href="#main-content" className={styles.skipLink}>
        본문으로 건너뛰기
      </a>

      <AuthHeader
        userName={userName}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <div className={styles.body}>
        <Sidebar open={sidebarOpen} onClose={closeSidebar} />
        <main id="main-content" className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  )
}
