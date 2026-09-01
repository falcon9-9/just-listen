const Icon = ({ name, size = 16 }) => {
  const icons = {
    hide: "◒",
    reveal: "◉",
    repeat: "↻",
    transcript: "≡",
    close: "×",
    chevron: "›",
    pause: "Ⅱ",
    play: "▶",
    check: "✓",
    drag: "⠿"
  };
  return <span className="icon" style={{ fontSize: `${size}px` }} aria-hidden="true">{icons[name]}</span>;
};

const Segmented = ({ options, value, onChange, labeler }) => (
  <div className="segmented" role="group">
    {options.map((option) => (
      <button
        type="button"
        key={String(option)}
        className={Object.is(option, value) ? "segment active" : "segment"}
        onClick={() => onChange(option)}
      >
        {labeler(option)}
      </button>
    ))}
  </div>
);

const Toolbar = ({
  maskOn,
  reveal,
  repeatOn,
  transcriptOpen,
  onToggleMask,
  onRevealStart,
  onRevealEnd,
  onToggleRepeat,
  onToggleTranscript
}) => (
  <div className={maskOn ? "jl-toolbar expanded" : "jl-toolbar compact"} aria-label="JustListen 控制器">
    <button type="button" className={maskOn ? "tool-button active" : "tool-button primary"} onClick={onToggleMask}>
      <Icon name={maskOn ? "check" : "hide"} />
      <span>{maskOn ? "字幕已隐藏" : "别看字"}</span>
      <kbd>H</kbd>
    </button>
    {maskOn && (
      <>
        <div className="tool-divider"></div>
        <button
          type="button"
          className={reveal ? "tool-button pressing" : "tool-button"}
          onPointerDown={onRevealStart}
          onPointerUp={onRevealEnd}
          onPointerLeave={onRevealEnd}
          onPointerCancel={onRevealEnd}
        >
          <Icon name="reveal" />
          <span>按住看字幕</span>
          <kbd>R</kbd>
        </button>
        <button type="button" className={repeatOn ? "tool-button repeat-live" : "tool-button"} onClick={onToggleRepeat}>
          <Icon name={repeatOn ? "pause" : "repeat"} />
          <span>{repeatOn ? "停止循环" : "重复此句"}</span>
        </button>
      </>
    )}
    <button type="button" className={transcriptOpen ? "tool-button active" : "tool-button icon-only"} onClick={onToggleTranscript} aria-label="打开 Transcript">
      <Icon name="transcript" size={18} />
      {transcriptOpen && <span>Transcript</span>}
    </button>
  </div>
);

const TranscriptPanel = ({
  open,
  lines,
  activeId,
  selectedId,
  speed,
  repeatCount,
  repeatOn,
  repeatPass,
  onClose,
  onSelect,
  onSpeed,
  onRepeatCount,
  onToggleRepeat
}) => {
  const selected = lines.find((line) => line.id === selectedId);
  return (
    <aside className={open ? "transcript-panel open" : "transcript-panel"} aria-hidden={!open}>
      <header className="panel-header">
        <div>
          <div className="eyebrow">JUSTLISTEN</div>
          <h2>Transcript</h2>
        </div>
        <button type="button" className="round-button" onClick={onClose} aria-label="关闭 Transcript"><Icon name="close" size={22} /></button>
      </header>
      <div className="panel-context">
        <span className="live-dot"></span>
        <span>自动跟随播放</span>
        <span className="context-spacer"></span>
        <kbd>T</kbd>
      </div>
      <div className="transcript-list">
        {lines.map((line) => (
          <button
            type="button"
            key={line.id}
            className={`transcript-line ${line.id === activeId ? "current" : ""} ${line.id === selectedId ? "selected" : ""}`}
            onClick={() => onSelect(line.id)}
          >
            <span className="line-time">{line.time}</span>
            <span className="line-copy">
              <span className="line-en" lang="ja">{line.en}</span>
              <span className="line-zh" lang="zh">{line.zh}</span>
            </span>
            <Icon name="chevron" size={20} />
          </button>
        ))}
      </div>
      {selected && (
        <section className="repeat-sheet">
          <div className="repeat-sheet-head">
            <div>
              <span className="sheet-label">当前句</span>
              <p lang="ja">{selected.en}</p>
            </div>
            {repeatOn && <span className="pass-indicator">{repeatPass}/{repeatCount === Infinity ? "∞" : repeatCount}</span>}
          </div>
          <div className="setting-row">
            <span>速度</span>
            <Segmented options={speedOptions} value={speed} onChange={onSpeed} labeler={(v) => `${v}×`} />
          </div>
          <div className="setting-row">
            <span>次数</span>
            <Segmented options={repeatOptions} value={repeatCount} onChange={onRepeatCount} labeler={(v) => v === Infinity ? "∞" : `${v}×`} />
          </div>
          <button type="button" className={repeatOn ? "repeat-button running" : "repeat-button"} onClick={onToggleRepeat}>
            <Icon name={repeatOn ? "pause" : "repeat"} size={18} />
            <span>{repeatOn ? "停止循环" : "重复这一句"}</span>
          </button>
        </section>
      )}
    </aside>
  );
};

const Mask = ({ mask, visible, reveal, editing, onPointerDown }) => {
  if (!visible) return null;
  return (
    <div
      className={`subtitle-mask ${reveal ? "revealing" : ""} ${editing ? "editing" : ""}`}
      style={{ left: mask.x, top: mask.y, width: mask.w, height: mask.h }}
      onPointerDown={(event) => onPointerDown(event, "move")}
    >
      <div className="mask-shine"></div>
      <div className="mask-hint"><Icon name="drag" /><span>拖动遮罩</span></div>
      <button type="button" className="resize-handle" aria-label="调整遮罩大小" onPointerDown={(event) => onPointerDown(event, "resize")}></button>
    </div>
  );
};

Object.assign(window, {
  Icon,
  Segmented,
  Toolbar,
  TranscriptPanel,
  Mask
});
