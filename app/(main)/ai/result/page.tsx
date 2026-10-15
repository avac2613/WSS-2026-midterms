import type { Metadata } from 'next'
import SummaryResultView from '@/features/summary/components/SummaryResultView'

export const metadata: Metadata = { title: '요약 결과' }

/* AI 요약 결과 표시 (담당: 김현빈)
   TODO(팀원 3): "자료실에 저장" 버튼은
   features/summary/components/SummaryResultView.tsx 에서 연결해 주세요. */
export default function AiResultPage() {
  return <SummaryResultView />
}
