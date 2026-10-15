import type { Metadata } from 'next'
import PageContainer from '@/components/layout/pageContainer/PageContainer'
import SummarizePanel from '@/features/summary/components/SummarizePanel'

export const metadata: Metadata = { title: 'AI 요약하기' }

/* PDF 업로드 + 요약 옵션 (담당: 김현빈)
   실제 코드는 features/summary 에 있습니다. */
export default function AiPage() {
  return (
    <PageContainer
      title="AI 요약하기"
      description="PDF 자료를 올리면 AI가 핵심 내용을 정리해 드려요."
    >
      <SummarizePanel />
    </PageContainer>
  )
}
