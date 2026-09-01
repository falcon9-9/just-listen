const { useEffect, useMemo, useRef, useState } = React;

const App = () => {
  const stageRef = useRef(null);
  const [stageScale, setStageScale] = useState(1);
  const [maskOn, setMaskOn] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(2);
  const [currentTime, setCurrentTime] = useState(34.7);
  const [playing, setPlaying] = useState(true);
  const [repeatOn, setRepeatOn] = useState(false);
  const [repeatPass, setRepeatPass] = useState(1);
  const [speed, setSpeed] = useState(0.75);
  const [repeatCount, setRepeatCount] = useState(3);
  const [mask, setMask] = useState({ x: 180, y: 438, w: 560, h: 64 });
  const [gesture, setGesture] = useState(null);
  const [toast, setToast] = useState("按 H 开始，或点击「别看字」");
  const [firstRun, setFirstRun] = useState(true);

  const selectedLine = useMemo(() => transcriptLines.find((line) => line.id === selectedId), [selectedId]);
  const activeLine = useMemo(() => transcriptLines.find((line) => currentTime >= line.start && currentTime < line.end) || transcriptLines[transcriptLines.length - 1], [currentTime]);

  useEffect(() => {
    const updateScale = () => {
      const scale = Math.min(window.innerWidth / 1467, window.innerHeight / 836);
      setStageScale(scale);
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const id = window.setTimeout(() => setToast(""), 3600);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.repeat && event.key.toLowerCase() !== "r") return;
      if (event.key.toLowerCase() === "r" && maskOn) setReveal(true);
      if (event.key.toLowerCase() === "h") toggleMask();
      if (event.key.toLowerCase() === "t") setTranscriptOpen((open) => !open);
      if (event.key === "Escape") {
        setTranscriptOpen(false);
        setRepeatOn(false);
      }
    };
    const onKeyUp = (event) => {
      if (event.key.toLowerCase() === "r") setReveal(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [maskOn]);

  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setInterval(() => {
      setCurrentTime((time) => {
        if (repeatOn && selectedLine) {
          const next = time + 0.1 * speed;
          if (next >= selectedLine.end) {
            if (repeatCount !== Infinity && repeatPass >= repeatCount) {
              setRepeatOn(false);
              setRepeatPass(1);
              setToast("循环完成，继续观看");
              return selectedLine.end;
            }
            setRepeatPass((pass) => pass + 1);
            return selectedLine.start;
          }
          return next;
        }
        const next = time + 0.1;
        return next > 55 ? 31 : next;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [playing, repeatOn, selectedLine, speed, repeatCount, repeatPass]);

  useEffect(() => {
    if (!gesture) return undefined;
    const onMove = (event) => {
      const dx = (event.clientX - gesture.clientX) / stageScale;
      const dy = (event.clientY - gesture.clientY) / stageScale;
      if (gesture.mode === "move") {
        setMask((current) => ({
          ...current,
          x: clamp(gesture.mask.x + dx, 8, 929 - current.w - 8),
          y: clamp(gesture.mask.y + dy, 12, 523 - current.h - 12)
        }));
      } else {
        setMask((current) => ({
          ...current,
          w: clamp(gesture.mask.w + dx, 240, 929 - current.x - 8),
          h: clamp(gesture.mask.h + dy, 42, 180)
        }));
      }
    };
    const onUp = () => setGesture(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [gesture, stageScale]);

  const toggleMask = () => {
    setMaskOn((on) => {
      const next = !on;
      setToast(next ? "字幕已退后 · 按住 R 临时查看" : "字幕已显示");
      if (next) setFirstRun(false);
      return next;
    });
    setReveal(false);
  };

  const selectLine = (id) => {
    const line = transcriptLines.find((item) => item.id === id);
    setSelectedId(id);
    setCurrentTime(line.start + 0.08);
    setRepeatPass(1);
    setRepeatOn(false);
    setPlaying(true);
  };

  const toggleRepeat = () => {
    if (!selectedLine) return;
    setRepeatOn((on) => {
      const next = !on;
      if (next) {
        setCurrentTime(selectedLine.start);
        setRepeatPass(1);
        setPlaying(true);
        setToast(`开始循环 · ${speed}× · ${repeatCount === Infinity ? "无限" : `${repeatCount} 次`}`);
      }
      return next;
    });
  };

  const startMaskGesture = (event, mode) => {
    event.preventDefault();
    event.stopPropagation();
    setGesture({ mode, clientX: event.clientX, clientY: event.clientY, mask });
  };

  const sentenceProgress = selectedLine && repeatOn ? clamp((currentTime - selectedLine.start) / (selectedLine.end - selectedLine.start), 0, 1) : 0;
  const overallProgress = ((currentTime - 31) / 24) * 100;

  return (
    <main className="prototype-stage" data-screen-label="JustListen · Bilibili Player" style={{ "--stage-scale": stageScale }}>
      <div className="stage-canvas" ref={stageRef}>
        <img className="page-reference" src="assets/reference-page-v2.png" alt="Bilibili 视频页面参考" />
        <div className="page-veil"></div>

        <section className="video-surface" aria-label="视频播放器">
          <img className="video-frame" src="assets/reference-player-v2.png" alt="动画视频画面" />
          <div className="cinema-vignette"></div>
          <Mask mask={mask} visible={maskOn} reveal={reveal} editing={Boolean(gesture)} onPointerDown={startMaskGesture} />

          <div className={repeatOn ? "repeat-status visible" : "repeat-status"}>
            <span className="pulse-dot"></span>
            <span>正在重复</span>
            <strong>{repeatPass}/{repeatCount === Infinity ? "∞" : repeatCount}</strong>
            <span>·</span>
            <span>{speed}×</span>
            <div className="sentence-progress"><span style={{ width: `${sentenceProgress * 100}%` }}></span></div>
          </div>

          <button type="button" className="play-toggle" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "暂停" : "播放"}>
            <Icon name={playing ? "pause" : "play"} size={18} />
          </button>
          <div className="mock-player-progress"><span style={{ width: `${overallProgress}%` }}></span></div>

          <Toolbar
            maskOn={maskOn}
            reveal={reveal}
            repeatOn={repeatOn}
            transcriptOpen={transcriptOpen}
            onToggleMask={toggleMask}
            onRevealStart={() => setReveal(true)}
            onRevealEnd={() => setReveal(false)}
            onToggleRepeat={toggleRepeat}
            onToggleTranscript={() => setTranscriptOpen((open) => !open)}
          />

          {firstRun && !maskOn && (
            <div className="first-run-tip">
              <span>别看字，听听看。</span>
              <small>点击开始 · H</small>
            </div>
          )}
        </section>

        <TranscriptPanel
          open={transcriptOpen}
          lines={transcriptLines}
          activeId={activeLine.id}
          selectedId={selectedId}
          speed={speed}
          repeatCount={repeatCount}
          repeatOn={repeatOn}
          repeatPass={repeatPass}
          onClose={() => setTranscriptOpen(false)}
          onSelect={selectLine}
          onSpeed={setSpeed}
          onRepeatCount={setRepeatCount}
          onToggleRepeat={toggleRepeat}
        />

        <button type="button" className={transcriptOpen ? "transcript-tab hidden" : "transcript-tab"} onClick={() => setTranscriptOpen(true)}>
          <Icon name="transcript" size={18} />
          <span>Transcript</span>
          <span className="tab-live"></span>
        </button>

        <div className={toast ? "toast visible" : "toast"}>{toast}</div>
        <div className="prototype-note">
          <span>原型</span>
          <strong>H</strong> 隐藏字幕
          <strong>R</strong> 按住查看
          <strong>T</strong> Transcript
        </div>
      </div>
    </main>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
