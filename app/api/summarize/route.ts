import { NextRequest, NextResponse } from "next/server";
import { inspectPdf, PdfError } from "@/features/summary/server/pdf";
import { summarizePdf, AiError } from "@/features/summary/server/ai";
import { checkRateLimit } from "@/features/summary/server/rateLimit";
import {
  LIMITS,
  type SummaryErrorCode,
  type SummaryErrorResponse,
  type SummaryOptions,
  type SummaryResponse,
} from "@/features/summary/types";

// pdf 파싱은 Node 런타임에서 실행 (Edge X)
export const runtime = "nodejs";
// AI 응답이 오래 걸릴 수 있으니 넉넉하게 (Vercel 배포 시 적용)
export const maxDuration = 60;

function fail(
  status: number,
  code: SummaryErrorCode,
  message: string,
  headers?: HeadersInit,
) {
  const body: SummaryErrorResponse = { ok: false, code, message };
  return NextResponse.json(body, { status, headers });
}

/**
 * TODO(이승준님 로그인 파트와 연결): 세션에서 로그인한 사용자 id를 꺼내 반환.
 * 로그인 기능이 붙기 전까지는 null 대신 "guest"를 돌려 개발이 가능하게 해 둠.
 * 연결 후에는 로그인 안 했으면 null을 반환하도록 바꾸면 401이 나감.
 */
async function getCurrentUserId(_req: NextRequest): Promise<string | null> {
  return "guest";
}

function parseOptions(raw: FormDataEntryValue | null): SummaryOptions | null {
  try {
    const o = JSON.parse(
      typeof raw === "string" ? raw : "{}",
    ) as Partial<SummaryOptions>;
    // 화이트리스트 검증: 정해진 값 이외는 거부
    const length = o.length ?? "medium";
    const style = o.style ?? "bullet";
    if (!["short", "medium", "long"].includes(length)) return null;
    if (!["bullet", "prose"].includes(style)) return null;
    return { length, style, includeQuestions: o.includeQuestions === true };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  // 1) 인증
  const userId = await getCurrentUserId(req);
  if (!userId) return fail(401, "UNAUTHORIZED", "로그인이 필요해요.");

  // 2) 요청 횟수 제한 (로그인 사용자 기준, 게스트면 IP 기준)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(userId === "guest" ? `ip:${ip}` : `user:${userId}`);
  if (!rl.ok) {
    return fail(
      429,
      "RATE_LIMITED",
      `요청이 너무 많아요. ${Math.ceil(rl.retryAfterSec / 60)}분 뒤에 다시 시도해 주세요.`,
      {
        "Retry-After": String(rl.retryAfterSec),
      },
    );
  }

  // 3) 본문을 읽기 전에 Content-Length로 1차 크기 검사 (큰 파일을 메모리에 다 올리기 전에 차단)
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > LIMITS.maxFileBytes + 64 * 1024) {
    return fail(
      413,
      "TOO_LARGE",
      "파일이 너무 커요. 10MB 이하만 올릴 수 있어요.",
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail(400, "NO_FILE", "업로드 형식이 올바르지 않아요.");
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return fail(400, "NO_FILE", "PDF 파일을 선택해 주세요.");
  }
  // 4) 실제 파일 크기 재검사 (Content-Length는 조작 가능)
  if (file.size > LIMITS.maxFileBytes) {
    return fail(
      413,
      "TOO_LARGE",
      "파일이 너무 커요. 10MB 이하만 올릴 수 있어요.",
    );
  }
  // 5) 확장자/Content-Type 1차 검사 → 실제 내용(매직 바이트)은 inspectPdf에서 검사
  const looksPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!looksPdf) return fail(415, "NOT_PDF", "PDF 파일만 업로드할 수 있어요.");

  const options = parseOptions(form.get("options"));
  if (!options)
    return fail(400, "BAD_OPTIONS", "요약 옵션 값이 올바르지 않아요.");

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await inspectPdf(bytes);

    // 사용자가 요청을 취소하면 AI 호출도 같이 취소
    const result = await summarizePdf(bytes, options, req.signal);

    const body: SummaryResponse = {
      ok: true,
      // 파일명은 화면 표시/DB 저장용으로만 쓰고 경로로는 절대 사용하지 않음
      fileName: sanitizeFileName(file.name),
      pageCount: pdf.pageCount,
      charCount: pdf.charCount,
      truncated: false, // PDF 전체를 보내므로 자르지 않음
      options,
      result,
      createdAt: new Date().toISOString(),
    };
    return NextResponse.json(body);
  } catch (err) {
    if (err instanceof PdfError) {
      const status = err.code === "NOT_PDF" ? 415 : 422;
      return fail(status, err.code, err.message);
    }
    if (err instanceof AiError) {
      console.error("[summarize]", err.message);
      return fail(502, "AI_FAILED", err.userMessage + devDetail(err));
    }
    if (err instanceof Error && err.name === "AbortError") {
      return fail(499, "SERVER_ERROR", "요청이 취소되었어요.");
    }
    console.error("[summarize] unexpected", err);
    return fail(
      500,
      "SERVER_ERROR",
      "알 수 없는 오류가 발생했어요." + devDetail(err),
    );
  }
}

function sanitizeFileName(name: string): string {
  // 경로 구분자, 제어문자 제거 + 길이 제한
  return (
    name
      .replace(/[\\/]/g, "_")
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .slice(0, 200) || "document.pdf"
  );
}

/**
 * 개발 중(npm run dev)에만 화면에 실제 오류 내용을 덧붙여 원인을 찾기 쉽게 한다.
 * 배포(npm run build/start)에서는 내부 정보가 노출되지 않도록 빈 문자열을 반환한다.
 */
function devDetail(err: unknown): string {
  if (process.env.NODE_ENV === "production") return "";
  const msg = err instanceof Error ? err.message : String(err);
  return ` [개발용 상세: ${msg.slice(0, 300)}]`;
}
