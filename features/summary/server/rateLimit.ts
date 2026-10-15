import "server-only";

/**
 * 아주 단순한 메모리 기반 요청 제한 (사용자/IP당 N분에 M회).
 * AI 무료 한도를 한 사람이 다 써 버리거나, 반복 호출로 서버를 괴롭히는 걸 막는 용도.
 * ※ 서버 프로세스 메모리에만 있으므로 재시작하면 초기화되고, 서버가 여러 대면 공유되지 않음.
 *   발표/과제 수준에서는 충분하고, 실서비스라면 Redis 등으로 바꿔야 함.
 */
const WINDOW_MS = 10 * 60 * 1000; // 10분
const MAX_REQUESTS = 10;

const hits = new Map<string, number[]>();

export function checkRateLimit(key: string): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    hits.set(key, recent);
    return { ok: false, retryAfterSec: Math.ceil((WINDOW_MS - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);

  // 메모리 누수 방지: 가끔 오래된 키 정리
  if (hits.size > 5000) {
    for (const [k, arr] of hits) if (arr.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return { ok: true, retryAfterSec: 0 };
}
