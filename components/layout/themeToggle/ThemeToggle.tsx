'use client'

import { useEffect, useState } from 'react'
import styles from './ThemeToggle.module.css'

/* 다크모드 전환 버튼
   누르면 <html data-theme="dark|light"> 를 바꾸고 브라우저에 기억합니다.
   (새로고침 시 깜빡임 방지 스크립트는 app/layout.tsx 에 있음) */

type Theme = 'light' | 'dark'

/** 현재 화면에 적용된 테마를 알아냄 (직접 고른 값 > 기기 설정) */
function getCurrentTheme(): Theme {
  const chosen = document.documentElement.dataset.theme
  if (chosen === 'light' || chosen === 'dark') return chosen
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
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

export default function ThemeToggle() {
  // 서버에서는 테마를 알 수 없으므로 처음엔 null
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => {
    setTheme(getCurrentTheme())
  }, [])

  const toggleTheme = () => {
    const next: Theme = getCurrentTheme() === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      // 저장이 막힌 환경이면 이번 방문 동안만 유지
    }
    setTheme(next)
  }

  const label = theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      {theme === null && <span className={styles.blank} />}
      {theme === 'dark' && (
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      )}
      {theme === 'light' && (
        <svg {...svgProps}>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  )
}
