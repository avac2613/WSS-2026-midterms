import "server-only";
import { extractText, getDocumentProxy } from "unpdf";
import { LIMITS } from "../types";

export class PdfError extends Error {
  constructor(
    public code: "NOT_PDF" | "TOO_MANY_PAGES" | "NO_TEXT",
    message: string,
  ) {
    super(message);
  }
}

/**
 * 파일 내용이 실제 PDF인지 확인한다.
 * 확장자나 Content-Type은 클라이언트가 마음대로 바꿀 수 있으므로
 * 파일 앞부분의 시그니처(매직 바이트) "%PDF-" 를 직접 검사한다.
 */
export function isPdfSignature(bytes: Uint8Array): boolean {
  // 일부 PDF는 앞에 쓰레기 바이트가 조금 붙어 있을 수 있어 앞 1KB 안에서 찾음
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 1024));
  return head.includes("%PDF-");
}

export interface PdfInfo {
  pageCount: number;
  charCount: number; // 글자로 추출되는 분량 (사진 위주 PDF면 0에 가까움)
}

/**
 * PDF가 정상적으로 열리는지, 페이지 수가 제한 안인지 검사한다.
 * 요약은 PDF 파일 자체를 Gemini에 보내서 하므로(사진·도표도 읽음)
 * 여기서 글자를 못 뽑아도 실패로 처리하지 않는다.
 * 파일은 디스크에 저장하지 않고 메모리에서만 처리한다.
 */
export async function inspectPdf(bytes: Uint8Array): Promise<PdfInfo> {
  if (!isPdfSignature(bytes)) {
    throw new PdfError("NOT_PDF", "PDF 파일만 업로드할 수 있어요.");
  }

  let pdf: Awaited<ReturnType<typeof getDocumentProxy>>;
  try {
    // pdf.js가 원본 배열을 넘겨받아 비울 수 있으므로 복사본을 넘김
    pdf = await getDocumentProxy(bytes.slice());
  } catch {
    // 손상된 파일, 암호 걸린 파일 등
    throw new PdfError(
      "NOT_PDF",
      "PDF를 열 수 없어요. 손상되었거나 암호가 걸린 파일인지 확인해 주세요.",
    );
  }

  try {
    const pageCount = pdf.numPages;
    if (pageCount > LIMITS.maxPages) {
      throw new PdfError(
        "TOO_MANY_PAGES",
        `${LIMITS.maxPages}페이지 이하의 PDF만 요약할 수 있어요.`,
      );
    }

    let charCount = 0;
    try {
      const { text } = await extractText(pdf, { mergePages: true });
      charCount = text.replace(/\s+/g, "").length;
    } catch {
      // 글자 추출 실패는 무시 (사진 위주 PDF일 수 있음)
    }
    return { pageCount, charCount };
  } finally {
    // 메모리 정리. unpdf 버전에 따라 destroy가 없을 수 있어 있는 경우에만 호출
    const doc = pdf as unknown as { destroy?: () => unknown };
    if (typeof doc.destroy === "function") {
      try {
        await doc.destroy();
      } catch {
        /* 정리 실패는 무시 */
      }
    }
  }
}
