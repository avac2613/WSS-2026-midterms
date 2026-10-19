'use client'

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button/Button'
import Input from '@/components/ui/Input/Input'
import { useToast } from '@/components/ui/Toast/Toast'
import FormAlert from '@/features/auth/components/FormAlert'
import {
  AFTER_VERIFY_PATH,
  CODE_LENGTH,
  CODE_RESEND_SEC,
  CODE_TTL_SEC,
} from '@/features/auth/lib/constants'
import { postJson, type ApiResult } from '@/features/auth/lib/postJson'
import {
  formatPhone,
  normalizePhone,
  PHONE_MAX,
  validateCode,
  validatePhone,
} from '@/features/auth/lib/validation'
import styles from './VerifyForm.module.css'

type Method = 'email' | 'phone'

/** 새로고침 전에 보낸 인증번호가 아직 유효할 때 서버가 넘겨주는 정보 */
export type PendingCode = {
  method: Method
  target: string
  /** 남은 유효 시간 (초) */
  expiresIn: number
  /** 다시 받기까지 남은 시간 (초) */
  resendIn: number
}

type VerifyFormProps = {
  /** 가입한 이메일 (이메일 인증은 이 주소로만 보냄) */
  email: string
  /** 인증 후 돌아갈 주소 */
  next: string | null
  pending: PendingCode | null
}

/** 보낸 인증번호 정보 */
type SentCode = {
  method: Method
  /** 화면에 보여 줄 받는 곳 (이메일 또는 010-0000-0000) */
  target: string
  expiresAt: number
  resendAt: number
  /** true면 실제로 보내지 않고 서버 터미널에 출력한 것 */
  devMode: boolean
}

const EXPIRED_MESSAGE = '인증 시간이 지났어요. 인증번호를 다시 받아 주세요.'

const svgProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

/* 인증 수단 목록: 수단을 추가하려면 여기에 한 줄 추가 */
const methods: {
  value: Method
  title: string
  description: string
  icon: ReactNode
}[] = [
  {
    value: 'email',
    title: '이메일 인증',
    description: '가입한 이메일로 받기',
    icon: (
      <svg {...svgProps}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
      </svg>
    ),
  },
  {
    value: 'phone',
    title: '휴대폰 인증',
    description: '문자 메시지로 받기',
    icon: (
      <svg {...svgProps}>
        <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
        <path d="M10.5 18h3" />
      </svg>
    ),
  },
]

