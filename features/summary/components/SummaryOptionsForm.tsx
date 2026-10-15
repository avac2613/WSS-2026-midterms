'use client'

import type { SummaryLength, SummaryOptions, SummaryStyle } from '../types'
import styles from './summary.module.css'

type Props = {
  value: SummaryOptions
  onChange: (next: SummaryOptions) => void
  disabled?: boolean
}

const LENGTHS: { value: SummaryLength; label: string }[] = [
  { value: 'short', label: '짧게' },
  { value: 'medium', label: '보통' },
  { value: 'long', label: '자세히' },
]

const STYLES: { value: SummaryStyle; label: string }[] = [
  { value: 'bullet', label: '개조식' },
  { value: 'prose', label: '서술형' },
]

export default function SummaryOptionsForm({
  value,
  onChange,
  disabled,
}: Props) {
  return (
    <div className={styles.options}>
      <fieldset className={styles.fieldset} disabled={disabled}>
        <legend className={styles.legend}>요약 길이</legend>
        <div className={styles.segment}>
          {LENGTHS.map((o) => (
            <label
              key={o.value}
              className={
                value.length === o.value ? styles.segActive : styles.segItem
              }
            >
              <input
                type="radio"
                name="length"
                value={o.value}
                checked={value.length === o.value}
                onChange={() => onChange({ ...value, length: o.value })}
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.fieldset} disabled={disabled}>
        <legend className={styles.legend}>형식</legend>
        <div className={styles.segment}>
          {STYLES.map((o) => (
            <label
              key={o.value}
              className={
                value.style === o.value ? styles.segActive : styles.segItem
              }
            >
              <input
                type="radio"
                name="style"
                value={o.value}
                checked={value.style === o.value}
                onChange={() => onChange({ ...value, style: o.value })}
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          disabled={disabled}
          checked={value.includeQuestions}
          onChange={(e) =>
            onChange({ ...value, includeQuestions: e.target.checked })
          }
        />
        예상 문제도 만들어 주세요
      </label>
    </div>
  )
}
