// PDF 업로드 · AI 요약 기능에서 클라이언트/서버가 함께 쓰는 타입
// (유한서님 DB 저장 쪽에서도 SummaryResponse를 그대로 받아 쓰면 됩니다)

export type SummaryLength = "short" | "medium" | "long";
export type SummaryStyle = "bullet" | "prose";

export interface SummaryOptions {
  length: SummaryLength; // 짧게 / 보통 / 자세히
  style: SummaryStyle; // 개조식 / 서술형
  includeQuestions: boolean; // 예상 문제 포함 여부
}

export interface QuizItem {
  question: string;
  answer: string;
}

/** AI가 만들어 주는 요약 본문 */
export interface SummaryContent {
  title: string; // 자료 제목(추정)
  summary: string; // 요약 본문
  keyPoints: string[]; // 핵심 포인트
  keywords: string[]; // 키워드
  questions: QuizItem[]; // 예상 문제 (옵션 꺼져 있으면 빈 배열)
}

/** /api/summarize 성공 응답 */
export interface SummaryResponse {
  ok: true;
  fileName: string;
  pageCount: number;
  charCount: number; // 추출된 글자 수
  truncated: boolean; // 너무 길어서 뒷부분을 잘랐는지
  options: SummaryOptions;
  result: SummaryContent;
  createdAt: string; // ISO 문자열
}

/** /api/summarize 실패 응답 */
export interface SummaryErrorResponse {
  ok: false;
  code: SummaryErrorCode;
  message: string; // 사용자에게 그대로 보여 줘도 되는 메시지
}

export type SummaryErrorCode =
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "NO_FILE"
  | "TOO_LARGE"
  | "NOT_PDF"
  | "TOO_MANY_PAGES"
  | "NO_TEXT"
  | "BAD_OPTIONS"
  | "AI_FAILED"
  | "SERVER_ERROR";

export const DEFAULT_OPTIONS: SummaryOptions = {
  length: "medium",
  style: "bullet",
  includeQuestions: false,
};

// 클라이언트·서버가 같은 제한값을 쓰도록 한 곳에 모아 둠
export const LIMITS = {
  maxFileBytes: 10 * 1024 * 1024, // 10MB
  maxPages: 80,
  maxChars: 60_000, // AI에 보내는 최대 글자 수 (넘으면 앞부분만 사용)
} as const;
