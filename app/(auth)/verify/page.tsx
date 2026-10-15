import type { Metadata } from 'next'
import Card from '@/components/ui/Card/Card'
import EmptyState from '@/components/ui/EmptyState/EmptyState'

export const metadata: Metadata = { title: '본인인증' }

/* TODO: EmptyState 자리에 본인인증 화면 구현 */
export default function VerifyPage() {
  return (
    <Card
      titleAs="h1"
      title="본인인증"
      description="안전한 이용을 위해 본인인증을 진행해 주세요."
    >
      <EmptyState
        variant="placeholder"
        title="본인인증 영역"
        description="인증 수단 선택, 인증번호 입력창이 들어갑니다."
      />
    </Card>
  )
}
