import type { Metadata } from 'next'
import Link from 'next/link'
import { LinkButton } from '@/components/ui/Button/Button'
import Card from '@/components/ui/Card/Card'
import EmptyState from '@/components/ui/EmptyState/EmptyState'
import PageContainer from '@/components/layout/pageContainer/PageContainer'
import { getLectures } from '@/lib/lectures'
import styles from '../../page.module.css'

 type Props = { params: Promise<{ name: string }> }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params
  return { title: decodeURIComponent(name) }
}
export const dynamic = 'force-dynamic'

export default async function CategoryPage({ params }: Props) {
  const { name } = await params
  const categoryName = decodeURIComponent(name)
  let lectures: Awaited<ReturnType<typeof getLectures>> = []
  let loadError = false
  try { lectures = await getLectures({ category: categoryName }) } catch (error) { console.error('분류 자료 조회 실패:', error); loadError = true }
  return (
    <PageContainer title={categoryName} description="이 분류에 저장된 자료예요." actions={<LinkButton href="/library" variant="secondary">전체 자료</LinkButton>}>
      {loadError ? <Card><EmptyState title="자료를 불러오지 못했습니다" description="MongoDB 연결 설정을 확인해 주세요." /></Card> : lectures.length === 0 ? <Card><EmptyState title="이 분류에는 아직 자료가 없어요" description="자료를 저장할 때 이 분류를 선택하면 여기에 모여요." /></Card> : <div className={styles.grid}>{lectures.map((lecture) => <Card key={lecture.id} title={lecture.title} description={`${lecture.category} · ${new Date(lecture.updatedAt).toLocaleDateString('ko-KR')}`} interactive><p className={styles.summary}>{lecture.summary.length > 180 ? `${lecture.summary.slice(0, 180)}…` : lecture.summary}</p><Link className={styles.detailLink} href={`/library/${lecture.id}`}>자료 자세히 보기 →</Link></Card>)}</div>}
    </PageContainer>
  )
}
