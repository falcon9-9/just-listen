const transcriptLines = [
  { id: 1, start: 31.0, end: 34.1, time: "00:31", en: "I wasn't expecting this.", zh: "我没想到会这样。" },
  { id: 2, start: 34.1, end: 38.8, time: "00:34", en: "It's actually much bigger than I imagined.", zh: "其实比我想象中大得多。" },
  { id: 3, start: 38.8, end: 42.2, time: "00:39", en: "Let's go inside.", zh: "我们进去吧。" },
  { id: 4, start: 42.2, end: 46.6, time: "00:42", en: "Wait. Did you hear that?", zh: "等等，你听到了吗？" },
  { id: 5, start: 46.6, end: 51.5, time: "00:47", en: "I didn't mean for this to happen.", zh: "我不是故意让事情变成这样的。" },
  { id: 6, start: 51.5, end: 55.1, time: "00:52", en: "We should keep moving.", zh: "我们应该继续走。" }
];

const speedOptions = [0.5, 0.75, 1, 1.25];
const repeatOptions = [1, 2, 3, Infinity];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const formatTime = (value) => {
  const total = Math.max(0, Math.floor(value));
  const minutes = Math.floor(total / 60).toString().padStart(2, "0");
  const seconds = (total % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

Object.assign(window, {
  transcriptLines,
  speedOptions,
  repeatOptions,
  clamp,
  formatTime
});
