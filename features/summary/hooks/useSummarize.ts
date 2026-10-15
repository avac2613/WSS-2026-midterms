"use client";

import { useCallback, useRef, useState } from "react";
import type { SummaryErrorResponse, SummaryOptions, SummaryResponse } from "../types";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: SummaryResponse }
  | { status: "error"; message: string };

export function useSummarize() {
  const [state, setState] = useState<State>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  const summarize = useCallback(async (file: File, options: SummaryOptions) => {
    abortRef.current?.abort(); // 이전 요청이 있으면 취소
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setState({ status: "loading" });

    const form = new FormData();
    form.append("file", file);
    form.append("options", JSON.stringify(options));

    try {
      const res = await fetch("/api/summarize", { method: "POST", body: form, signal: ctrl.signal });
      const json = (await res.json().catch(() => null)) as SummaryResponse | SummaryErrorResponse | null;

      if (!json) throw new Error("서버 응답을 읽을 수 없어요.");
      if (!json.ok) throw new Error(json.message);

      setState({ status: "success", data: json });
      return json;
    } catch (e) {
      if (ctrl.signal.aborted) return null; // 사용자가 취소한 경우는 조용히 무시
      setState({ status: "error", message: e instanceof Error ? e.message : "요약에 실패했어요." });
      return null;
    } finally {
      if (abortRef.current === ctrl) abortRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState({ status: "idle" });
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, summarize, cancel, reset };
}
