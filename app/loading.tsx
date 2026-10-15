import EmptyState from '@/components/ui/EmptyState/EmptyState'
import Spinner from '@/components/ui/Spinner/Spinner'

/* 페이지를 불러오는 동안 자동으로 보이는 화면 */
export default function Loading() {
  return <EmptyState fullHeight icon={<Spinner />} title="불러오는 중이에요" />
}
