import type { ReactNode } from 'react'
import styles from './PageContainer.module.css'

/* 모든 페이지 본문을 감싸 여백·최대 너비·제목 위치를 통일합니다.
   import PageContainer from "@/components/layout/pageContainer/PageContainer";
   <PageContainer title="내 자료실" description="..." actions={<버튼 />}>
     내용
   </PageContainer> */

type PageContainerProps = {
  title?: string
  description?: string
  /** 제목 오른쪽에 놓일 버튼 등 */
  actions?: ReactNode
  /**
   * default: 일반 페이지 (최대 1200px)
   * narrow: 좁은 페이지 (마이페이지 등, 최대 720px)
   * auth: 로그인·회원가입용 (최대 420px, 화면 가운데)
   */
  width?: 'default' | 'narrow' | 'auth'
  children: ReactNode
}

export default function PageContainer({
  title,
  description,
  actions,
  width = 'default',
  children,
}: PageContainerProps) {
  const containerClass = [
    styles.container,
    width === 'narrow' && styles.narrow,
    width === 'auth' && styles.auth,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={containerClass}>
      {(title || actions) && (
        <div className={styles.header}>
          <div className={styles.heading}>
            {title && <h1>{title}</h1>}
            {description && <p className={styles.description}>{description}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
      <div className={styles.content}>{children}</div>
    </div>
  )
}
