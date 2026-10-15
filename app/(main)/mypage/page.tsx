import type { Metadata } from 'next'
import Card from '@/components/ui/Card/Card'
import EmptyState from '@/components/ui/EmptyState/EmptyState'
import PageContainer from '@/components/layout/pageContainer/PageContainer'

export const metadata: Metadata = { title: '마이페이지' }

/* TODO: 회원 정보 표시·수정 */
export default function MyPage() {
  return (
    <PageContainer title="마이페이지" width="narrow">
      <Card title="회원 정보">
        <EmptyState
          variant="placeholder"
          title="회원 정보 영역"
          description="이름, 이메일, 비밀번호 변경 등이 들어갑니다."
        />
      </Card>
    </PageContainer>
  )
}
