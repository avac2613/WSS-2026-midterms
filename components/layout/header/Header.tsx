import Link from 'next/link'
import Button, { LinkButton } from '@/components/ui/Button/Button'
import ThemeToggle from '@/components/layout/themeToggle/ThemeToggle'
import styles from './Header.module.css'

/** 서비스 이름: 정해지면 여기만 바꾸면 헤더와 브라우저 탭 제목에 모두 반영돼요 */
export const SITE_NAME = 'StudyNote'

type HeaderProps = {
  /** full: 로그인 버튼까지 표시 / minimal: 로고와 다크모드 버튼만 (로그인 화면용) */
  variant?: 'full' | 'minimal'
  /** 넘기면 모바일에서 사이드바 여는 버튼(☰)이 나타납니다 */
  onMenuClick?: () => void
  /* ---- 아래 세 값은 로그인 기능(팀원 2)과 연결 ---- */
  isLoggedIn?: boolean
  userName?: string
  onLogout?: () => void
}

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export default function Header({
  variant = 'full',
  onMenuClick,
  isLoggedIn = false,
  userName,
  onLogout,
}: HeaderProps) {
  return (
    <header
      className={
        variant === 'minimal'
          ? `${styles.header} ${styles.minimal}`
          : styles.header
      }
    >
      <div className={styles.left}>
        {onMenuClick && (
          <button
            type="button"
            className={styles.menuButton}
            onClick={onMenuClick}
            aria-label="메뉴 열기"
            aria-controls="app-sidebar"
          >
            <svg {...svgProps} width={20} height={20}>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark}>
            <svg {...svgProps} width={18} height={18}>
              <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <path d="M14 3v6h6M8 13h8M8 17h5" />
            </svg>
          </span>
          <span>{SITE_NAME}</span>
        </Link>
      </div>

      <div className={styles.right}>
        <ThemeToggle />
        {variant === 'full' &&
          (isLoggedIn ? (
            <>
              {userName && (
                <span className={styles.userName}>{userName}님</span>
              )}
              <Button variant="ghost" size="sm" onClick={onLogout}>
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <LinkButton href="/login" variant="ghost" size="sm">
                로그인
              </LinkButton>
              <LinkButton href="/signup" size="sm" className={styles.signup}>
                회원가입
              </LinkButton>
            </>
          ))}
      </div>
    </header>
  )
}
