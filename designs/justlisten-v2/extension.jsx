/* ============================================================
   extension.jsx — the JustListen overlay
   Frosted subtitle mask (P0), right-edge dock controller,
   loop status, reveal flash, floating transcript panel (P1), tweaks.
   All presentational — App owns the state.
   ============================================================ */

/* -------- P0: draggable / resizable frosted mask -------- */
function FrostedMask({ geom, setGeom, revealing, stageRef, blur, tint }){
  const drag = React.useRef(null);
  const [active, setActive] = React.useState(false);

  function begin(e, mode){
    e.preventDefault(); e.stopPropagation();
    const stage = stageRef.current.getBoundingClientRect();
    drag.current = { mode, sx:e.clientX, sy:e.clientY, g:{...geom}, stage };
    setActive(true);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
  }
  function move(e){
    const d = drag.current; if(!d) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    const W = d.stage.width, H = d.stage.height;
    let { x, y, w, h } = d.g;
    const MIN = 60;
    if(d.mode==="move"){ x = d.g.x + dx; y = d.g.y + dy; }
    if(d.mode.includes("e")) w = d.g.w + dx;
    if(d.mode.includes("s")) h = d.g.h + dy;
    if(d.mode.includes("w")){ w = d.g.w - dx; x = d.g.x + dx; }
    if(d.mode.includes("n")){ h = d.g.h - dy; y = d.g.y + dy; }
    // clamp size
    w = Math.max(MIN, w); h = Math.max(MIN, h);
    // clamp within stage
    x = Math.max(0, Math.min(x, W - w));
    y = Math.max(0, Math.min(y, H - h));
    w = Math.min(w, W - x); h = Math.min(h, H - y);
    setGeom({ x, y, w, h });
  }
  function end(){
    drag.current = null; setActive(false);
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
  }

  const style = {
    left:geom.x, top:geom.y, width:geom.w, height:geom.h,
    background: revealing ? "transparent" : `rgba(20,22,28,${tint})`,
    backdropFilter: revealing ? "blur(0px)" : `blur(${blur}px) saturate(150%) brightness(1.04)`,
    WebkitBackdropFilter: revealing ? "blur(0px)" : `blur(${blur}px) saturate(150%) brightness(1.04)`,
  };
  return (
    <div className={"jl-mask"+(active?" dragging":"")+(revealing?" revealing":"")}
         style={style}
         onPointerDown={(e)=>begin(e,"move")}>
      <div className="jl-mask-hint"><Icons.drag width={16}/> 拖动到字幕上</div>
      <div className="edge-h" style={{top:-3}} onPointerDown={(e)=>begin(e,"n")} />
      <div className="edge-h" style={{bottom:-3}} onPointerDown={(e)=>begin(e,"s")} />
      <div className="edge-v" style={{left:-3}} onPointerDown={(e)=>begin(e,"w")} />
      <div className="edge-v" style={{right:-3}} onPointerDown={(e)=>begin(e,"e")} />
      <div className="grip tl" onPointerDown={(e)=>begin(e,"nw")} />
      <div className="grip tr" onPointerDown={(e)=>begin(e,"ne")} />
      <div className="grip bl" onPointerDown={(e)=>begin(e,"sw")} />
      <div className="grip br" onPointerDown={(e)=>begin(e,"se")} />
    </div>
  );
}

/* ============================================================
   Right-edge dock — the whole controller, collapsed to two icons.
   ① 别看字  = toggle the frosted mask (hide / reveal the subtitle)
   ② 字幕列表 = open / close the floating Transcript panel
   ============================================================ */
function EdgeDock({ variant='rail', maskOn, toggleMask, transcriptOpen, toggleTranscript }){
  const mask = (
    <button key="m" className={"dk-btn"+(maskOn?" on":"")} onClick={toggleMask} aria-pressed={maskOn}>
      {maskOn ? <Icons.eyeOff width={17}/> : <Icons.eye width={17}/>}
      <span className="dk-tip">别看字</span>
    </button>
  );
  const list = (
    <button key="l" className={"dk-btn"+(transcriptOpen?" on":"")} onClick={toggleTranscript} aria-pressed={transcriptOpen}>
      <Icons.list width={17}/>
      <span className="dk-tip">字幕列表</span>
    </button>
  );
  if(variant==='ghost') return <div className="jl-dock v-ghost">{mask}{list}</div>;
  if(variant==='tab')   return <div className="jl-dock v-tab">{mask}{list}</div>;
  if(variant==='dot')   return (
    <div className="jl-dock v-dot">
      <div className="dk-grip"><Icons.logo size={15}/></div>
      <div className="dk-pop">{mask}{list}</div>
    </div>
  );
  return <div className="jl-dock v-rail">{mask}{list}</div>;
}

/* -------- loop status chip on the player -------- */
function LoopStatus({ show, line, current, total, speed, onStop }){
  if(!show) return null;
  return (
    <div className={"loop-status on"}>
      <Icons.repeat width={15} className="spin" />
      <span>重复「{line}」</span>
      <span className="lp-x">{current}/{total==='∞'?'∞':total} · {speed}×</span>
      <div className="lp-stop" onClick={onStop}><Icons.stop size={12}/></div>
    </div>
  );
}

/* -------- reveal flash label -------- */
function RevealFlash({ on }){
  return (
    <div className={"reveal-flash"+(on?" on":"")}>
      <Icons.eye width={14}/> 显示字幕
    </div>
  );
}

