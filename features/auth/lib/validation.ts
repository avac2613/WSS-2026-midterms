import { CODE_LENGTH } from '@/features/auth/lib/constants'

/* 입력값 검사 규칙
   브라우저(폼)와 서버(API)가 같은 규칙을 쓰도록 한곳에 모았습니다.
   - 브라우저 검사: 바로 알려 주는 편의 기능
   - 서버 검사: 요청은 얼마든지 조작될 수 있으므로 이것이 진짜 방어선
   각 함수는 문제가 있으면 안내 문구를, 없으면 null을 돌려줍니다. */

export const NAME_MAX = 20
export const EMAIL_MAX = 254
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 64
export const PHONE_MAX = 13 // 010-1234-5678

export type AuthField =
  | 'name'
  | 'email'
  | 'password'
  | 'passwordConfirm'
  | 'phone'
  | 'code'

/** 칸별 에러 문구 (예: { email: '이미 가입된 이메일이에요.' }) */
export type FieldErrors = Partial<Record<AuthField, string>>

/** 앞뒤 공백을 지우고 소문자로 통일 (Abc@x.com 과 abc@x.com 을 같은 계정으로) */
export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function validateName(name: string) {
  const value = name.trim()
  if (!value) return '이름을 입력해 주세요.'
  if (value.length < 2 || value.length > NAME_MAX) {
    return `이름은 2~${NAME_MAX}자로 입력해 주세요.`
  }
  // 한글·영문만, 단어 사이 공백은 한 칸까지 (예: 홍길동, Gildong Hong)
  if (!/^[가-힣a-zA-Z]+( [가-힣a-zA-Z]+)*$/.test(value)) {
    return '이름은 한글 또는 영문으로 입력해 주세요.'
  }
  return null
}

export function validateEmail(email: string) {
  const value = normalizeEmail(email)
  if (!value) return '이메일을 입력해 주세요.'
  if (value.length > EMAIL_MAX || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return '이메일 형식이 올바르지 않아요.'
  }
  return null
}

/** 비밀번호 규칙: 8~64자, 영문·숫자·특수문자 중 2가지 이상 */
export function validatePassword(password: string) {
  if (!password) return '비밀번호를 입력해 주세요.'
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return `비밀번호는 ${PASSWORD_MIN}~${PASSWORD_MAX}자로 입력해 주세요.`
  }
  // 키보드로 칠 수 있는 영문·숫자·특수문자만 (공백·한글 X)
  if (!/^[\x21-\x7e]+$/.test(password)) {
    return '비밀번호에는 영문, 숫자, 특수문자만 쓸 수 있어요.'
  }
  const kinds = [/[a-zA-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((rule) =>
    rule.test(password),
  ).length
  if (kinds < 2) return '영문, 숫자, 특수문자 중 2가지 이상을 섞어 주세요.'
  return null
}

/** 숫자만 남김 (010-1234-5678 → 01012345678) */
export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}

export function validatePhone(phone: string) {
  const value = phone.trim()
  if (!value) return '휴대폰 번호를 입력해 주세요.'
  if (!/^[\d\s-]+$/.test(value)) return '숫자와 -만 입력해 주세요.'
  if (!/^01[016789]\d{7,8}$/.test(normalizePhone(value))) {
    return '휴대폰 번호 형식이 올바르지 않아요.'
  }
  return null
}

/** 화면 표시용 (01012345678 → 010-1234-5678) */
export function formatPhone(digits: string) {
  const middle = digits.length === 11 ? 7 : 6
  return `${digits.slice(0, 3)}-${digits.slice(3, middle)}-${digits.slice(middle)}`
}

export function validateCode(code: string) {
  const value = code.trim()
  if (!value) return '인증번호를 입력해 주세요.'
  if (value.length !== CODE_LENGTH || !/^\d+$/.test(value)) {
    return `인증번호 ${CODE_LENGTH}자리 숫자를 입력해 주세요.`
  }
  return null
}
