import Link from 'next/link'
import type { Metadata } from 'next'
import Card from '@/components/ui/Card/Card'
import EmptyState from '@/components/ui/EmptyState/EmptyState'

export const metadata: Metadata = { title: '회원가입' }

/* TODO: EmptyState 자리에 회원가입 폼 구현 */
export default function SignupPage() {
  return (
    <Card
      titleAs="h1"
      title="회원가입"
      description="가입하면 요약한 자료를 저장하고 분류할 수 있어요."
      footer={
        <>
          이미 계정이 있나요? <Link href="/login">로그인</Link>
        </>
      }
    >
      <EmptyState
        variant="placeholder"
        title="회원가입 폼 영역"
        description="이름, 이메일, 비밀번호 입력창과 가입 버튼이 들어갑니다."
      />
    </Card>
  )
}
