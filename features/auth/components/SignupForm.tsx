'use client'

import {
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
} from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button/Button'
import Input from '@/components/ui/Input/Input'
import { useToast } from '@/components/ui/Toast/Toast'
import FormAlert from '@/features/auth/components/FormAlert'
import { postJson } from '@/features/auth/lib/postJson'
import { withNext } from '@/features/auth/lib/redirect'
import {
  EMAIL_MAX,
  NAME_MAX,
  PASSWORD_MAX,
  PASSWORD_MIN,
  validateEmail,
  validateName,
  validatePassword,
  type FieldErrors,
} from '@/features/auth/lib/validation'
import styles from './AuthForm.module.css'

type SignupFormProps = {
  /** 가입·본인인증 후 돌아갈 주소 */
  next: string | null
}

type Field = 'name' | 'email' | 'password' | 'passwordConfirm'
type Values = Record<Field, string>

/** 화면 위에서부터의 순서 (첫 번째로 틀린 칸에 커서를 옮길 때 사용) */
const FIELDS: Field[] = ['name', 'email', 'password', 'passwordConfirm']

/** 칸 하나 검사 (문제가 없으면 null) */
function validateField(field: Field, values: Values) {
  switch (field) {
    case 'name':
      return validateName(values.name)
    case 'email':
      return validateEmail(values.email)
    case 'password':
      return validatePassword(values.password)
    case 'passwordConfirm':
      if (!values.passwordConfirm) return '비밀번호를 한 번 더 입력해 주세요.'
      return values.passwordConfirm === values.password
        ? null
        : '비밀번호가 일치하지 않아요.'
  }
}

export default function SignupForm({ next }: SignupFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const formRef = useRef<HTMLFormElement>(null)
  const [values, setValues] = useState<Values>({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const focusField = (field: Field) => {
    const element = formRef.current?.elements.namedItem(field)
    if (element instanceof HTMLInputElement) element.focus()
  }

  // 입력할 때: 이미 에러가 떠 있는 칸만 다시 검사 (고치는 즉시 에러가 사라지게)
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const field = event.target.name as Field
    const nextValues = { ...values, [field]: event.target.value }
    setValues(nextValues)
    setErrors((prev) => {
      const updated = { ...prev }
      if (prev[field]) {
        updated[field] = validateField(field, nextValues) ?? undefined
      }
      // 비밀번호를 고치면 '비밀번호 확인'도 다시 비교
      if (field === 'password' && prev.passwordConfirm) {
        updated.passwordConfirm =
          validateField('passwordConfirm', nextValues) ?? undefined
      }
      return updated
    })
  }

  // 칸을 벗어날 때: 뭔가 입력했으면 검사
  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const field = event.target.name as Field
    if (!values[field]) return
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, values) ?? undefined,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading) return

    // 1) 모든 칸 검사
    const nextErrors: FieldErrors = {}
    for (const field of FIELDS) {
      const error = validateField(field, values)
      if (error) nextErrors[field] = error
    }
    setErrors(nextErrors)
    setFormError('')
    const firstInvalid = FIELDS.find((field) => nextErrors[field])
    if (firstInvalid) {
      focusField(firstInvalid)
      return
    }

    // 2) 서버에 가입 요청 (비밀번호 확인 칸은 화면에서만 쓰고 보내지 않음)
    setLoading(true)
    const result = await postJson('/api/auth/signup', {
      name: values.name,
      email: values.email,
      password: values.password,
    })
    if (!result.ok) {
      setLoading(false)
      const serverErrors = result.data.fieldErrors
      if (serverErrors) {
        setErrors(serverErrors)
        const first = FIELDS.find((field) => serverErrors[field])
        if (first) focusField(first)
      } else {
        setFormError(
          result.data.message ?? '가입하지 못했어요. 다시 시도해 주세요.',
        )
      }
      return
    }

    // 3) 가입하면 바로 로그인된 상태 → 본인인증으로
    showToast('가입을 환영해요! 본인인증을 진행해 주세요.', 'success')
    router.replace(withNext('/verify', next))
    router.refresh()
  }

  return (
    // method="post": 화면이 다 뜨기 전에 Enter를 눌러도 비밀번호가 주소창(GET)에 붙지 않게
    <form
      ref={formRef}
      method="post"
      className={styles.form}
      onSubmit={handleSubmit}
      noValidate
    >
      <Input
        label="이름"
        name="name"
        autoComplete="name"
        placeholder="홍길동"
        maxLength={NAME_MAX}
        value={values.name}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.name}
      />
      <Input
        label="이메일"
        type="email"
        name="email"
        autoComplete="email"
        spellCheck={false}
        placeholder="example@email.com"
        maxLength={EMAIL_MAX}
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.email}
      />
      <Input
        label="비밀번호"
        type="password"
        name="password"
        autoComplete="new-password"
        maxLength={PASSWORD_MAX}
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
        hint={`영문·숫자·특수문자 중 2가지 이상, ${PASSWORD_MIN}~${PASSWORD_MAX}자`}
        error={errors.password}
      />
      <Input
        label="비밀번호 확인"
        type="password"
        name="passwordConfirm"
        autoComplete="new-password"
        maxLength={PASSWORD_MAX}
        value={values.passwordConfirm}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.passwordConfirm}
      />

      {formError && <FormAlert>{formError}</FormAlert>}

      <Button
        type="submit"
        fullWidth
        loading={loading}
        className={styles.submit}
      >
        가입하기
      </Button>
      <p className={styles.note}>가입 후 본인인증을 진행해요.</p>
    </form>
  )
}
