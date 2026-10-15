import Link from 'next/link'
import type { Metadata } from 'next'
import Card from '@/components/ui/Card/Card'
import EmptyState from '@/components/ui/EmptyState/EmptyState'

export const metadata: Metadata = { title: '로그인' }

/* TODO: EmptyState 자리에 로그인 폼 구현
   - 공통 입력창: import Input from "@/components/ui/Input/Input";
   - 공통 버튼:   import Button from "@/components/ui/Button/Button"; */
export default function LoginPage() {
  return (
    <Card
      titleAs="h1"
      title="로그인"
      description="계정에 로그인하고 요약한 자료를 이어서 확인하세요."
      footer={
        <>
          아직 계정이 없나요? <Link href="/signup">회원가입</Link>
        </>
      }
    >
      <EmptyState
        variant="placeholder"
        title="로그인 폼 영역"
        description="아이디·비밀번호 입력창과 로그인 버튼이 들어갑니다."
      />
    </Card>
  )
}
