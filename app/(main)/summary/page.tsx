import { redirect } from 'next/navigation'

/* 처음에 테스트용으로 만든 페이지입니다. 실제 기능은 /ai 로 옮겼어요.
   이 폴더(app/(main)/summary)는 지워도 됩니다. */
export default function SummaryPage() {
  redirect('/ai')
}
