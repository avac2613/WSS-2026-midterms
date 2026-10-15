'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import styles from './Sidebar.module.css'

type SidebarProps = {
  /** 모바일에서 열려 있는지 (데스크톱에서는 항상 보임) */
  open: boolean
  onClose: () => void
}

const svgProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

/* 사이드바 메뉴 목록: 메뉴를 추가하려면 여기에 한 줄 추가 */
const menuItems: { label: string; href: string; icon: ReactNode }[] = [
  {
    label: 'AI 요약하기',
    href: '/ai',
    icon: (
      <svg {...svgProps}>
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
        <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
      </svg>
    ),
  },
  {
    label: '내 자료실',
    href: '/library',
    icon: (
      <svg {...svgProps}>
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    ),
  },
  {
    label: '마이페이지',
    href: '/mypage',
    icon: (
      <svg {...svgProps}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),
  },
]

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  // 모바일에서 열려 있을 때 Esc 키로 닫기
  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  return (
    <>
      <div
        className={
          open ? `${styles.overlay} ${styles.overlayVisible}` : styles.overlay
        }
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        id="app-sidebar"
        className={open ? `${styles.sidebar} ${styles.open}` : styles.sidebar}
        aria-label="주 메뉴"
      >
        <div className={styles.mobileTop}>
          <span className={styles.mobileTitle}>메뉴</span>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="메뉴 닫기"
          >
            <svg {...svgProps}>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav>
          <ul className={styles.list}>
            {menuItems.map((item) => {
              // 하위 페이지(/library/123 등)에 있어도 상위 메뉴를 강조
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={
                      active ? `${styles.link} ${styles.active}` : styles.link
                    }
                    aria-current={active ? 'page' : undefined}
                    onClick={onClose}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
    </>
  )
}