/** 남은 초 → "4:59" */
function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export default function VerifyForm({ email, next, pending }: VerifyFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [method, setMethod] = useState<Method>(pending?.method ?? 'email')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState<{ phone?: string; code?: string }>({})
  const [formError, setFormError] = useState('')
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [sent, setSent] = useState<SentCode | null>(null)
  const [now, setNow] = useState(0)
  const phoneRef = useRef<HTMLInputElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)

  // 지금 고른 수단으로 보낸 인증번호 (다른 수단을 고르면 입력칸을 숨김)
  const active = sent?.method === method ? sent : null
  const remainingSec = active
    ? Math.max(0, Math.ceil((active.expiresAt - now) / 1000))
    : 0
  const expired = active !== null && remainingSec === 0
  // 다시 받기 대기 시간은 수단과 상관없이 계정마다 적용됨
  const resendSec = sent
    ? Math.max(0, Math.ceil((sent.resendAt - now) / 1000))
    : 0

  // 새로고침해도(예: 메일 앱을 보고 돌아왔을 때) 아직 유효한 인증번호 입력칸을 다시 보여 줌
  // (남은 시간은 이 기기의 시계로 계산해야 해서 화면이 뜬 뒤에 설정)
  useEffect(() => {
    if (!pending) return
    const mountedAt = Date.now()
    setNow(mountedAt)
    setSent({
      method: pending.method,
      target: pending.target,
      expiresAt: mountedAt + pending.expiresIn * 1000,
      resendAt: mountedAt + pending.resendIn * 1000,
      devMode: false,
    })
  }, [pending])

  // 인증번호를 보낸 뒤 1초마다 남은 시간 갱신
  useEffect(() => {
    if (!sent) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [sent])

  // 새로 보내면 인증번호 입력칸으로 커서 이동
  useEffect(() => {
    if (sent) codeRef.current?.focus()
  }, [sent])

  /** 로그인이 풀렸거나 이미 인증된 경우: 서버가 알맞은 화면으로 보내도록 새로고침 */
  const handleSessionProblem = (result: ApiResult) => {
    if (result.status !== 401 && result.data.reason !== 'verified') return false
    showToast(result.data.message ?? '다시 로그인해 주세요.', 'info')
    router.refresh()
    return true
  }

  const handleMethodChange = (value: Method) => {
    setMethod(value)
    setErrors({})
    setFormError('')
  }

  /* ---------- 1단계: 인증번호 받기 ---------- */
  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sending || resendSec > 0) return
    setFormError('')

    let phoneDigits = ''
    if (method === 'phone') {
      const phoneError = validatePhone(phone)
      if (phoneError) {
        setErrors({ phone: phoneError })
        phoneRef.current?.focus()
        return
      }
      phoneDigits = normalizePhone(phone)
    }

    setSending(true)
    const result = await postJson(
      '/api/auth/verify/send',
      method === 'phone' ? { method, phone: phoneDigits } : { method },
    )
    setSending(false)

    if (!result.ok) {
      if (handleSessionProblem(result)) return
      const phoneError = result.data.fieldErrors?.phone
      if (phoneError) {
        setErrors({ phone: phoneError })
        phoneRef.current?.focus()
      } else {
        setFormError(result.data.message ?? '인증번호를 보내지 못했어요.')
      }
      return
    }

    // 보냈다는 안내는 토스트 대신 입력칸 위 초록 상자로 보여 줌 (모바일에서 토스트가 입력칸을 가려서)
    const startedAt = Date.now()
    setNow(startedAt)
    setSent({
      method,
      target: method === 'phone' ? formatPhone(phoneDigits) : email,
      expiresAt: startedAt + (result.data.expiresIn ?? CODE_TTL_SEC) * 1000,
      resendAt: startedAt + (result.data.resendIn ?? CODE_RESEND_SEC) * 1000,
      devMode: result.data.devMode === true,
    })
    setCode('')
    setErrors({})
  }

  /* ---------- 2단계: 인증번호 확인 ---------- */
  const handleConfirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (confirming || !active) return
    if (expired) {
      setErrors({ code: EXPIRED_MESSAGE })
      return
    }
    const codeError = validateCode(code)
    if (codeError) {
      setErrors({ code: codeError })
      codeRef.current?.focus()
      return
    }

    setConfirming(true)
    const result = await postJson('/api/auth/verify/confirm', { code })
    if (!result.ok) {
      setConfirming(false)
      if (handleSessionProblem(result)) return
      // 서버에서 인증번호가 폐기된 경우 → 다시 받기를 바로 누를 수 있게
      const reason = result.data.reason
      if (reason === 'expired' || reason === 'locked' || reason === 'missing') {
        const discardedAt = Date.now()
        setNow(discardedAt)
        setSent(
          (prev) =>
            prev && { ...prev, expiresAt: discardedAt, resendAt: discardedAt },
        )
      }
      setErrors({
        code: result.data.message ?? '인증하지 못했어요. 다시 시도해 주세요.',
      })
      setCode('')
      codeRef.current?.focus()
      return
    }

    showToast('본인인증을 마쳤어요.', 'success')
    router.replace(next ?? AFTER_VERIFY_PATH)
    router.refresh()
  }

  const sendLabel = active ? '인증번호 다시 받기' : '인증번호 받기'
  // 예: "010-1234-5678 번호로", "abc@email.com 주소로"
  const sentTo =
    active &&
    `${active.target} ${active.method === 'phone' ? '번호' : '주소'}로`

  return (
    <div className={styles.verify}>
      <form
        method="post"
        className={styles.step}
        onSubmit={handleSend}
        noValidate
      >
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>인증 수단</legend>
          <div className={styles.methods}>
            {methods.map((item) => (
              <label key={item.value} className={styles.method}>
                <input
                  type="radio"
                  name="method"
                  value={item.value}
                  checked={method === item.value}
                  onChange={() => handleMethodChange(item.value)}
                  className={`sr-only ${styles.methodInput}`}
                />
                <span className={styles.methodBody}>
                  <span className={styles.methodIcon}>{item.icon}</span>
                  <span className={styles.methodTitle}>{item.title}</span>
                  <span className={styles.methodDescription}>
                    {item.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {method === 'email' ? (
          <div className={styles.target}>
            <span className={styles.targetLabel}>인증번호를 받을 이메일</span>
            <span className={styles.targetValue}>{email}</span>
          </div>
        ) : (
          <Input
            ref={phoneRef}
            label="휴대폰 번호"
            type="tel"
            name="phone"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="010-1234-5678"
            maxLength={PHONE_MAX}
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value)
              setErrors((prev) => ({ ...prev, phone: undefined }))
            }}
            error={errors.phone}
          />
        )}

        <Button
          type="submit"
          variant={active ? 'secondary' : 'primary'}
          fullWidth
          loading={sending}
          disabled={resendSec > 0}
        >
          {resendSec > 0 ? `${sendLabel} (${resendSec}초)` : sendLabel}
        </Button>
      </form>

      {active && (
        <form
          method="post"
          className={styles.step}
          onSubmit={handleConfirm}
          noValidate
        >
          <FormAlert tone="success">{sentTo} 인증번호를 보냈어요.</FormAlert>
          {active.devMode && (
            <FormAlert tone="warning">
              개발 모드라 실제로 보내지 않았어요. 인증번호는{' '}
              <code>npm run dev</code> 터미널에서 확인하세요.
            </FormAlert>
          )}

          <Input
            ref={codeRef}
            label="인증번호"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder={`${CODE_LENGTH}자리 숫자`}
            value={code}
            onChange={(event) => {
              // 숫자만 남기고 6자리까지 ("123-456"을 붙여 넣어도 123456)
              setCode(
                event.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH),
              )
              setErrors((prev) => ({ ...prev, code: undefined }))
            }}
            hint={expired ? undefined : `남은 시간 ${formatTime(remainingSec)}`}
            error={errors.code ?? (expired ? EXPIRED_MESSAGE : undefined)}
          />
          <Button
            type="submit"
            fullWidth
            loading={confirming}
            disabled={expired}
          >
            확인
          </Button>
        </form>
      )}

      {formError && <FormAlert>{formError}</FormAlert>}
    </div>
  )
}
