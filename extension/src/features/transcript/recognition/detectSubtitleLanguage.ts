import type { TranscriptSegment } from "../model";

export type SubtitleLanguage =
  | "unknown"
  | "zh"
  | "ja"
  | "en"
  | "ko"
  | "cyrillic"
  | "arabic";

export type SubtitleLanguageResult = {
  confidence: number;
  label: string;
  language: SubtitleLanguage;
};

const LANGUAGE_LABELS: Record<SubtitleLanguage, string> = {
  arabic: "阿拉伯文",
  cyrillic: "西里尔文",
  en: "英文/拉丁文",
  ja: "日文",
  ko: "韩文",
  unknown: "检测中",
  zh: "中文"
};

function countMatches(text: string, pattern: RegExp) {
  return text.match(pattern)?.length ?? 0;
}

export function detectSubtitleLanguage(
  segments: TranscriptSegment[]
): SubtitleLanguageResult {
  const text = segments
    .slice(-12)
    .map((segment) => segment.text)
    .join("");

  const counts: Record<Exclude<SubtitleLanguage, "unknown">, number> = {
    arabic: countMatches(text, /\p{Script=Arabic}/gu),
    cyrillic: countMatches(text, /\p{Script=Cyrillic}/gu),
    en: countMatches(text, /\p{Script=Latin}/gu),
    ja:
      countMatches(text, /\p{Script=Hiragana}/gu) +
      countMatches(text, /\p{Script=Katakana}/gu),
    ko: countMatches(text, /\p{Script=Hangul}/gu),
    zh: countMatches(text, /\p{Script=Han}/gu)
  };

  if (counts.ja > 0) {
    counts.ja += counts.zh;
    counts.zh = 0;
  }

  const ranked = Object.entries(counts).sort((left, right) => right[1] - left[1]);
  const [language, hits] = ranked[0] as [keyof typeof counts, number];
  const total = ranked.reduce((sum, entry) => sum + entry[1], 0);

  if (hits < 2 || total === 0) {
    return { confidence: 0, label: LANGUAGE_LABELS.unknown, language: "unknown" };
  }

  return {
    confidence: Math.round((hits / total) * 100),
    label: LANGUAGE_LABELS[language],
    language
  };
}
