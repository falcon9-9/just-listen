import { useEffect, useRef, useState } from "react";
import { HARD_SUBTITLE_REGION, VideoFrameSource } from "./capture/VideoFrameSource";
import type { OcrAttempt, OcrTestStatus, TranscriptSegment } from "./model";
import type {
  OcrEngine,
  OcrProgress
} from "./recognition/OcrEngine";
import { cleanOcrText, SegmentAssembler } from "./recognition/SegmentAssembler";
import { detectSubtitleLanguage } from "./recognition/detectSubtitleLanguage";
import { getOcrLanguageSummary } from "./recognition/languageRegistry";

type OcrTestPanelProps = {
  video: HTMLVideoElement | null;
};

const SAMPLE_INTERVAL_MS = 650;

function wait(durationMs: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, durationMs));
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function statusLabel(status: OcrTestStatus) {
  switch (status) {
    case "loading":
      return "加载模型";
    case "scanning":
      return "识别中";
    case "paused":
      return "等待播放";
    case "stopped":
      return "已停止";
    case "error":
      return "出错";
    default:
      return "未开始";
  }
}

export function OcrTestPanel({ video }: OcrTestPanelProps) {
  const frameSource = useRef(new VideoFrameSource());
  const assembler = useRef(new SegmentAssembler());
  const engine = useRef<OcrEngine | null>(null);
  const runId = useRef(0);

  const [collapsed, setCollapsed] = useState(false);
  const [status, setStatus] = useState<OcrTestStatus>("idle");
  const [progress, setProgress] = useState<OcrProgress | null>(null);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [lastAttempt, setLastAttempt] = useState<OcrAttempt | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      runId.current += 1;
      void engine.current?.terminate();
    };
  }, []);

  useEffect(() => {
    runId.current += 1;
    assembler.current.clear();
    setSegments([]);
    setLastAttempt(null);
    setAttemptCount(0);
    setProgress(null);
    setStatus("idle");
    setError(null);
    void engine.current?.terminate();
    engine.current = null;
  }, [video]);

  async function start() {
    if (!video) {
      setError("没有找到可识别的视频元素。");
      setStatus("error");
      return;
    }

    const currentRun = runId.current + 1;
    runId.current = currentRun;
    setError(null);
    setStatus("loading");

    if (!engine.current) {
      let engineModule: typeof import("./recognition/OcrEngine");

      try {
        engineModule = (await import(
          /* @vite-ignore */ chrome.runtime.getURL("ocr/paddle-engine.js")
        )) as typeof import("./recognition/OcrEngine");
      } catch (caughtError) {
        if (runId.current !== currentRun) {
          return;
        }

        runId.current += 1;
        setError(
          caughtError instanceof Error
            ? `OCR 模块加载失败：${caughtError.message}`
            : "OCR 模块加载失败。"
        );
        setStatus("error");
        return;
      }

      if (runId.current !== currentRun) {
        return;
      }

      engine.current = new engineModule.OcrEngine(setProgress);
    }

    while (runId.current === currentRun) {
      if (video.paused || video.ended || video.readyState < 2) {
        setStatus("paused");
        await wait(300);
        continue;
      }

      setStatus("scanning");
      const capturedAt = video.currentTime;
      const startedAt = performance.now();

      try {
        const frame = frameSource.current.capture(video);
        const result = await engine.current.recognize(frame);

        if (runId.current !== currentRun) {
          break;
        }

        const durationMs = performance.now() - startedAt;
        const text = cleanOcrText(result.text);
        setAttemptCount((count) => count + 1);
        setLastAttempt({
          confidence: result.confidence,
          detectedBoxes: result.detectedBoxes,
          durationMs,
          failureReason:
            result.text.length > 0
              ? undefined
              : result.route.evaluations.at(-1)?.reason,
          languageLabel: result.languageLabel,
          lockedLanguage: result.lockedLanguage,
          modelKey: result.modelKey,
          recognizedCount: result.recognizedCount,
          routeStatus: result.route.status,
          selectedCount: result.selectedCount,
          text,
          videoTime: capturedAt
        });

        if (text) {
          const nextSegments = assembler.current.addSample(
            capturedAt,
            text,
            result.confidence
          );
          setSegments([...nextSegments]);
        }
      } catch (caughtError) {
        if (runId.current !== currentRun) {
          break;
        }

        runId.current += 1;
        await engine.current?.terminate();
        engine.current = null;
        setError(
          caughtError instanceof Error ? caughtError.message : "OCR 识别失败。"
        );
        setStatus("error");
        break;
      }

      const elapsed = performance.now() - startedAt;
      await wait(Math.max(80, SAMPLE_INTERVAL_MS - elapsed));
    }
  }

  function stop() {
    runId.current += 1;
    setStatus("stopped");
  }

  function clear() {
    assembler.current.clear();
    setSegments([]);
    setLastAttempt(null);
    setAttemptCount(0);
    setError(null);
    engine.current?.resetSession();
  }

  const running = status === "loading" || status === "scanning" || status === "paused";
  const detectedLanguage = detectSubtitleLanguage(segments);
  const languageSummary = getOcrLanguageSummary();

  return (
    <section className="jl-ocr-test" data-collapsed={collapsed || undefined}>
      <header className="jl-ocr-test__header">
        <div>
          <div className="jl-ocr-test__eyebrow">P1 LAB</div>
          <h2>硬字幕 PaddleOCR Test</h2>
        </div>
        <button
          aria-label={collapsed ? "展开 OCR Test" : "收起 OCR Test"}
          className="jl-ocr-test__collapse"
          onClick={() => setCollapsed((value) => !value)}
          type="button"
        >
          {collapsed ? "+" : "−"}
        </button>
      </header>

      {!collapsed && (
        <>
          <div className="jl-ocr-test__toolbar">
            <span className="jl-ocr-test__status" data-status={status}>
              <i /> {statusLabel(status)}
            </span>
            <span>底部 {Math.round(HARD_SUBTITLE_REGION.height * 100)}%</span>
            <span>{languageSummary}</span>
            <span>
              路由：
              {lastAttempt
                ? lastAttempt.routeStatus === "locked"
                  ? `已锁定 ${lastAttempt.languageLabel}`
                  : `尝试 ${lastAttempt.languageLabel}`
                : "未开始"}
            </span>
            <span>
              字幕：{detectedLanguage.label}
              {detectedLanguage.confidence > 0 &&
                ` ${detectedLanguage.confidence}%`}
            </span>
            <span>{attemptCount} 次扫描</span>
          </div>

          {status === "loading" && progress && (
            <div className="jl-ocr-test__progress">
              <div style={{ width: `${Math.round(progress.progress * 100)}%` }} />
              <span>{progress.status}</span>
            </div>
          )}

          {error && <div className="jl-ocr-test__error">{error}</div>}

          <div className="jl-ocr-test__actions">
            <button disabled={running} onClick={() => void start()} type="button">
              开始识别
            </button>
            <button disabled={!running} onClick={stop} type="button">
              停止
            </button>
            <button disabled={!segments.length && !lastAttempt} onClick={clear} type="button">
              清空
            </button>
          </div>

          {lastAttempt && (
            <div className="jl-ocr-test__last">
              <span>最近一次</span>
              <b>{formatTime(lastAttempt.videoTime)}</b>
              <span>{Math.round(lastAttempt.confidence)}%</span>
              <span>{Math.round(lastAttempt.durationMs)}ms</span>
              <span>
                {lastAttempt.detectedBoxes} 框 · {lastAttempt.recognizedCount} 识别 ·{" "}
                {lastAttempt.selectedCount} 保留
              </span>
              <span>{lastAttempt.modelKey ?? "未选模型"}</span>
              <span>
                {lastAttempt.routeStatus === "locked" ? "已锁定" : "候选"}：
                {lastAttempt.languageLabel}
              </span>
              {!lastAttempt.text && (
                <em>
                  {lastAttempt.failureReason ||
                  (lastAttempt.detectedBoxes === 0
                    ? "未检测到文字框"
                    : lastAttempt.recognizedCount === 0
                      ? "检测到文字框，但识别置信度不足"
                      : "识别到候选文字，但被字幕规则过滤")}
                </em>
              )}
            </div>
          )}

          <div className="jl-ocr-test__list">
            {segments.length === 0 ? (
              <div className="jl-ocr-test__empty">
                播放到有硬字幕的位置，然后点击「开始识别」。
              </div>
            ) : (
              segments.map((segment) => (
                <article className="jl-ocr-test__item" key={segment.id}>
                  <div className="jl-ocr-test__time">
                    {formatTime(segment.start)}
                    <span>{Math.round(segment.confidence)}%</span>
                  </div>
                  <div className="jl-ocr-test__text">{segment.text}</div>
                  <small>{segment.samples} 次命中</small>
                </article>
              ))
            )}
          </div>

          <footer>模型按需加载 · 结果仅在当前内存 · 不保存截图</footer>
        </>
      )}
    </section>
  );
}
