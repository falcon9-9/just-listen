/* ============================================================
   app.jsx — orchestrator. Owns clock + all extension state,
   renders the Bilibili page with the JustListen overlay.
   ============================================================ */
const { useState, useEffect, useRef, useCallback } = React;

const QS = new URLSearchParams(location.search);

function App(){
  // ---- playback clock ----
  const [time, setTime] = useState(249);      // start on "你这什么表情？"
  const [playing, setPlaying] = useState(true);

  // ---- extension: P0 mask ----
  const [dock, setDock] = useState(["rail","tab","ghost","dot"].includes(QS.get("dock")) ? QS.get("dock") : "rail");
  const [maskOn, setMaskOn] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [geom, setGeom] = useState({ x:0, y:0, w:0, h:0 });
  const [blur, setBlur] = useState(15);
  const [tint, setTint] = useState(0.34);
  const geomInit = useRef(false);

  // ---- extension: P1 transcript ----
  const [transcriptOpen, setTranscriptOpen] = useState(QS.get("t") !== "0");
  const [selectedIdx, setSelectedIdx] = useState(3);   // the "你这什么表情？" line
  const [speed, setSpeed] = useState(0.75);
  const [repeatN, setRepeatN] = useState(3);
  const [looping, setLooping] = useState(false);
  const loopPass = useRef(0);
  const [loopPassView, setLoopPassView] = useState(0);

  // ---- onboarding ----
  const [coach, setCoach] = useState(QS.get("coach") !== "0");

  const stageRef = useRef(null);
  const listRef = useRef(null);
  const rafRef = useRef(0);

  const playingIdx = activeIndexFor(time);
  const currentLine = TRANSCRIPT[playingIdx] || TRANSCRIPT[selectedIdx];

  // ---- init mask geometry from stage size ----
  const layoutMask = useCallback(()=>{
    const el = stageRef.current; if(!el) return;
    const r = el.getBoundingClientRect();
    setGeom({ x: r.width*0.19, y: r.height*0.76, w: r.width*0.62, h: r.height*0.18 });
  },[]);
  useEffect(()=>{
    if(!geomInit.current){ layoutMask(); geomInit.current = true; }
    const onR = ()=>{ if(!geomInit.current) return; layoutMask(); };
    window.addEventListener("resize", onR);
    return ()=>window.removeEventListener("resize", onR);
  },[layoutMask]);

  // ---- the clock ----
  useEffect(()=>{
    let last = performance.now();
    const tick = (now)=>{
      const dt = Math.min(0.05, (now-last)/1000); last = now;
      if(playing){
        setTime(prev=>{
          const eff = looping ? speed : 1;
          let t = prev + dt*eff;
          if(looping){
            const L = TRANSCRIPT[selectedIdx];
            if(t >= L.end){
              loopPass.current += 1;
              if(repeatN==='∞' || loopPass.current < repeatN){
                setLoopPassView(loopPass.current+1);
                return L.start;        // loop back
              } else {
                // finished the requested passes → stop, resume normal
                setLooping(false); loopPass.current = 0; setLoopPassView(0);
                return L.end;
              }
            }
          }
          if(t >= VIDEO.duration) return VIDEO.duration;
          return t;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(rafRef.current);
  },[playing, looping, speed, repeatN, selectedIdx]);

  // ---- keep active transcript line in view ----
  useEffect(()=>{
    const list = listRef.current; if(!list) return;
    const el = list.querySelector(`[data-tr="${selectedIdx}"]`);
    if(el) el.scrollIntoView({ block:"nearest", behavior:"smooth" });
  },[selectedIdx]);

  // ---- keyboard: hold Space = reveal ; K = play/pause ----
  useEffect(()=>{
    const down = (e)=>{
      if(e.code==="Space"){
        e.preventDefault();
        if(maskOn) setRevealing(true);
      } else if(e.key==="k" || e.key==="K"){
        setPlaying(p=>!p);
      }
    };
    const up = (e)=>{ if(e.code==="Space") setRevealing(false); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return ()=>{ window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  },[maskOn]);

  // ---- actions ----
  const toggleMask = ()=>{ setMaskOn(m=>!m); setCoach(false); };
  const setReveal = (v)=> setRevealing(maskOn && v);
  const toggleTranscript = ()=> setTranscriptOpen(o=>!o);

  const selectSentence = (i)=>{
    setSelectedIdx(i);
    setTime(TRANSCRIPT[i].start + 0.01);
    setPlaying(true);
    if(looping){ setLooping(false); loopPass.current = 0; setLoopPassView(0); }
  };

  const startRepeat = (idx)=>{
    const i = (typeof idx==="number") ? idx : (selectedIdx>=0 ? selectedIdx : Math.max(0,playingIdx));
    if(looping){ // toggle off
      setLooping(false); loopPass.current = 0; setLoopPassView(0); return;
    }
    setSelectedIdx(i);
    setTime(TRANSCRIPT[i].start + 0.01);
    setPlaying(true);
    loopPass.current = 0; setLoopPassView(1); setLooping(true);
    setCoach(false);
  };
  const stopRepeat = ()=>{ setLooping(false); loopPass.current = 0; setLoopPassView(0); };

  const seek = (e)=>{
    const r = e.currentTarget.getBoundingClientRect();
    const p = (e.clientX - r.left)/r.width;
    setTime(Math.max(0, Math.min(VIDEO.duration, p*VIDEO.duration)));
    if(looping) stopRepeat();
  };

  return (
    <div className="page">
      <BiliHeader />
      <div className="bili-main">
        {/* ---------------- video column ---------------- */}
        <div className="video-col">
          <VideoMeta />

          <div className="stage-wrap">
            <div className={"player controls-on"} ref={stageRef}>
              {/* video content: real frame if present, else cinematic fallback */}
              <div className="video-scene" />
              <img className="video-frame" src="assets/video-frame.jpg" alt=""
                   onError={(e)=>{ e.currentTarget.classList.add("missing"); }} />

              {/* burned-in bilingual subtitle (cannot be turned off by the player) */}
              {currentLine && (
                <div className="burned-sub">
                  <div className="zh">{currentLine.text}</div>
                  <div className="en">{currentLine.trans}</div>
                </div>
              )}

              {/* P0 frosted mask */}
              {maskOn && (
                <FrostedMask geom={geom} setGeom={setGeom} revealing={revealing}
                             stageRef={stageRef} blur={blur} tint={tint} />
              )}
              <RevealFlash on={revealing} />

              {/* loop status */}
              <LoopStatus show={looping} line={TRANSCRIPT[selectedIdx]?.text}
                          current={loopPassView} total={repeatN} speed={speed} onStop={stopRepeat} />

              {/* right-edge dock controller */}
              <EdgeDock variant={dock} maskOn={maskOn} toggleMask={toggleMask}
                        transcriptOpen={transcriptOpen} toggleTranscript={toggleTranscript} />

              {/* onboarding coach */}
              {coach && (
                <div className="coach fade-in" style={{ left:"50%", top:70, transform:"translateX(-50%)", textAlign:"center" }}>
                  <div className="ch-t" style={{justifyContent:"center"}}><Icons.sparkle width={15}/> 别看字，听听看</div>
                  这一话字幕烧录在画面里，关不掉。开毛玻璃遮住它，先用耳朵理解这一句。
                  <div className="ch-actions" style={{justifyContent:"center"}}>
                    <button className="ch-skip" onClick={()=>setCoach(false)}>不用了</button>
                    <button className="ch-btn" onClick={()=>setCoach(false)}>知道了</button>
                  </div>
                </div>
              )}

              {/* Bili player control bar (variant B injects here) */}
              <div className="pbar">
                <div className="pbar-progress" onClick={seek}>
                  <div className="buf" />
                  <div className="played" style={{ width:`${(time/VIDEO.duration)*100}%` }} />
                  <div className="knob" style={{ left:`${(time/VIDEO.duration)*100}%` }} />
                </div>
                <div className="pbar-row">
                  <button className="pb-btn" onClick={()=>setPlaying(p=>!p)}>
                    {playing ? <Icons.pause size={22}/> : <Icons.play size={22}/>}
                  </button>
                  <button className="pb-btn"><Icons.volume width={20}/></button>
                  <span className="pbar-time">{fmt(time)} / {fmt(VIDEO.duration)}</span>
                  <div className="pbar-spacer" />
                  <span className="pbar-tag">1.0×</span>
                  <span className="pbar-tag">高清 1080P</span>
                  <button className="pb-btn"><Icons.gear width={19}/></button>
                  <button className="pb-btn"><Icons.expand width={19}/></button>
                </div>
              </div>
            </div>

            {/* bili below-player bar */}
            <div className="player-underbar">
              <span className="watching">74人正在看</span>
              <button className="pb-btn" style={{color:"var(--ink-3)"}}><Icons.eyeOff width={17}/></button>
              <div className="pu-input">已关闭弹幕 <span className="send">发送</span></div>
            </div>
          </div>

          <ActionBar />
        </div>

        {/* ---------------- right column ---------------- */}
        <div className="side-col">
          <UpCard />
          <EpisodeList />
          <RecList />
        </div>
      </div>

      {/* floating transcript panel — overlays the right side of the page */}
      <TranscriptPanel
        open={transcriptOpen} onClose={()=>setTranscriptOpen(false)}
        playingIdx={playingIdx} selectedIdx={selectedIdx} onSelect={selectSentence}
        revealAll={revealing} speed={speed} setSpeed={setSpeed}
        repeatN={repeatN} setRepeatN={setRepeatN} looping={looping}
        onRepeat={()=>startRepeat(selectedIdx)} listRef={listRef} />

      <Tweaks dock={dock} setDock={setDock} blur={blur} setBlur={setBlur} tint={tint} setTint={setTint} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
