import { LinkButton } from '@/components/ui/Button/Button'
import Card from '@/components/ui/Card/Card'
import EmptyState from '@/components/ui/EmptyState/EmptyState'
import PageContainer from '@/components/layout/pageContainer/PageContainer'

type Props = {
  params: Promise<{ name: string }>
}

export async function generateMetadata({ params }: Props) {
  const { name } = await params
  return { title: decodeURIComponent(name) }
}

/* TODO: 해당 분류의 자료 목록 표시 */
export default async function CategoryPage({ params }: Props) {
  const { name } = await params
  const categoryName = decodeURIComponent(name)

  return (
    <PageContainer
      title={categoryName}
      description="이 분류에 저장된 자료예요."
      actions={
        <LinkButton href="/library" variant="secondary">
          전체 자료
        </LinkButton>
      }
    >
      <Card>
        <EmptyState
          title="이 분류에는 아직 자료가 없어요"
          description="자료를 저장할 때 이 분류를 선택하면 여기에 모여요."
        />
      </Card>
    </PageContainer>
  )
}
