import type { FieldErrors } from '@/features/auth/lib/validation'

/* 브라우저에서 인증 API로 JSON을 보내는 도우미 (폼 컴포넌트에서 사용) */

/** 인증 API가 돌려주는 값 (features/auth/lib/http.ts 형식) */
export type ApiData = {
  ok?: boolean
  message?: string
  fieldErrors?: FieldErrors
  retryAfter?: number
  reason?: string
  remainingAttempts?: number
  verified?: boolean
  devMode?: boolean
  expiresIn?: number
  resendIn?: number
}

export type ApiResult = { ok: boolean; status: number; data: ApiData }

export async function postJson(
  url: string,
  body: object = {},
): Promise<ApiResult> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data: ApiData = await response.json().catch(() => ({}))
    return { ok: response.ok, status: response.status, data }
  } catch {
    return {
      ok: false,
      status: 0,
      data: {
        message: '서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.',
      },
    }
  }
}
