'use client'

import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import styles from './Input.module.css'

/* 사용법
   import Input from "@/components/ui/Input/Input";
   <Input label="이메일" type="email" hint="학교 이메일을 입력하세요" />
   <Input label="비밀번호" type="password" error="비밀번호가 올바르지 않아요" /> */

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** 입력창 위에 표시되는 이름 */
  label?: string
  /** 입력창 아래 안내 문구 */
  hint?: string
  /** 값이 있으면 빨간 테두리 + 에러 문구로 표시 (hint보다 우선) */
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, id, className, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const messageId = `${inputId}-message`
  const message = error ?? hint

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={error ? `${styles.input} ${styles.invalid}` : styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        {...rest}
      />
      {message && (
        <p
          id={messageId}
          className={
            error ? `${styles.message} ${styles.errorMessage}` : styles.message
          }
        >
          {message}
        </p>
      )}
    </div>
  )
})

export default Input
