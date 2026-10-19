'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button/Button'

export default function DeleteLectureButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  async function handleDelete() {
    if (!window.confirm('이 자료를 삭제하시겠습니까? 삭제한 자료는 복구할 수 없습니다.')) return
    setLoading(true)
    try {
      const response = await fetch(`/api/library/${id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || '삭제에 실패했습니다.')
      router.push('/library')
      router.refresh()
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '삭제에 실패했습니다.')
      setLoading(false)
    }
  }
  return <Button variant="danger" onClick={handleDelete} loading={loading}>자료 삭제</Button>
}
