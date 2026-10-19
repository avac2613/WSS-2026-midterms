import { NextRequest } from 'next/server'
import { createLecture, getLectures } from '@/lib/lectures'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category') ?? undefined
    const q = request.nextUrl.searchParams.get('q') ?? undefined
    const lectures = await getLectures({ category, q })
    return Response.json({ lectures })
  } catch (error) {
    console.error('자료 목록 조회 실패:', error)
    return Response.json({ message: '자료를 불러오지 못했습니다. MongoDB 연결 설정을 확인해 주세요.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return Response.json({ message: '자료 제목을 입력해 주세요.' }, { status: 400 })
    }
    if (typeof body.summary !== 'string' || !body.summary.trim()) {
      return Response.json({ message: '요약 내용을 입력해 주세요.' }, { status: 400 })
    }
    const lecture = await createLecture({
      title: body.title,
      summary: body.summary,
      category: typeof body.category === 'string' ? body.category : '미분류',
      fileName: typeof body.fileName === 'string' ? body.fileName : '',
      content: typeof body.content === 'string' ? body.content : '',
      author: typeof body.author === 'string' ? body.author : 'guest',
    })
    return Response.json({ lecture }, { status: 201 })
  } catch (error) {
    console.error('자료 저장 실패:', error)
    return Response.json({ message: '자료를 저장하지 못했습니다. MongoDB 연결 설정을 확인해 주세요.' }, { status: 500 })
  }
}
