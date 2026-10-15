'use client'

import Button from '@/components/ui/Button/Button'
import EmptyState from '@/components/ui/EmptyState/EmptyState'

/* 페이지에서 오류가 났을 때 자동으로 보이는 화면 */
export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <EmptyState
      fullHeight
      title="페이지를 불러오지 못했어요"
      description="잠시 후 다시 시도해 주세요. 문제가 계속되면 새로고침해 보세요."
      action={<Button onClick={() => reset()}>다시 시도</Button>}
    />
  )
}
