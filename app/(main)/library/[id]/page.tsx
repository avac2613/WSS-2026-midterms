import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LinkButton } from '@/components/ui/Button/Button'
import Card from '@/components/ui/Card/Card'
import EmptyState from '@/components/ui/EmptyState/EmptyState'
import PageContainer from '@/components/layout/pageContainer/PageContainer'
import { getLecture } from '@/lib/lectures'
import DeleteLectureButton from './DeleteLectureButton'
import styles from './page.module.css'

export const metadata: Metadata = { title: '자료 보기' }
export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ id: string }> }

export default async function LibraryDetailPage({ params }: Props) {
  const { id } = await params
  let lecture: Awaited<ReturnType<typeof getLecture>> = null
  try { lecture = await getLecture(id) } catch (error) { console.error('자료 상세 조회 실패:', error) }
  if (!lecture) {
    return <PageContainer title="자료를 찾을 수 없습니다" actions={<LinkButton href="/library" variant="secondary">목록으로</LinkButton>}><Card><EmptyState title="자료가 없거나 불러오지 못했습니다" description="주소를 확인하거나 자료실로 돌아가 주세요." /></Card></PageContainer>
  }
  return (
    <PageContainer title={lecture.title} description={`${lecture.category} · 저장일 ${new Date(lecture.createdAt).toLocaleDateString('ko-KR')}`} actions={<><LinkButton href="/library" variant="secondary">목록으로</LinkButton><DeleteLectureButton id={lecture.id} /></>}>
      {lecture.fileName && <p className={styles.fileName}>원본 파일: {lecture.fileName}</p>}
      <Card title="AI 요약">
        <div className={styles.content}><p className={styles.summary}>{lecture.summary}</p></div>
      </Card>
      {lecture.content && <Card title="추가 내용"><div className={styles.content}><p className={styles.summary}>{lecture.content}</p></div></Card>}
    </PageContainer>
  )
}
