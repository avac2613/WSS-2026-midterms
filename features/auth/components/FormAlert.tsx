import type { ReactNode } from 'react'
import styles from './FormAlert.module.css'

/* 폼 안에 띄우는 안내 상자
   <FormAlert>이메일 또는 비밀번호가 올바르지 않아요.</FormAlert>   // 빨강 (기본)
   <FormAlert tone="success">인증번호를 보냈어요.</FormAlert>        // 초록
   <FormAlert tone="warning">주의할 내용</FormAlert>                 // 노랑 */

type Tone = 'error' | 'success' | 'warning'

type FormAlertProps = {
  tone?: Tone
  children: ReactNode
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

const icons: Record<Tone, ReactNode> = {
  error: (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5h.01" />
    </svg>
  ),
  success: (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </svg>
  ),
  warning: (
    <svg {...svgProps}>
      <path d="M10.3 4.2L2.6 17.5a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" />
      <path d="M12 9.5v4M12 17h.01" />
    </svg>
  ),
}

export default function FormAlert({
  tone = 'error',
  children,
}: FormAlertProps) {
  return (
    <div
      className={`${styles.alert} ${styles[tone]}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <span className={styles.icon}>{icons[tone]}</span>
      <div className={styles.message}>{children}</div>
    </div>
  )
}
