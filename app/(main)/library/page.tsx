import type { Metadata } from 'next'
import { LinkButton } from '@/components/ui/Button/Button'
import Card from '@/components/ui/Card/Card'
import EmptyState from '@/components/ui/EmptyState/EmptyState'
import PageContainer from '@/components/layout/pageContainer/PageContainer'
import styles from './page.module.css'

export const metadata: Metadata = { title: '내 자료실' }

/* TODO(팀원 3)
   - 분류·검색: features/library/components 에 만들어 첫 번째 자리에
   - 자료 목록: 자료가 있으면 <div className={styles.grid}> 안에 Card를 나열,
                없으면 아래 EmptyState를 그대로 보여 주세요. */
export default function LibraryPage() {
  return (
    <PageContainer
      title="내 자료실"
      description="AI가 요약한 자료를 분류별로 모아 다시 볼 수 있어요."
      actions={<LinkButton href="/ai">새 자료 요약하기</LinkButton>}
    >
      <EmptyState
        variant="placeholder"
        title="분류 · 검색 영역"
        description="과목별 분류 탭과 검색창이 들어갑니다."
        className={styles.filterArea}
      />

      <Card>
        <EmptyState
          title="아직 저장한 자료가 없어요"
          description="PDF를 요약하고 저장하면 이곳에 모여요."
          action={<LinkButton href="/ai">PDF 요약하러 가기</LinkButton>}
        />
      </Card>
    </PageContainer>
  )
}
