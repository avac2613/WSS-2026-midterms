import { Types } from 'mongoose'
import connectMongoDB from '@/lib/mongodb'
import Lecture from '@/models/Lecture'

export type LectureInput = {
  title: string
  fileName?: string
  category?: string
  content?: string
  summary: string
  author?: string
}

function serialize(doc: any) {
  return {
    id: String(doc._id),
    title: doc.title,
    fileName: doc.fileName ?? '',
    category: doc.category || '미분류',
    content: doc.content ?? '',
    summary: doc.summary,
    author: doc.author || 'guest',
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  }
}

export async function createLecture(input: LectureInput) {
  await connectMongoDB()
  const doc = await Lecture.create({
    title: input.title.trim(),
    fileName: input.fileName?.trim() ?? '',
    category: input.category?.trim() || '미분류',
    content: input.content?.trim() ?? '',
    summary: input.summary.trim(),
    author: input.author?.trim() || 'guest',
  })
  return serialize(doc)
}

export async function getLectures(filters: { category?: string; q?: string } = {}) {
  await connectMongoDB()
  const query: Record<string, unknown> = {}
  if (filters.category && filters.category !== '전체') query.category = filters.category
  if (filters.q?.trim()) {
    const escaped = filters.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    query.$or = [
      { title: { $regex: escaped, $options: 'i' } },
      { summary: { $regex: escaped, $options: 'i' } },
      { fileName: { $regex: escaped, $options: 'i' } },
    ]
  }
  const docs = await Lecture.find(query).sort({ updatedAt: -1 }).lean()
  return docs.map(serialize)
}

export async function getLecture(id: string) {
  if (!Types.ObjectId.isValid(id)) return null
  await connectMongoDB()
  const doc = await Lecture.findById(id).lean()
  return doc ? serialize(doc) : null
}

export async function getLectureCategories() {
  await connectMongoDB()
  const values = await Lecture.distinct('category')
  return values.filter((value): value is string => typeof value === 'string' && value.length > 0).sort()
}

export async function updateLecture(id: string, input: Partial<LectureInput>) {
  if (!Types.ObjectId.isValid(id)) return null
  await connectMongoDB()
  const update: Record<string, string> = {}
  for (const key of ['title', 'fileName', 'category', 'content', 'summary', 'author'] as const) {
    const value = input[key]
    if (typeof value === 'string') update[key] = value.trim()
  }
  const doc = await Lecture.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean()
  return doc ? serialize(doc) : null
}

export async function deleteLecture(id: string) {
  if (!Types.ObjectId.isValid(id)) return false
  await connectMongoDB()
  const result = await Lecture.findByIdAndDelete(id)
  return Boolean(result)
}