/* ============================================================
   P1 — Transcript panel: a frosted card floating on the right,
   overlaying the page (references the v0 layout).
   ============================================================ */
function TranscriptPanel({ open, onClose, playingIdx, selectedIdx, onSelect, revealAll,
                           speed, setSpeed, repeatN, setRepeatN, looping, onRepeat, listRef }){
  const sel = TRANSCRIPT[selectedIdx];
  return (
    <aside className={"jl-transcript"+(open?" open":"")} aria-hidden={!open}>
      <header className="tr-head">
        <div className="tr-eyebrow"><Icons.logo size={14}/> JUSTLISTEN</div>
        <h2 className="tr-title">Transcript</h2>
        <button className="tr-close" onClick={onClose} aria-label="关闭字幕列表"><Icons.x width={17}/></button>
      </header>

      <div className="tr-context">
        <span className="live-dot" /> 自动跟随播放
        <span className="tr-kbd">按住 <b>空格</b> 临时看字幕</span>
      </div>

      <div className="tr-list jl-scroll" ref={listRef}>
        {TRANSCRIPT.map((t,i)=>{
          const isActive = i===selectedIdx;
          const isPlaying = i===playingIdx;
          return (
            <div key={i} data-tr={i}
                 className={"tr-item"+(isActive?" active":"")+(isPlaying?" playing":"")+(revealAll?" reveal-tr":"")}
                 onClick={()=>onSelect(i)}>
              <div className="tr-time">
                {isPlaying && <span className="now-dot" />}
                {fmt(t.start)}
              </div>
              <div className="tr-body">
                <div className="tr-text">{t.text}</div>
                <div className="tr-trans">{t.trans}</div>
              </div>
              <Icons.chevRight width={16} />
            </div>
          );
        })}
      </div>

      {/* bottom repeat sheet — controls for the selected sentence */}
      <div className="repeat-sheet">
        <div className="rs-current">
          <span className="rs-label">当前句</span>
          <span className="rs-sentence">{sel ? sel.text : "在上方选择一句"}</span>
        </div>
        <div className="rs-row">
          <span className="rs-k">速度</span>
          <div className="seg">
            {[0.5,0.75,1,1.25].map(s=>(
              <button key={s} className={speed===s?"on":""} onClick={()=>setSpeed(s)}>{s}×</button>
            ))}
          </div>
        </div>
        <div className="rs-row">
          <span className="rs-k">次数</span>
          <div className="seg">
            {[1,2,3,'∞'].map(n=>(
              <button key={n} className={repeatN===n?"on":""} onClick={()=>setRepeatN(n)}>{n}{n!=='∞'?'×':''}</button>
            ))}
          </div>
        </div>
        <button className={"repeat-btn full"+(looping?" looping":"")} onClick={onRepeat}>
          {looping ? <><Icons.stop size={13}/> 停止循环</> : <><Icons.repeat width={16}/> 重复这一句</>}
          {!looping && <span className="repeat-count-pill">{repeatN}{repeatN!=='∞'?'×':''} · {speed}×</span>}
        </button>
      </div>
    </aside>
  );
}

/* ============================================================
   Tweaks — frosted-glass knobs (in-page, own toggle)
   ============================================================ */
function Tweaks({ dock, setDock, blur, setBlur, tint, setTint }){
  const [open, setOpen] = React.useState(false);
  const docks = [
    { id:"rail",  name:"细轨",   desc:"极窄毛玻璃竖轨，两枚小图标；静止半隐，悬停提亮" },
    { id:"tab",   name:"书签条", desc:"贴边圆角小条，两格图标上下相接，最不占地方" },
    { id:"ghost", name:"独立圆点", desc:"两颗独立毛玻璃圆按钮，之间留白，最轻盈" },
    { id:"dot",   name:"点·展开", desc:"收起只剩一枚品牌小点，悬停才弹出两枚图标，最隐形" },
  ];
  return (
    <>
      <div className={"tweaks-panel"+(open?" open":"")}>
        <div className="tw-title">JustListen · 原型控制台</div>
        <div className="tw-group">
          <div className="tw-label">控制器形态</div>
          <div className="variant-opts">
            {docks.map(d=>(
              <button key={d.id} className={"variant-opt"+(dock===d.id?" on":"")} onClick={()=>setDock(d.id)}>
                <div className="vo-name"><span className="vo-dot" />{d.name}</div>
                <div className="vo-desc">{d.desc}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="tw-group" style={{marginBottom:4}}>
          <div className="tw-label">毛玻璃</div>
          <div className="tw-switchrow"><span className="swl">模糊强度</span><span style={{fontSize:12,color:"var(--ink-3)"}}>{blur}px</span></div>
          <input className="slider" type="range" min="4" max="26" value={blur} onChange={e=>setBlur(+e.target.value)} />
          <div className="tw-switchrow"><span className="swl">遮罩浓度</span><span style={{fontSize:12,color:"var(--ink-3)"}}>{Math.round(tint*100)}%</span></div>
          <input className="slider" type="range" min="10" max="70" value={tint*100} onChange={e=>setTint(+e.target.value/100)} />
        </div>
      </div>
      <button className="tweaks-toggle" onClick={()=>setOpen(o=>!o)}>
        <Icons.sliders width={18}/> {open?"收起":"Tweaks"}
      </button>
    </>
  );
}

Object.assign(window, {
  FrostedMask, EdgeDock,
  LoopStatus, RevealFlash, TranscriptPanel, Tweaks,
});
