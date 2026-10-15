'use client'

import type { SummaryResponse } from '../types'

/* 요약 결과를 /ai → /ai/result 페이지로 넘기기 위한 임시 보관함.
   - sessionStorage: 이 탭에서만 유지되고, 탭을 닫으면 사라짐 (서버·다른 사용자와 공유 X)
   - 영구 보관은 "자료실에 저장"(DB) 담당 */

const KEY = 'studynote:lastSummary'

export function saveLastSummary(data: SummaryResponse) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(data))
    return true
  } catch {
    return false // 시크릿 모드 등에서 저장 실패할 수 있음
  }
}

export function loadLastSummary(): SummaryResponse | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const data: unknown = JSON.parse(raw)
    return isSummaryResponse(data) ? data : null
  } catch {
    return null
  }
}

export function clearLastSummary() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* 무시 */
  }
}

/* 저장소 값은 사용자가 개발자도구로 바꿀 수 있으므로 모양을 다시 확인 */
function isSummaryResponse(v: unknown): v is SummaryResponse {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  const r = o.result as Record<string, unknown> | undefined
  return (
    o.ok === true &&
    typeof o.fileName === 'string' &&
    typeof o.pageCount === 'number' &&
    typeof r === 'object' &&
    r !== null &&
    typeof r.title === 'string' &&
    typeof r.summary === 'string' &&
    Array.isArray(r.keyPoints) &&
    r.keyPoints.every((x) => typeof x === 'string') &&
    Array.isArray(r.keywords) &&
    r.keywords.every((x) => typeof x === 'string') &&
    Array.isArray(r.questions) &&
    r.questions.every(
      (q) =>
        typeof q === 'object' &&
        q !== null &&
        typeof (q as Record<string, unknown>).question === 'string' &&
        typeof (q as Record<string, unknown>).answer === 'string',
    )
  )
}
