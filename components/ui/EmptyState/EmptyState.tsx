import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

/* 사용법
   import EmptyState from "@/components/ui/EmptyState/EmptyState";
   <EmptyState title="아직 자료가 없어요" description="..." action={<LinkButton ... />} />
   <EmptyState variant="placeholder" title="업로드 영역" />   // 개발 전 자리 표시 */

type EmptyStateProps = {
  title: string
  description?: string
  /** 제목 위 동그라미 안에 들어갈 아이콘이나 스피너 */
  icon?: ReactNode
  /** 안내 아래에 들어갈 버튼 등 */
  action?: ReactNode
  /**
   * default: "아직 자료가 없어요" 같은 실제 빈 화면 안내
   * placeholder: 아직 개발 전인 영역 표시용 점선 박스
   */
  variant?: 'default' | 'placeholder'
  /** true면 화면 높이의 60%를 차지 (에러·로딩·404 화면용) */
  fullHeight?: boolean
  className?: string
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
  variant = 'default',
  fullHeight = false,
  className,
}: EmptyStateProps) {
  const emptyClass = [
    styles.empty,
    variant === 'placeholder' && styles.placeholder,
    fullHeight && styles.fullHeight,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={emptyClass}>
      {icon && <span className={styles.iconWrap}>{icon}</span>}
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
