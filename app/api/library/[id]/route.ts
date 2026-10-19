import { NextRequest } from 'next/server'
import { deleteLecture, getLecture, updateLecture } from '@/lib/lectures'

export const runtime = 'nodejs'
type Context = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { id } = await params
    const lecture = await getLecture(id)
    if (!lecture) return Response.json({ message: '자료를 찾을 수 없습니다.' }, { status: 404 })
    return Response.json({ lecture })
  } catch (error) {
    console.error('자료 조회 실패:', error)
    return Response.json({ message: '자료를 불러오지 못했습니다.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params
    const body = await request.json()
    const lecture = await updateLecture(id, body)
    if (!lecture) return Response.json({ message: '자료를 찾을 수 없습니다.' }, { status: 404 })
    return Response.json({ lecture })
  } catch (error) {
    console.error('자료 수정 실패:', error)
    return Response.json({ message: '자료를 수정하지 못했습니다.' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const { id } = await params
    const deleted = await deleteLecture(id)
    if (!deleted) return Response.json({ message: '자료를 찾을 수 없습니다.' }, { status: 404 })
    return Response.json({ success: true })
  } catch (error) {
    console.error('자료 삭제 실패:', error)
    return Response.json({ message: '자료를 삭제하지 못했습니다.' }, { status: 500 })
  }
}
