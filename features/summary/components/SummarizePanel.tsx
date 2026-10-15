'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button/Button'
import Card from '@/components/ui/Card/Card'
import { DEFAULT_OPTIONS, type SummaryOptions } from '../types'
import { useSummarize } from '../hooks/useSummarize'
import { saveLastSummary } from '../lib/storage'
import PdfDropzone from './PdfDropzone'
import SummaryOptionsForm from './SummaryOptionsForm'
import styles from './summary.module.css'

/* /ai 페이지의 "PDF 업로드" + "요약 옵션" 카드.
   요약이 끝나면 결과를 sessionStorage에 넣고 /ai/result 로 이동합니다. */
export default function SummarizePanel() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [options, setOptions] = useState<SummaryOptions>(DEFAULT_OPTIONS)
  const { state, summarize, cancel, reset } = useSummarize()
  const loading = state.status === 'loading'

  const handleSubmit = async () => {
    if (!file) return
    const data = await summarize(file, options)
    if (data) {
      saveLastSummary(data)
      router.push('/ai/result')
    }
  }

  return (
    <>
      <Card title="PDF 업로드">
        <PdfDropzone
          file={file}
          disabled={loading}
          onChange={(f) => {
            setFile(f)
            reset()
          }}
        />
      </Card>

      <Card title="요약 옵션" description="요약 길이와 형식을 고르세요.">
        <SummaryOptionsForm
          value={options}
          onChange={setOptions}
          disabled={loading}
        />

        <div className={styles.submitRow}>
          {loading && (
            <>
              <span className={styles.muted} role="status">
                AI가 자료를 읽고 있어요… (보통 10~30초)
              </span>
              <Button variant="ghost" onClick={cancel}>
                취소
              </Button>
            </>
          )}
          <Button
            size="lg"
            loading={loading}
            disabled={!file}
            onClick={handleSubmit}
          >
            {loading ? '요약 중' : '요약하기'}
          </Button>
        </div>

        {state.status === 'error' && (
          <p className={styles.error} role="alert">
            {state.message}
          </p>
        )}
      </Card>
    </>
  )
}
