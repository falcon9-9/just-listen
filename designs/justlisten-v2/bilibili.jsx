/* ============================================================
   bilibili.jsx — the host page chrome (presentational only).
   Recreated so JustListen reads as a native part of the player.
   ============================================================ */

function BiliHeader(){
  const nav = ["首页","番剧","直播","游戏中心","会员购","漫画","赛事"];
  return (
    <header className="bili-header">
      <div className="bili-logo">bili<b>bili</b></div>
      <nav className="bili-nav">
        {nav.map((n,i)=>(
          <a key={i} href="#">{n}{i===0 && <Icons.chevDown size={14}/>}</a>
        ))}
        <a href="#" style={{color:"var(--bili-pink)"}}>下载客户端</a>
      </nav>
      <div className="bili-search">
        <input defaultValue="reo从零开始的异世界" />
        <div className="go"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg></div>
      </div>
      <div className="bili-actions">
        <div className="bili-avatar" />
        {[["大会员",true],["消息","99+"],["动态",false],["收藏",false],["历史",false],["创作中心",false]].map(([t,b],i)=>(
          <div className="ba" key={i}>
            {b && <span className="badge">{b===true?"":b}</span>}
            <span>{t}</span>
          </div>
        ))}
        <button className="btn-post">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          投稿
        </button>
      </div>
    </header>
  );
}

function VideoMeta(){
  return (
    <>
      <h1 className="video-title">{VIDEO.title}</h1>
      <div className="video-meta">
        <span className="m"><Icons.play size={14}/>{VIDEO.plays}</span>
        <span className="m"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 10h8M8 14h5M4 5h16v12H7l-3 3z"/></svg>{VIDEO.danmaku}</span>
        <span>{VIDEO.date}</span>
      </div>
    </>
  );
}

function ActionBar(){
  return (
    <div className="action-bar">
      <div className="ab"><Icons.thumb/> 177</div>
      <div className="ab"><Icons.coin/> 47</div>
      <div className="ab"><Icons.star/> 180</div>
      <div className="ab"><Icons.share/> 8</div>
      <div className="spacer" />
      <div className="ab" style={{fontSize:13}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg> 稿件举报</div>
      <div className="ab" style={{fontSize:13}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg> 记笔记</div>
      <div className="ab"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg></div>
    </div>
  );
}

function UpCard(){
  return (
    <div className="up-card">
      <div className="up-avatar" />
      <div className="up-info">
        <div className="up-name">{VIDEO.up} <span style={{color:"var(--ink-3)",fontWeight:400,fontSize:12,display:"inline-flex",gap:3,alignItems:"center"}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v12H5.2L4 17.5z"/></svg>发消息</span></div>
        <div className="up-sign">{VIDEO.sign}</div>
      </div>
      <div className="up-btns">
        <button className="up-follow"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>关注 {VIDEO.followers}</button>
        <button className="up-charge"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>充电</button>
      </div>
    </div>
  );
}

function EpisodeList(){
  return (
    <div className="eplist-card">
      <div className="ep-title">
        <span className="t">从零开始的异世界生活 <span style={{color:"var(--ink-3)",fontWeight:400}}>(1/1)</span></span>
        <Icons.chevUp size={16} />
      </div>
      <div className="ep-sub">
        <span><Icons.play size={12}/> {VIDEO.plays}播放</span>
        <span>简介</span>
        <button className="sub-btn">订阅合集</button>
      </div>
      <div style={{padding:"4px 0"}}>
        {EPISODES.map((ep,i)=>(
          <div className={"ep-row"+(ep.active?" active":"")} key={i}>
            <span style={ep.dim?{color:"var(--ink-3)"}:{}}>
              {ep.active && <span style={{marginRight:6}}>▎</span>}{ep.name}
            </span>
            <span className="time">{ep.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecList(){
  return (
    <div className="rec-list">
      {RECS.map((r,i)=>(
        <div className="rec-card" key={i}>
          <div className="rec-thumb">
            {r.tag && <span className="tag4k">{r.tag}</span>}
            <span className="dur">{r.dur}</span>
          </div>
          <div className="rec-info">
            <div className="rt">{r.title}</div>
            <div className="ru"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>{r.up}</div>
            <div className="rstat"><span>▶ {r.plays}</span><span>❑ {r.dm}</span></div>
          </div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { BiliHeader, VideoMeta, ActionBar, UpCard, EpisodeList, RecList });
