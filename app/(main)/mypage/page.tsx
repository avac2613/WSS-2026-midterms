import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Card from '@/components/ui/Card/Card'
import PageContainer from '@/components/layout/pageContainer/PageContainer'
import { getCurrentUser } from '@/features/auth/lib/session'
import { findUserProfile } from '@/features/auth/lib/users'
import { formatPhone } from '@/features/auth/lib/validation'
import styles from './page.module.css'

export const metadata: Metadata = { title: '마이페이지' }

const METHOD_LABEL = { email: '이메일', phone: '휴대폰' } as const

/* 서버 시간대와 상관없이 한국 날짜로 표시 */
function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  })
}

/* 회원 정보 표시
   - 로그인 쿠키(세션)로 찾은 내 id로만 조회 → 주소를 바꿔도 다른 사람 정보는 볼 수 없음
   - 서버 컴포넌트라 DB 조회 코드와 비밀번호 해시는 브라우저로 전달되지 않음 */
export default async function MyPage() {
  // (main)/layout.tsx에서도 확인하지만, 페이지 단독으로도 안전하도록 한 번 더 확인
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const profile = await findUserProfile(user.id)
  if (!profile) redirect('/login')

  return (
    <PageContainer title="마이페이지" width="narrow">
      <Card title="회원 정보">
        <dl className={styles.info}>
          <div className={styles.row}>
            <dt>이름</dt>
            <dd>{profile.name}</dd>
          </div>
          <div className={styles.row}>
            <dt>이메일</dt>
            <dd>{profile.email}</dd>
          </div>
          <div className={styles.row}>
            <dt>휴대폰</dt>
            <dd>
              {profile.phone ? (
                formatPhone(profile.phone)
              ) : (
                <span className={styles.muted}>등록 안 함</span>
              )}
            </dd>
          </div>
          <div className={styles.row}>
            <dt>본인인증</dt>
            <dd>
              {profile.verifiedAt ? (
                <>
                  <span className={styles.badge}>인증 완료</span>
                  {profile.verifyMethod && `${METHOD_LABEL[profile.verifyMethod]} · `}
                  {formatDate(profile.verifiedAt)}
                </>
              ) : (
                <span className={styles.muted}>인증 전</span>
              )}
            </dd>
          </div>
          <div className={styles.row}>
            <dt>가입일</dt>
            <dd>{formatDate(profile.createdAt)}</dd>
          </div>
        </dl>
      </Card>
    </PageContainer>
  )
}
