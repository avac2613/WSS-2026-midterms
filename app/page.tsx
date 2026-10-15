import { LinkButton } from '@/components/ui/Button/Button'
import EmptyState from '@/components/ui/EmptyState/EmptyState'
import Header from '@/components/layout/header/Header'
import styles from './page.module.css'

/* 메인(랜딩) 페이지: 헤더만 있고 사이드바는 없음 */
export default function HomePage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.title}>
            공부 자료를
            <br />
            손쉽게 정리해 보세요
          </h1>
          <p className={styles.lead}>
            강의 자료나 논문을 업로드하면 AI가 요약하고, 요약한 내용은 자료실에
            모아 언제든 다시 볼 수 있어요.
          </p>
          <div className={styles.actions}>
            <LinkButton href="/ai" size="lg">
              PDF 요약 시작하기
            </LinkButton>
            <LinkButton href="/library" size="lg" variant="secondary">
              내 자료실 보기
            </LinkButton>
          </div>
        </section>

        <EmptyState
          variant="placeholder"
          title="이용 방법/기능 소개"
          description="lorem ipsum dolor sit amet, consectetur adipiscing elit."
        />
      </main>
    </>
  )
}
