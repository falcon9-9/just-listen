/* ============================================================
   data.jsx — mock content + helpers
   The scene matches the provided frame: a gentle anime moment
   (Re:Zero, Chinese burned-in subtitles). Transcript is the
   spoken dialogue with per-line timing; `trans` is the meaning
   shown on Reveal / on the active line.
   ============================================================ */

const VIDEO = {
  title: "【从零开始的异世界生活 第四季 夺还篇】全8话 4K超清（未删减版）",
  up: "青の珊瑚礁",
  followers: "14.8万",
  sign: "啊～我的爱，已随那南风远去～",
  plays: "1.1万",
  danmaku: "110",
  date: "2026-08-27 18:50:00",
  duration: 2344, // 39:04
};

// each line: start/end seconds, original spoken text, meaning (shown on reveal)
const TRANSCRIPT = [
  { start: 236, end: 240, text: "你终于醒了。", trans: "You're finally awake." },
  { start: 240, end: 245, text: "我等了好久。", trans: "I waited a long time." },
  { start: 245, end: 249, text: "怎么一直不说话？", trans: "Why have you been so quiet?" },
  { start: 249, end: 254, text: "你这什么表情？", trans: "What's with that face?" },
  { start: 254, end: 259, text: "我还以为你不记得我了。", trans: "I thought you'd forgotten me." },
  { start: 259, end: 263, text: "怎么可能忘记你。", trans: "How could I ever forget you." },
  { start: 263, end: 268, text: "那就好。", trans: "Then it's alright." },
  { start: 268, end: 274, text: "我们走吧，天快亮了。", trans: "Let's go — it's almost dawn." },
];

// recommendations for the sidebar
const RECS = [
  { title: "4K蓝光【从零开始的异世界生活 第四季】全19话（周更）", up: "小柔追番", dur: "7:51:29", plays: "9.1万", dm: "3781", tag: "4KHDR" },
  { title: "【杀戮尖塔 第四季】全19集 超清中字（未删减版）周更", up: "后宫补番", dur: "8:14:40", plays: "4.4万", dm: "341", tag: "" },
  { title: "【从零开始的异世界生活 第四季】全19话 超清中字（未删减版）", up: "修复4K放映馆", dur: "7:16:34", plays: "1943", dm: "5", tag: "" },
  { title: "4K简中【从零开始的异世界生活 第四季】全19话 未删减", up: "追番少女", dur: "6:58:12", plays: "8721", dm: "62", tag: "4K" },
];

const EPISODES = [
  { name: "第1话", time: "39:04", active: true },
  { name: "第2话", time: "45:52" },
  { name: "第3话", time: "40:32" },
  { name: "更新中", time: "06:05:35", dim: true },
];

function fmt(sec){
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec/3600);
  const m = Math.floor((sec%3600)/60);
  const s = sec%60;
  const mm = String(m).padStart(2,"0");
  const ss = String(s).padStart(2,"0");
  return h>0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function activeIndexFor(t){
  for(let i=0;i<TRANSCRIPT.length;i++){
    if(t >= TRANSCRIPT[i].start && t < TRANSCRIPT[i].end) return i;
  }
  return -1;
}

Object.assign(window, { VIDEO, TRANSCRIPT, RECS, EPISODES, fmt, activeIndexFor });
