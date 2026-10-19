'use client'

import { useEffect, useState } from 'react'
import Button, { LinkButton } from '@/components/ui/Button/Button'
import Card from '@/components/ui/Card/Card'
import EmptyState from '@/components/ui/EmptyState/EmptyState'
import Spinner from '@/components/ui/Spinner/Spinner'
import PageContainer from '@/components/layout/pageContainer/PageContainer'
import { useToast } from '@/components/ui/Toast/Toast'
import type { SummaryResponse } from '../types'
import { loadLastSummary } from '../lib/storage'
import styles from './summary.module.css'

const LENGTH_LABEL = { short: '짧게', medium: '보통', long: '자세히' } as const
const STYLE_LABEL = { bullet: '개조식', prose: '서술형' } as const

/* 자료실 '추가 내용' 칸에 들어갈 텍스트 (핵심 포인트·키워드·예상 문제) */
function toExtraText(data: SummaryResponse) {
  return toPlainText(data).split('\n').slice(4).join('\n').trim()
}

function toPlainText(data: SummaryResponse) {
  const r = data.result
  return [
    `# ${r.title}`,
    '',
    r.summary,
    '',
    '## 핵심 포인트',
    ...r.keyPoints.map((p) => `- ${p}`),
    '',
    `키워드: ${r.keywords.join(', ')}`,
    ...(r.questions.length
      ? [
          '',
          '## 예상 문제',
          ...r.questions.map(
            (q, i) => `${i + 1}. ${q.question}\n   → ${q.answer}`,
          ),
        ]
      : []),
  ].join('\n')
}

/* /ai/result 페이지 전체 화면.
   ⚠️ 보안: AI 응답은 믿을 수 없는 데이터이므로 dangerouslySetInnerHTML을 쓰지 않음.
   React는 {문자열}을 자동 이스케이프하므로 <script>가 들어와도 글자로만 보임 (XSS 방지) */
export default function SummaryResultView() {
  const { showToast } = useToast()
  // undefined: 아직 읽는 중 / null: 결과 없음
  const [data, setData] = useState<SummaryResponse | null | undefined>(
    undefined,
  )
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)

  useEffect(() => {
    // sessionStorage는 브라우저에만 있으므로 화면이 뜬 뒤에 읽음
    setData(loadLastSummary())
  }, [])

  const copy = async () => {
    if (!data) return
    try {
      await navigator.clipboard.writeText(toPlainText(data))
      showToast('요약 내용을 복사했어요', 'success')
    } catch {
      showToast('복사하지 못했어요', 'error')
    }
  }

  const save = async () => {
    if (!data || saving) return
    setSaving(true)
    try {
      const response = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.result.title,
          summary: data.result.summary,
          content: toExtraText(data),
          fileName: data.fileName,
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message ?? '저장하지 못했어요')
      setSavedId(body.lecture.id)
      showToast('자료실에 저장했어요', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '저장하지 못했어요', 'error')
    } finally {
      setSaving(false)
    }
  }

  const actions = (
    <>
      <LinkButton href="/ai" variant="secondary">
        다른 PDF 요약하기
      </LinkButton>
      {data && (
        <Button variant="secondary" onClick={copy}>
          복사
        </Button>
      )}
      {savedId ? (
        <LinkButton href={`/library/${savedId}`}>자료실에서 보기</LinkButton>
      ) : (
        <Button onClick={save} disabled={!data || saving}>
          {saving ? '저장 중...' : '자료실에 저장'}
        </Button>
      )}
    </>
  )

  return (
    <PageContainer
      title="요약 결과"
      description="AI가 정리한 내용을 확인하고 자료실에 저장하세요."
      actions={actions}
    >
      {data === undefined && (
        <Card>
          <EmptyState icon={<Spinner />} title="불러오는 중이에요" />
        </Card>
      )}

      {data === null && (
        <Card>
          <EmptyState
            title="표시할 요약 결과가 없어요"
            description="PDF를 올려서 먼저 요약을 만들어 주세요."
            action={<LinkButton href="/ai">PDF 요약하러 가기</LinkButton>}
          />
        </Card>
      )}

      {data && <ResultBody data={data} />}
    </PageContainer>
  )
}

function ResultBody({ data }: { data: SummaryResponse }) {
  const { result, options } = data

  return (
    <>
      <Card
        title={result.title}
        description={`${data.fileName} · ${data.pageCount}페이지 · ${LENGTH_LABEL[options.length]} · ${STYLE_LABEL[options.style]}`}
      >
        {data.truncated && (
          <p className={styles.notice}>
            자료가 길어서 앞부분 위주로 요약했어요. 정확한 요약이 필요하면 PDF를
            나눠서 올려 주세요.
          </p>
        )}
        <p className={styles.summaryText}>{result.summary}</p>
      </Card>

      {result.keyPoints.length > 0 && (
        <Card title="핵심 포인트">
          <ul className={styles.list}>
            {result.keyPoints.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </Card>
      )}

      {result.keywords.length > 0 && (
        <Card title="키워드">
          <div className={styles.tags}>
            {result.keywords.map((k, i) => (
              <span key={i} className={styles.tag}>
                {k}
              </span>
            ))}
          </div>
        </Card>
      )}

      {result.questions.length > 0 && (
        <Card title="예상 문제" description="문제를 누르면 정답이 보여요.">
          <ol className={styles.quiz}>
            {result.questions.map((q, i) => (
              <li key={i}>
                <details>
                  <summary>{q.question}</summary>
                  <p className={styles.answer}>{q.answer}</p>
                </details>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </>
  )
}
