'use client'

import { useCallback, useState, type ReactNode } from 'react'
import Header from '@/components/layout/header/Header'
import Sidebar from '@/components/layout/sidebar/Sidebar'
import styles from './layout.module.css'

/* AI 요약, 자료실, 마이페이지 공통 레이아웃: 헤더 + 사이드바 + 본문 */
export default function MainLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  return (
    <div className={styles.shell}>
      <a href="#main-content" className={styles.skipLink}>
        본문으로 건너뛰기
      </a>

      {/* TODO(팀원 2): 로그인 상태를 isLoggedIn, userName, onLogout으로 연결 */}
      <Header onMenuClick={() => setSidebarOpen(true)} isLoggedIn={false} />

      <div className={styles.body}>
        <Sidebar open={sidebarOpen} onClose={closeSidebar} />
        <main id="main-content" className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  )
}
