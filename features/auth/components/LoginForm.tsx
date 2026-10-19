'use client'

import { useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button/Button'
import Input from '@/components/ui/Input/Input'
import { useToast } from '@/components/ui/Toast/Toast'
import FormAlert from '@/features/auth/components/FormAlert'
import { AFTER_LOGIN_PATH } from '@/features/auth/lib/constants'
import { postJson } from '@/features/auth/lib/postJson'
import { withNext } from '@/features/auth/lib/redirect'
import {
  EMAIL_MAX,
  PASSWORD_MAX,
  validateEmail,
  type FieldErrors,
} from '@/features/auth/lib/validation'
import styles from './AuthForm.module.css'

type LoginFormProps = {
  /** 로그인 후 돌아갈 주소 (page.tsx에서 안전한 경로인지 검사한 값) */
  next: string | null
}

export default function LoginForm({ next }: LoginFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const clearError = (field: 'email' | 'password') => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading) return

    // 1) 빈칸·형식부터 확인
    const nextErrors: FieldErrors = {}
    const emailError = validateEmail(email)
    if (emailError) nextErrors.email = emailError
    if (!password) nextErrors.password = '비밀번호를 입력해 주세요.'
    setErrors(nextErrors)
    setFormError('')
    if (nextErrors.email) {
      emailRef.current?.focus()
      return
    }
    if (nextErrors.password) {
      passwordRef.current?.focus()
      return
    }

    // 2) 서버에 로그인 요청
    setLoading(true)
    const result = await postJson('/api/auth/login', { email, password })
    if (!result.ok) {
      setLoading(false)
      if (result.data.fieldErrors) {
        setErrors(result.data.fieldErrors)
      } else {
        setFormError(
          result.data.message ?? '로그인하지 못했어요. 다시 시도해 주세요.',
        )
      }
      if (result.status === 401) {
        setPassword('')
        passwordRef.current?.focus()
      }
      return
    }

    // 3) 성공: 본인인증을 아직 안 했으면 인증 화면으로
    showToast('로그인했어요.', 'success')
    router.replace(
      result.data.verified
        ? (next ?? AFTER_LOGIN_PATH)
        : withNext('/verify', next),
    )
    router.refresh()
  }

  return (
    // method="post": 화면이 다 뜨기 전에 Enter를 눌러도 비밀번호가 주소창(GET)에 붙지 않게
    <form
      method="post"
      className={styles.form}
      onSubmit={handleSubmit}
      noValidate
    >
      <Input
        ref={emailRef}
        label="이메일"
        type="email"
        name="email"
        autoComplete="email"
        spellCheck={false}
        placeholder="example@email.com"
        maxLength={EMAIL_MAX}
        value={email}
        onChange={(event) => {
          setEmail(event.target.value)
          clearError('email')
        }}
        error={errors.email}
      />
      <Input
        ref={passwordRef}
        label="비밀번호"
        type="password"
        name="password"
        autoComplete="current-password"
        maxLength={PASSWORD_MAX}
        value={password}
        onChange={(event) => {
          setPassword(event.target.value)
          clearError('password')
        }}
        error={errors.password}
      />

      {formError && <FormAlert>{formError}</FormAlert>}

      <Button
        type="submit"
        fullWidth
        loading={loading}
        className={styles.submit}
      >
        로그인
      </Button>
    </form>
  )
}
