import mongoose, { Schema, type Model } from 'mongoose'

export interface LectureDocument {
  title: string
  fileName: string
  category: string
  content: string
  summary: string
  author: string
  createdAt: Date
  updatedAt: Date
}

const LectureSchema = new Schema<LectureDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    fileName: { type: String, default: '' },
    category: { type: String, required: true, trim: true, default: '미분류', maxlength: 80 },
    content: { type: String, default: '' },
    summary: { type: String, required: true, trim: true },
    author: { type: String, default: 'guest', trim: true },
  },
  { timestamps: true },
)

const Lecture: Model<LectureDocument> =
  (mongoose.models.Lecture as Model<LectureDocument> | undefined) ??
  mongoose.model<LectureDocument>('Lecture', LectureSchema)

export default Lecture
