import type { Metadata } from 'next'
import { LinkButton } from '@/components/ui/Button/Button'
import Card from '@/components/ui/Card/Card'
import EmptyState from '@/components/ui/EmptyState/EmptyState'
import PageContainer from '@/components/layout/pageContainer/PageContainer'
import styles from './page.module.css'

export const metadata: Metadata = { title: '자료 보기' }

type Props = {
  params: Promise<{ id: string }>
}

/* TODO(팀원 3): id로 자료를 불러와 제목·요약 내용 표시 */
export default async function LibraryDetailPage({ params }: Props) {
  const { id } = await params

  return (
    <PageContainer
      title="자료 보기"
      actions={
        <LinkButton href="/library" variant="secondary">
          목록으로
        </LinkButton>
      }
    >
      <Card>
        <div className={styles.content}>
          <EmptyState
            variant="placeholder"
            title="자료 상세 영역"
            description={`자료 번호 ${id}의 요약 내용이 표시됩니다.`}
          />
        </div>
      </Card>
    </PageContainer>
  )
}
