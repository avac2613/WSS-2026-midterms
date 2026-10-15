import Link from 'next/link'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import Spinner from '@/components/ui/Spinner/Spinner'
import styles from './Button.module.css'

/* 사용법
   import Button, { LinkButton } from "@/components/ui/Button/Button";
   <Button onClick={...}>저장</Button>                 // 일반 버튼
   <LinkButton href="/ai">요약하러 가기</LinkButton>   // 페이지 이동 버튼 */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type CommonProps = {
  /** primary: 주요 행동 / secondary: 보조 / ghost: 배경 없음 / danger: 삭제 등 */
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  /** 글자 왼쪽에 들어갈 아이콘 */
  leftIcon?: ReactNode
}

function buttonClass(
  variant: Variant,
  size: Size,
  fullWidth: boolean,
  className?: string,
) {
  return [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

/* ---------- 일반 버튼 ---------- */
type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    /** true면 스피너가 돌고 클릭이 막힙니다 */
    loading?: boolean
  }

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, fullWidth, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : leftIcon}
      {children}
    </button>
  )
}

/* ---------- 링크 버튼 (페이지 이동용) ---------- */
type LinkButtonProps = CommonProps & {
  href: string
  className?: string
  children: ReactNode
}

export function LinkButton({
  href,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  className,
  children,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={buttonClass(variant, size, fullWidth, className)}
    >
      {leftIcon}
      {children}
    </Link>
  )
}
