import { LinkButton } from '@/components/ui/Button/Button'
import EmptyState from '@/components/ui/EmptyState/EmptyState'

/* 없는 주소로 들어왔을 때 보이는 화면 */
export default function NotFound() {
  return (
    <EmptyState
      fullHeight
      title="페이지를 찾을 수 없어요"
      description="주소가 바뀌었거나 삭제된 페이지예요."
      action={<LinkButton href="/">처음 화면으로</LinkButton>}
    />
  )
}
