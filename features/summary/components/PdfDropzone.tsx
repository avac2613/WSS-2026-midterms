'use client'

import { useRef, useState, type DragEvent, type KeyboardEvent } from 'react'
import Button from '@/components/ui/Button/Button'
import { LIMITS } from '../types'
import styles from './summary.module.css'

type Props = {
  file: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

/* 클라이언트 쪽 1차 검사 (사용 편의용) — 진짜 검사는 서버에서 다시 함 */
function validate(file: File): string | null {
  const isPdf =
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) return 'PDF 파일만 올릴 수 있어요.'
  if (file.size > LIMITS.maxFileBytes) return '10MB 이하 파일만 올릴 수 있어요.'
  if (file.size === 0) return '빈 파일이에요.'
  return null
}

const uploadIcon = (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M12 16V4M7 9l5-5 5 5" />
    <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
  </svg>
)

export default function PdfDropzone({ file, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pick = (f: File | undefined | null) => {
    if (!f) return
    const msg = validate(f)
    setError(msg)
    onChange(msg ? null : f)
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    pick(e.dataTransfer.files?.[0])
  }

  const openPicker = () => {
    if (!disabled) inputRef.current?.click()
  }

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openPicker()
    }
  }

  const zoneClass = [
    styles.dropzone,
    dragging && styles.dragging,
    file && styles.hasFile,
    disabled && styles.disabled,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label="PDF 파일 업로드"
        className={zoneClass}
        onClick={openPicker}
        onKeyDown={onKey}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          hidden
          onChange={(e) => {
            pick(e.target.files?.[0])
            e.target.value = '' // 같은 파일을 다시 골라도 동작하게
          }}
        />

        {file ? (
          <div className={styles.fileInfo}>
            <span className={styles.fileIcon} aria-hidden>
              PDF
            </span>
            <div className={styles.fileText}>
              <strong className={styles.fileName}>{file.name}</strong>
              <span className={styles.muted}>
                {formatBytes(file.size)} · 다른 파일을 올리려면 클릭
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation()
                onChange(null)
              }}
            >
              삭제
            </Button>
          </div>
        ) : (
          <>
            <span className={styles.dropIcon}>{uploadIcon}</span>
            <p className={styles.dropTitle}>
              PDF를 여기로 끌어오거나 클릭해서 선택하세요
            </p>
            <p className={styles.muted}>
              최대 10MB · {LIMITS.maxPages}페이지까지 · 글자가 있는 PDF만 가능
            </p>
          </>
        )}
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
