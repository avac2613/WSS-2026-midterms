import { useCallback, useRef } from 'react'
import { useToast } from '@/components/ui/Toast/Toast'
import { postJson } from '@/features/auth/lib/postJson'

/* 로그아웃 함수를 돌려주는 훅 (클라이언트 컴포넌트에서 사용)
   const logout = useLogout();
   <Button onClick={logout}>로그아웃</Button> */
export function useLogout() {
  const { showToast } = useToast()
  const pending = useRef(false) // 두 번 눌러도 한 번만 요청

  return useCallback(async () => {
    if (pending.current) return
    pending.current = true

    const result = await postJson('/api/auth/logout')
    if (!result.ok) {
      pending.current = false
      showToast(
        result.data.message ?? '로그아웃하지 못했어요. 다시 시도해 주세요.',
        'error',
      )
      return
    }

    // 페이지를 통째로 새로 불러옴: 브라우저 메모리에 남은 이전 화면(뒤로 가기 등)까지 비우기 위해
    window.location.assign('/')
  }, [showToast])
}
