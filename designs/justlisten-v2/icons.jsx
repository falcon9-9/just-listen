/* ============================================================
   icons.jsx — SF-Symbols-style line icons (thin, rounded)
   These are UI glyphs, not illustrations.
   ============================================================ */
const I = (p) => ({ width=20, height=20, stroke=1.7, ...r }={}) =>
  React.createElement("svg", {
    width, height, viewBox:"0 0 24 24", fill:"none",
    stroke:"currentColor", strokeWidth:stroke, strokeLinecap:"round", strokeLinejoin:"round",
    ...r
  }, p);

const Icons = {
  // brand mark: a soft "listening" glass lens
  logo: ({size=22,...r}={}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...r}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/>
      <path d="M8.5 12a3.5 3.5 0 0 1 7 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="1.4" fill="currentColor"/>
    </svg>
  ),
  eyeOff: I(<>
    <path d="M3 3l18 18"/>
    <path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c5 0 9 5 9 7a12.3 12.3 0 0 1-2.2 2.7"/>
    <path d="M6.5 6.6C3.9 8.1 3 11 3 12c0 2 4 7 9 7a9.6 9.6 0 0 0 3.6-.7"/>
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>
  </>),
  eye: I(<>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/>
    <circle cx="12" cy="12" r="3"/>
  </>),
  repeat: I(<>
    <path d="M17 2l3 3-3 3"/>
    <path d="M4 11V9a4 4 0 0 1 4-4h12"/>
    <path d="M7 22l-3-3 3-3"/>
    <path d="M20 13v2a4 4 0 0 1-4 4H4"/>
  </>),
  play: ({size=20,...r}={}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...r}>
      <path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5z"/>
    </svg>
  ),
  pause: ({size=20,...r}={}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...r}>
      <rect x="6" y="5" width="4" height="14" rx="1.3"/><rect x="14" y="5" width="4" height="14" rx="1.3"/>
    </svg>
  ),
  volume: I(<>
    <path d="M11 5L6 9H3v6h3l5 4V5z"/>
    <path d="M16 9a3 3 0 0 1 0 6"/>
    <path d="M18.5 6.5a6.5 6.5 0 0 1 0 11"/>
  </>),
  gear: I(<>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4.6 15H4a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V4a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5.9z"/>
  </>),
  expand: I(<><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></>),
  sliders: I(<><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></>),
  stop: ({size=14,...r}={}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...r}><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>
  ),
  x: I(<path d="M18 6L6 18M6 6l12 12"/>),
  chevDown: I(<path d="M6 9l6 6 6-6"/>),
  chevUp: I(<path d="M18 15l-6-6-6 6"/>),
  drag: I(<><circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none"/></>),
  sparkle: I(<><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M18 15l.7 1.9L20.5 18l-1.8.7L18 20.5l-.7-1.8L15.5 18l1.8-.7z"/></>),
  thumb: ({size=22,...r}={}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" {...r}><path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3zm0 0l4-8a2 2 0 0 1 2 2v4h5.5a2 2 0 0 1 2 2.4l-1.3 6A2 2 0 0 1 18.2 20H7"/></svg>),
  coin: ({size=22,...r}={}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...r}><path d="M12 2L2 8l10 6 10-6-10-6z"/><path d="M4 11l8 5 8-5M4 15l8 5 8-5"/></svg>),
  star: ({size=22,...r}={}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" {...r}><path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.8 6.2 21l1.1-6.5L2.6 9.8l6.5-.9z"/></svg>),
  share: ({size=22,...r}={}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...r}><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/></svg>),
  headphone: I(<><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2z"/><path d="M20 14a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2z"/></>),
  list: I(<><line x1="8" y1="7" x2="20" y2="7"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="8" y1="17" x2="15" y2="17"/><circle cx="4" cy="7" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="17" r="1" fill="currentColor" stroke="none"/></>),
  chevRight: I(<path d="M9 6l6 6-6 6"/>),
};

Object.assign(window, { Icons });
