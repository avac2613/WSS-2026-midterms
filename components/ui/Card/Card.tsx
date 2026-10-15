import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Card.module.css'

/* 사용법
   import Card from "@/components/ui/Card/Card";
   <Card title="제목" description="설명" action={<Button>버튼</Button>}>내용</Card> */

type CardProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  title?: string
  description?: string
  /** 제목 오른쪽에 들어갈 버튼 등 */
  action?: ReactNode
  /** 카드 맨 아래 영역 (보조 링크 등) */
  footer?: ReactNode
  /** 제목 태그 단계. 페이지의 대표 제목이면 "h1" */
  titleAs?: 'h1' | 'h2' | 'h3'
  /** true면 마우스를 올렸을 때 떠오르는 효과 (클릭 가능한 카드용) */
  interactive?: boolean
  /** "none"이면 안쪽 여백 없음 (이미지 등을 꽉 채울 때) */
  padding?: 'default' | 'none'
}

export default function Card({
  title,
  description,
  action,
  footer,
  titleAs: TitleTag = 'h2',
  interactive = false,
  padding = 'default',
  className,
  children,
  ...rest
}: CardProps) {
  const hasHeader = title || description || action
  const cardClass = [
    styles.card,
    interactive && styles.interactive,
    padding === 'none' && styles.paddingNone,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cardClass} {...rest}>
      {hasHeader && (
        <div className={styles.header}>
          <div className={styles.heading}>
            {title && <TitleTag className={styles.title}>{title}</TitleTag>}
            {description && <p className={styles.description}>{description}</p>}
          </div>
          {action && <div className={styles.action}>{action}</div>}
        </div>
      )}
      {children}
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  )
}
