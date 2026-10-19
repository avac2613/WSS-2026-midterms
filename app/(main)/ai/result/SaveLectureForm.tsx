'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button/Button'
import styles from './saveForm.module.css'

export default function SaveLectureForm() {
  const [title, setTitle] = useState('강의 요약 자료')
  const [category, setCategory] = useState('미분류')
  const [summary, setSummary] = useState('AI 요약 기능이 연결되면 이곳에 생성된 요약 내용이 표시됩니다. 현재는 MongoDB 저장 기능을 확인할 수 있도록 내용을 직접 입력할 수 있습니다.')
  const [fileName, setFileName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('')
    if (!title.trim() || !summary.trim()) { setError('제목과 요약 내용을 입력해 주세요.'); return }
    setSaving(true)
    try {
      const response = await fetch('/api/library', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, category, summary, fileName }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || '저장에 실패했습니다.')
      router.push(`/library/${data.lecture.id}`)
      router.refresh()
    } catch (err) { setError(err instanceof Error ? err.message : '저장에 실패했습니다.') }
    finally { setSaving(false) }
  }

  return <form className={styles.form} onSubmit={handleSave}>
    <label htmlFor="lecture-title">자료 제목</label><input id="lecture-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
    <label htmlFor="lecture-category">분류 / 과목</label><input id="lecture-category" value={category} onChange={(e) => setCategory(e.target.value)} maxLength={80} placeholder="예: 정보보안, 운영체제" />
    <label htmlFor="lecture-file">원본 파일명 (선택)</label><input id="lecture-file" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="예: 03주차_강의자료.pdf" />
    <label htmlFor="lecture-summary">요약 내용</label><textarea id="lecture-summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={10} required />
    {error && <p className={styles.error} role="alert">{error}</p>}
    <Button type="submit" loading={saving}>자료실에 저장</Button>
  </form>
}
