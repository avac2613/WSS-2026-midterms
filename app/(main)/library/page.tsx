import type { Metadata } from 'next'
import Link from 'next/link'
import { LinkButton } from '@/components/ui/Button/Button'
import Card from '@/components/ui/Card/Card'
import EmptyState from '@/components/ui/EmptyState/EmptyState'
import PageContainer from '@/components/layout/pageContainer/PageContainer'
import { getLectureCategories, getLectures } from '@/lib/lectures'
import styles from './page.module.css'

export const metadata: Metadata = { title: '내 자료실' }
export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ q?: string; category?: string }> }

export default async function LibraryPage({ searchParams }: Props) {
  const params = await searchParams
  let lectures: Awaited<ReturnType<typeof getLectures>> = []
  let categories: string[] = []
  let loadError = false
  try {
    ;[lectures, categories] = await Promise.all([
      getLectures({ q: params.q, category: params.category }),
      getLectureCategories(),
    ])
  } catch (error) {
    console.error('자료실 불러오기 실패:', error)
    loadError = true
  }

  return (
    <PageContainer title="내 자료실" description="AI가 요약한 자료를 분류별로 모아 다시 볼 수 있어요." actions={<LinkButton href="/ai">새 자료 요약하기</LinkButton>}>
      <Card className={styles.filterArea}>
        <form className={styles.searchForm} action="/library" method="get">
          <label htmlFor="library-search">자료 검색</label>
          <input id="library-search" name="q" defaultValue={params.q ?? ''} placeholder="제목, 파일명, 요약 내용 검색" />
          <label htmlFor="library-category">분류</label>
          <select id="library-category" name="category" defaultValue={params.category ?? '전체'}>
            <option value="전체">전체 분류</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <button type="submit">검색</button>
          {(params.q || params.category) && <Link href="/library" className={styles.resetLink}>초기화</Link>}
        </form>
        {categories.length > 0 && <div className={styles.categoryLinks}><span>분류 바로가기:</span>{categories.map((category) => <Link key={category} href={`/library/category/${encodeURIComponent(category)}`}>{category}</Link>)}</div>}
      </Card>

      {loadError ? (
        <Card><EmptyState title="자료를 불러오지 못했습니다" description="MongoDB 연결 주소와 .env.local 설정을 확인해 주세요." /></Card>
      ) : lectures.length === 0 ? (
        <Card><EmptyState title={params.q || params.category ? '검색 결과가 없어요' : '아직 저장한 자료가 없어요'} description={params.q || params.category ? '검색어 또는 분류를 바꿔 다시 확인해 주세요.' : '요약 결과 페이지에서 자료를 저장하면 이곳에 모여요.'} action={<LinkButton href="/ai">PDF 요약하러 가기</LinkButton>} /></Card>
      ) : (
        <div className={styles.grid}>
          {lectures.map((lecture) => (
            <Card key={lecture.id} title={lecture.title} description={`${lecture.category} · ${new Date(lecture.updatedAt).toLocaleDateString('ko-KR')}`} interactive>
              <p className={styles.summary}>{lecture.summary.length > 180 ? `${lecture.summary.slice(0, 180)}…` : lecture.summary}</p>
              {lecture.fileName && <p className={styles.fileName}>파일: {lecture.fileName}</p>}
              <Link className={styles.detailLink} href={`/library/${lecture.id}`}>자료 자세히 보기 →</Link>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
